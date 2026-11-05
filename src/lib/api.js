import axios from 'axios'
import { toast } from 'vue-sonner'
import {
  apiRoute,
  DEFAULT_API_BASE_URL,
  normalizeApiBaseUrl,
} from '../config/api'

const initialBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL) || DEFAULT_API_BASE_URL

const api = axios.create({
  baseURL: initialBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

export function configureApi(baseUrl) {
  if (baseUrl) {
    api.defaults.baseURL = normalizeApiBaseUrl(baseUrl) || DEFAULT_API_BASE_URL
  }
}

let sessionExpiredHandler = null

export function registerSessionExpiredHandler(handler) {
  sessionExpiredHandler = typeof handler === 'function' ? handler : null
}

export function runtimeRequest(method, endpointKey, { endpointParams = {}, ...options } = {}) {
  return api.request({
    ...options,
    method,
    url: apiRoute(endpointKey, endpointParams),
  })
}

api.interceptors.request.use((config) => {
  config.headers = config.headers || {}
  const token = localStorage.getItem('carenet_access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isHandlingUnauthorized = false

function isLoginRequest(requestUrl = '') {
  const path = String(requestUrl).split('?')[0].replace(/\/+$/, '')
  return path.includes('/pwa/login') || /\/login$/i.test(path)
}

function getRequestToken(headers = {}) {
  const authorization = headers.get?.('Authorization')
    || headers.Authorization
    || headers.authorization
    || ''

  return String(authorization).replace(/^Bearer\s+/i, '').trim()
}

api.interceptors.response.use(
  (response) => {
    if (isLoginRequest(response.config?.url)) {
      isHandlingUnauthorized = false
    }
    return response
  },
  async (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || ''
      const loginRequest = isLoginRequest(requestUrl)

      if (!loginRequest) {
        // Ignore a delayed 401 from an older request if the employee has since
        // signed in with a different token.
        const requestToken = getRequestToken(error.config?.headers)
        const currentToken = localStorage.getItem('carenet_access_token') || ''

        if (requestToken === currentToken && !isHandlingUnauthorized) {
          isHandlingUnauthorized = true
          toast.error('Session expired', {
            description: 'Your session has ended. Please sign in again.',
          })

          try {
            await sessionExpiredHandler?.()
          } catch {
            // The auth store is already cleared. The router guard will redirect
            // on the next navigation if replacing the current route fails.
          }
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
