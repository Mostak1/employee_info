import axios from 'axios'
import { DEFAULT_API_BASE_URL, normalizeApiBaseUrl } from '../config/api'

const api = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL) || DEFAULT_API_BASE_URL,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
})

export function configureApi(baseUrl) {
  api.defaults.baseURL = normalizeApiBaseUrl(baseUrl) || DEFAULT_API_BASE_URL
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('carenet_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export default api
