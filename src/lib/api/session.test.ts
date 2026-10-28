import axios, { AxiosError, type AxiosAdapter, type InternalAxiosRequestConfig } from 'axios'
import { afterAll, beforeEach, expect, it, vi } from 'vitest'
import type { User } from './types'

const savedAdapter = axios.defaults.adapter
let transport: AxiosAdapter
axios.defaults.adapter = config => transport(config)
const reply = (config: InternalAxiosRequestConfig, data: unknown, status = 200) => ({ config, data, status, statusText: 'Test', headers: {} })
function fail(config: InternalAxiosRequestConfig, status: number): never {
  throw new AxiosError('Test failure', 'ERR_BAD_RESPONSE', config, undefined, reply(config, { message: 'Test failure' }, status))
}
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(r => { resolve = r })
  return { promise, resolve }
}
async function openSession() {
  const { api } = await import('./client')
  const { useAuthStore } = await import('@/store/auth')
  useAuthStore.getState().setSession({ user: { id: 'user-a', role: 'client' } as User, accessToken: 'access-old', refreshToken: 'refresh-old' })
  return { api, store: useAuthStore }
}
beforeEach(() => {
  vi.resetModules()
  localStorage.clear()
  Object.defineProperty(navigator, 'locks', { configurable: true, value: undefined })
})
afterAll(() => { axios.defaults.adapter = savedAdapter })

it.each([503, 429, 'network'] as const)('conserve la session sur erreur temporaire %s et remonte la vraie cause', async failure => {
  transport = async config => {
    if (config.url === '/auth/refresh') {
      if (failure === 'network') throw new AxiosError('Offline', 'ERR_NETWORK', config)
      fail(config, failure)
    }
    fail(config, 401)
  }
  const { api, store } = await openSession()
  await expect(api.get('/client/parcels')).rejects.toMatchObject({ status: failure === 'network' ? 0 : failure })
  expect(store.getState().refreshToken).toBe('refresh-old')
})

it('efface la session uniquement quand le refresh est definitivement refuse', async () => {
  transport = async config => fail(config, 401)
  const { api, store } = await openSession()
  await expect(api.get('/auth/me')).rejects.toMatchObject({ status: 401 })
  expect(store.getState().accessToken).toBeNull()
})

it('preserve les jetons face a une reponse de refresh malformee', async () => {
  transport = async config => config.url === '/auth/refresh' ? reply(config, {}) : fail(config, 401)
  const { api, store } = await openSession()
  await expect(api.get('/auth/me')).rejects.toMatchObject({ status: 502 })
  expect(store.getState().refreshToken).toBe('refresh-old')
})

it('renouvelle /auth/me et les requetes concurrentes une seule fois', async () => {
  let refreshCount = 0
  transport = async config => {
    if (config.url === '/auth/refresh') {
      refreshCount++
      return reply(config, { accessToken: 'access-new', refreshToken: 'refresh-new' })
    }
    if (config.headers.get('Authorization') === 'Bearer access-old') fail(config, 401)
    return reply(config, { success: true })
  }
  const { api, store } = await openSession()
  await Promise.all([api.get('/auth/me'), api.get('/client/parcels'), api.get('/notifications')])
  expect(refreshCount).toBe(1)
  expect(store.getState().refreshToken).toBe('refresh-new')
})

it('un 401 tardif reutilise le nouveau token au lieu de le renouveler encore', async () => {
  const late = deferred<void>()
  const sent = deferred<void>()
  let refreshCount = 0
  transport = async config => {
    if (config.url === '/auth/refresh') {
      refreshCount++
      return reply(config, { accessToken: 'access-new', refreshToken: 'refresh-new' })
    }
    if (config.headers.get('Authorization') === 'Bearer access-old') {
      if (config.url === '/late') { sent.resolve(); await late.promise }
      fail(config, 401)
    }
    return reply(config, {})
  }
  const { api } = await openSession()
  const pending = api.get('/late')
  await sent.promise
  await api.get('/auth/me')
  late.resolve()
  await pending
  expect(refreshCount).toBe(1)
})

it('une reponse retardataire ne ressuscite pas un logout', async () => {
  const started = deferred<void>()
  const release = deferred<void>()
  transport = async config => {
    if (config.url !== '/auth/refresh') fail(config, 401)
    started.resolve()
    await release.promise
    return reply(config, { accessToken: 'access-new', refreshToken: 'refresh-new' })
  }
  const { api, store } = await openSession()
  const pending = expect(api.get('/auth/me')).rejects.toMatchObject({ code: 'SESSION_CHANGED' })
  await started.promise
  store.getState().clearSession()
  release.resolve()
  await pending
  expect(store.getState().accessToken).toBeNull()
})

it('le refus dun ancien refresh ne ferme pas une nouvelle connexion', async () => {
  const started = deferred<void>()
  const release = deferred<void>()
  transport = async config => {
    if (config.url === '/auth/refresh') { started.resolve(); await release.promise }
    fail(config, 401)
  }
  const { api, store } = await openSession()
  const pending = expect(api.get('/auth/me')).rejects.toMatchObject({ status: 401 })
  await started.promise
  store.getState().setSession({ user: { id: 'user-b', role: 'client' } as User, accessToken: 'access-b', refreshToken: 'refresh-b' })
  release.resolve()
  await pending
  expect(store.getState().refreshToken).toBe('refresh-b')
})

it('relit les jetons de lautre onglet apres acquisition du verrou navigateur', async () => {
  let refreshCount = 0
  transport = async config => {
    if (config.url === '/auth/refresh') refreshCount++
    if (config.headers.get('Authorization') === 'Bearer access-old') fail(config, 401)
    return reply(config, {})
  }
  const { api, store } = await openSession()
  const request = vi.fn(async (_name, callback) => {
    // Simule un autre onglet qui termine pendant que celui-ci attend le verrou.
    const persisted = JSON.parse(localStorage.getItem('sendprocolis-auth')!)
    persisted.state.accessToken = 'access-other-tab'
    persisted.state.refreshToken = 'refresh-other-tab'
    localStorage.setItem('sendprocolis-auth', JSON.stringify(persisted))
    return callback()
  })
  Object.defineProperty(navigator, 'locks', { configurable: true, value: { request } })
  await api.get('/auth/me')
  expect(request).toHaveBeenCalledOnce()
  expect(refreshCount).toBe(0)
  expect(store.getState().refreshToken).toBe('refresh-other-tab')
})

it.each(['/auth/google', '/auth/google/link', '/auth/google/phone-otp', '/auth/google/register'])('une erreur Google sur %s ne renouvelle pas la session existante', async url => {
  const requests: string[] = []
  transport = async config => {
    requests.push(config.url!)
    expect(config.headers.get('Authorization')).toBeUndefined()
    fail(config, 401)
  }
  const { api, store } = await openSession()
  await expect(api.post(url, {})).rejects.toMatchObject({ status: 401 })
  expect(requests).toEqual([url])
  expect(store.getState().accessToken).toBe('access-old')
})

it('rejette une réponse métier réussie arrivée après un changement de compte',async()=>{
 const gate=deferred<void>();transport=async config=>{await gate.promise;return reply(config,{parcels:[{id:'private-a'}]})}
 const {api,store}=await openSession();const request=api.get('/client/parcels');await new Promise(r=>setTimeout(r,0))
 store.getState().setSession({user:{id:'user-b',role:'client'} as User,accessToken:'access-b',refreshToken:'refresh-b'});gate.resolve()
 await expect(request).rejects.toMatchObject({code:'SESSION_CHANGED'})
})
