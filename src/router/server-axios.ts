import { calculateIvLocal, calculateTeamLocal } from '@/local/calculator'
import axios, { type AxiosInstance } from 'axios'

/**
 * Lab's frontend talks to `/api`. This build has no server: calculator routes run
 * the vendored simulation on-device, and account/cloud routes are no-ops.
 */
const serverAxios: AxiosInstance = axios.create({
  baseURL: '/api/',
  timeout: 120000,
  adapter: async (config) => {
    const url = String(config.url ?? '').replace(/^\//, '')
    const method = String(config.method ?? 'get').toLowerCase()
    const data = typeof config.data === 'string' && config.data ? JSON.parse(config.data) : config.data
    try {
      const body = await dispatch(method, url, data)
      return {
        data: body,
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'local calc failed'
      return Promise.reject({
        message,
        config,
        response: { status: 400, data: { message }, headers: {}, config }
      })
    }
  }
})

async function dispatch(method: string, url: string, data: unknown) {
  if (method === 'post' && (url === 'calculator/team' || url === '/calculator/team')) {
    return calculateTeamLocal(data as never)
  }
  if (method === 'post' && (url === 'calculator/iv' || url === '/calculator/iv')) {
    return calculateIvLocal(data as never)
  }
  if (url.startsWith('login') || url.startsWith('admin') || url.startsWith('friend') || url.startsWith('notifications')) {
    return { offline: true }
  }
  return {}
}

export default serverAxios
