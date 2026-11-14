#!/usr/bin/env node
// Génère les splash screens iOS à partir d'une couleur unie.
//
// iOS exige un `<link rel="apple-touch-startup-image">` par taille d'écran
// (sinon pas de splash en mode standalone) — un PNG par device, tailles
// imposées par Apple. Ces PNG sont statiques et versionnés dans `public/splash/`.
//
// Pourquoi pas de sharp / jimp / canvas ici :
//   - les splash screens sont des rectangles uniformes à la couleur de thème,
//     pas d'image à compositer : tout le gain d'une lib dédiée est perdu ;
//   - `node:zlib` + un encodage PNG minimal suffisent (<80 lignes) et évitent
//     une dépendance native (sharp ~10 Mo, prebuilds platform-specific).
//
// Lancer :  node scripts/generate-ios-splash.mjs
// La sortie est déterministe (même couleur → mêmes octets) — rejouer ne touche
// le PNG que si la couleur change.

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync, crc32 } from 'node:zlib'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = resolve(__dirname, '..', 'public', 'splash')
mkdirSync(OUT_DIR, { recursive: true })

// Couleur de thème : doit rester alignée avec `theme_color` du manifest et
// `meta[name="theme-color"]` de index.html.
const BG = [0x01, 0x89, 0x82, 0xff] // RGBA #018982

// Tailles iOS retenues (orientation portrait native + une variante paysage
// pour iPad). Couvre iPhone SE à Pro Max + iPad 9.7" à Pro 12.9".
const SIZES = [
  { w: 1290, h: 2796 }, // iPhone 14 Pro Max / 15 Pro Max
  { w: 1179, h: 2556 }, // iPhone 14 Pro / 15 Pro
  { w: 1284, h: 2778 }, // iPhone 14 Plus / 13 Pro Max
  { w: 1170, h: 2532 }, // iPhone 14 / 13 / 13 Pro / 12 Pro
  { w: 1125, h: 2436 }, // iPhone 11 Pro / X / Xs
  { w: 828, h: 1792 },  // iPhone 11 / Xr
  { w: 750, h: 1334 },  // iPhone 8 / SE 2
  { w: 2048, h: 2732 }, // iPad Pro 12.9"
  { w: 1668, h: 2388 }, // iPad Pro 11"
  { w: 1620, h: 2160 }, // iPad 10.2"
  { w: 1536, h: 2048 }, // iPad 9.7" / mini
]

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])) >>> 0, 0)
  return Buffer.concat([length, typeBuf, data, crcBuf])
}

function makeSolidPng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr.writeUInt8(8, 8)   // bit depth
  ihdr.writeUInt8(6, 9)   // colour type: RGBA
  ihdr.writeUInt8(0, 10)  // compression
  ihdr.writeUInt8(0, 11)  // filter
  ihdr.writeUInt8(0, 12)  // interlace

  // `scanlines` = { filter=0, row bytes }. Une ligne de width pixels RGBA
  // (4 octets par pixel) préfixée par un octet de filtre "None" (0).
  const rowLength = 1 + width * 4
  const scanlines = Buffer.alloc(rowLength * height)
  for (let y = 0; y < height; y += 1) {
    const offset = y * rowLength
    scanlines[offset] = 0
    for (let x = 0; x < width; x += 1) {
      const px = offset + 1 + x * 4
      scanlines[px] = rgba[0]
      scanlines[px + 1] = rgba[1]
      scanlines[px + 2] = rgba[2]
      scanlines[px + 3] = rgba[3]
    }
  }
  const idat = deflateSync(scanlines, { level: 9 })

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

let total = 0
for (const { w, h } of SIZES) {
  const png = makeSolidPng(w, h, BG)
  const filename = `apple-splash-${w}x${h}.png`
  writeFileSync(resolve(OUT_DIR, filename), png)
  total += 1
  process.stdout.write(`generated ${filename} (${png.length} bytes)\n`)
}
process.stdout.write(`${total} splash screens written to ${OUT_DIR}\n`)
