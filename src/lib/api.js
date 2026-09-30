import axios from 'axios'
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

export default api
