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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || ''
      const isLoginRequest = requestUrl.includes('/pwa/login') || requestUrl.endsWith('login')

      if (!isLoginRequest) {
        localStorage.removeItem('carenet_access_token')
        localStorage.removeItem('carenet_user')

        if (!isHandlingUnauthorized) {
          isHandlingUnauthorized = true
          toast.error('Session expired', {
            description: 'Your session has ended. Please sign in again.',
          })

          setTimeout(() => {
            if (window.location.pathname !== '/login') {
              window.location.href = '/login'
            }
            isHandlingUnauthorized = false
          }, 300)
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
