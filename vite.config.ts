/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'

/** Versionne le worker à partir des bundles et de l'écran de secours, sans
 * dépendance de build supplémentaire ni cache des données de l'utilisateur. */
function pwaPlugin(): Plugin {
  return {
    name: 'procolis-pwa',
    apply: 'build',
    generateBundle(_options, bundle) {
      const source = readFileSync(new URL('./pwa/sw.js', import.meta.url), 'utf-8')
      const hash = createHash('sha256').update(Object.keys(bundle).sort().join('\n') + source)
      // Les icônes non hashées doivent elles aussi invalider le précache.
      for (const file of ['offline.html', 'manifest.webmanifest', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png']) {
        hash.update(readFileSync(new URL(`./public/${file}`, import.meta.url)))
      }
      const version = hash.digest('hex').slice(0, 16)
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: source.replace('__BUILD_VERSION__', version) })
    },
  }
}

function broadcastsPlugin(): Plugin {
  const dataDir = join(process.cwd(), '.broadcasts')
  const dataFile = join(dataDir, 'data.json')

  function load(): unknown[] {
    try {
      if (!existsSync(dataFile)) return []
      return JSON.parse(readFileSync(dataFile, 'utf-8'))
    } catch {
      return []
    }
  }

  function save(body: string) {
    try {
      const parsed = JSON.parse(body)
      if (Array.isArray(parsed.broadcasts)) {
        if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })
        writeFileSync(dataFile, JSON.stringify(parsed.broadcasts, null, 2), 'utf-8')
      }
    } catch { /* ignore */ }
  }

  return {
    name: 'procolis-broadcasts',
    configureServer(server) {
      server.middlewares.use('/api/v1/super-admin/config', (req, res, next) => {
        if (req.method === 'GET') {
          const broadcasts = load()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, config: { broadcasts } }))
          return
        }
        if (req.method === 'PUT') {
          let body = ''
          req.on('data', (chunk: Buffer) => { body += chunk.toString() })
          req.on('end', () => {
            save(body)
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ success: true, config: { broadcasts: load() } }))
          })
          return
        }
        next()
      })

      server.middlewares.use('/api/v1/public/broadcasts', (req, res) => {
        if (req.method === 'GET') {
          const broadcasts = load()
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ success: true, broadcasts }))
          return
        }
        res.statusCode = 405
        res.end()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), broadcastsPlugin(), pwaPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // `hidden` produit les .map sans les référencer dans les bundles servis :
    // les stacks restent symbolisables par Alloy à partir des source maps
    // copiées côté observabilité, sans jamais exposer le code au navigateur.
    // Ces fichiers ne doivent pas être servis par Caddy (voir Caddyfile).
    sourcemap: 'hidden',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
