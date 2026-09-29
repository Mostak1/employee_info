import axios from 'axios'
import {
  apiRoute,
  DEFAULT_API_BASE_URL,
  emitRuntimeApiError,
  normalizeApiBaseUrl,
  refreshRuntimeApiConfig,
} from '../config/api'

let runtimeKey = ''

const api = axios.create({
  baseURL: DEFAULT_API_BASE_URL,
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
})

export function configureApi(baseUrl, key = '') {
  api.defaults.baseURL = normalizeApiBaseUrl(baseUrl) || DEFAULT_API_BASE_URL
  runtimeKey = key
}

export function runtimeRequest(method, endpointKey, { endpointParams = {}, ...options } = {}) {
  return api.request({
    ...options,
    method,
    url: apiRoute(endpointKey, endpointParams),
    _runtimeEndpointKey: endpointKey,
    _runtimeEndpointParams: endpointParams,
    _runtimeRetried: false,
  })
}

api.interceptors.request.use((config) => {
  config.headers = config.headers || {}
  const token = localStorage.getItem('carenet_access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (runtimeKey) config.headers['X-Api-Runtime-Key'] = runtimeKey
  else delete config.headers['X-Api-Runtime-Key']
  return config
})

api.interceptors.response.use(undefined, async (error) => {
  const requestConfig = error.config
  const endpointKey = requestConfig?._runtimeEndpointKey

  if (error.response?.status !== 404 || !endpointKey) {
    throw error
  }

  if (requestConfig._runtimeRetried) {
    emitRuntimeApiError('runtime_refresh_failed', 'API configuration update failed. Please try again.')
    throw error
  }

  try {
    const runtime = await refreshRuntimeApiConfig({ force: true })
    configureApi(runtime.baseUrl, runtime.runtimeKey)

    const retryConfig = {
      ...requestConfig,
      baseURL: normalizeApiBaseUrl(runtime.baseUrl) || DEFAULT_API_BASE_URL,
      url: apiRoute(endpointKey, requestConfig._runtimeEndpointParams || {}),
      _runtimeRetried: true,
    }

    return api.request(retryConfig)
  } catch (refreshError) {
    if (refreshError.message?.includes('login endpoint')
      || refreshError.message?.includes('runtime endpoint')
      || refreshError.message?.includes('endpoint is unavailable')) {
      emitRuntimeApiError('endpoint_disabled', 'This API endpoint is currently disabled.')
    } else {
      emitRuntimeApiError('runtime_refresh_failed', 'API configuration update failed. Please try again.')
    }
    throw refreshError
  }
})

export default api
