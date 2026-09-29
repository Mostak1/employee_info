const DEFAULT_ENDPOINTS = {
  login: '/pwa/login',
  logout: '/pwa/auth/logout',
  me: '/pwa/me',
  attendance: '/pwa/attendance',
  attendanceCurrentMonth: '/pwa/attendance/current-month',
  leaveBalance: '/pwa/leave-balance',
  upcomingHolidays: '/pwa/holidays/upcoming',
  teamRoster: '/pwa/team-roster',
  profileUpdateRequest: '/pwa/profile-update-request',
  todos: '/pwa/todos',
  todo: '/pwa/todos/{id}',
}

export const API_ENDPOINTS = { ...DEFAULT_ENDPOINTS }
export const DEFAULT_API_BASE_URL = '/api'
export const EXPECTED_SCHEMA_VERSION = 1
export const RUNTIME_API_ERROR_EVENT = 'carenet:runtime-api-error'

const REFRESH_INTERVAL_MS = 30 * 1000

let runtimeConfigUrl = ''
let activeRuntimeConfig = null
let refreshPromise = null
let lastErrorSignature = ''
let lastErrorAt = 0

export function normalizeApiBaseUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  let normalized = value.trim().replace(/\/+$/, '')
  normalized = normalized.replace(/\/v1\/pwa$/i, '').replace(/\/pwa$/i, '')
  return normalized || DEFAULT_API_BASE_URL
}

function resetEndpoints(endpoints) {
  Object.keys(API_ENDPOINTS).forEach((key) => delete API_ENDPOINTS[key])
  Object.entries(endpoints).forEach(([key, path]) => {
    if (typeof path === 'string' && path.startsWith('/') && !path.includes('://')) {
      API_ENDPOINTS[key] = path
    }
  })
}

export function apiRoute(key, params = {}) {
  const template = API_ENDPOINTS[key]
  if (!template) {
    throw new Error(`The API endpoint "${key}" is unavailable in the runtime configuration.`)
  }

  return template.replace(/\{([A-Za-z0-9_.-]+)\}/g, (_, parameter) => {
    if (!Object.prototype.hasOwnProperty.call(params, parameter) || params[parameter] === undefined || params[parameter] === null) {
      throw new Error(`The API endpoint "${key}" requires the "${parameter}" parameter.`)
    }

    return encodeURIComponent(String(params[parameter]))
  })
}

function buildFallbackConfig(staticConfig = {}) {
  resetEndpoints(DEFAULT_ENDPOINTS)

  return {
    baseUrl: normalizeApiBaseUrl(staticConfig.apiBaseUrl)
      || normalizeApiBaseUrl(import.meta.env.VITE_API_URL)
      || DEFAULT_API_BASE_URL,
    runtimeKey: '',
    runtimeConfigUrl: runtimeConfigUrl || staticConfig.runtimeConfigUrl || '',
    lastSuccessfulRefreshAt: 0,
    fromRuntime: false,
  }
}

function validateRuntimeConfig(payload) {
  if (!payload || payload.schema_version !== EXPECTED_SCHEMA_VERSION) {
    throw new Error('The ERP runtime configuration schema is unsupported.')
  }
  if (payload.application !== 'employee_info' || typeof payload.runtime_key !== 'string' || !payload.runtime_key) {
    throw new Error('The ERP runtime configuration belongs to an unexpected application.')
  }
  if (!payload.api || typeof payload.api.base_url !== 'string' || !payload.api.base_url) {
    throw new Error('The ERP runtime configuration does not contain an API base URL.')
  }
  if (!payload.endpoints || typeof payload.endpoints !== 'object' || Array.isArray(payload.endpoints)) {
    throw new Error('The ERP runtime configuration does not contain endpoint definitions.')
  }
  if (!payload.endpoints.login) {
    throw new Error('The ERP login endpoint is disabled or missing.')
  }

  const baseUrl = normalizeApiBaseUrl(payload.api.base_url)
  if (!baseUrl) {
    throw new Error('The ERP runtime configuration does not contain a valid API base URL.')
  }

  Object.entries(payload.endpoints).forEach(([key, path]) => {
    if (typeof path !== 'string' || !path.startsWith('/') || path.includes('://')) {
      throw new Error(`The ERP runtime endpoint "${key}" is invalid.`)
    }
  })

  return { baseUrl, runtimeKey: payload.runtime_key }
}

async function loadStaticConfig() {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}config.json`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (response.ok) return await response.json()
  } catch {
    // The static file is optional for local development.
  }

  return {}
}

function publishRuntimeConfig(config) {
  activeRuntimeConfig = config
  return { ...config }
}

function isTransientRefreshError(error) {
  return error?.name === 'TypeError' || error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED'
}

export function getRuntimeApiConfig() {
  return activeRuntimeConfig ? { ...activeRuntimeConfig } : null
}

export function emitRuntimeApiError(code, message) {
  if (typeof window === 'undefined') return

  const now = Date.now()
  const signature = `${code}:${message}`
  if (signature === lastErrorSignature && now - lastErrorAt < 3000) return

  lastErrorSignature = signature
  lastErrorAt = now
  window.dispatchEvent(new CustomEvent(RUNTIME_API_ERROR_EVENT, {
    detail: { code, message },
  }))
}

export async function refreshRuntimeApiConfig({ force = false } = {}) {
  if (!force && activeRuntimeConfig?.fromRuntime && Date.now() - activeRuntimeConfig.lastSuccessfulRefreshAt < REFRESH_INTERVAL_MS) {
    return getRuntimeApiConfig()
  }

  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const staticConfig = await loadStaticConfig()
    if (typeof staticConfig.runtimeConfigUrl === 'string' && staticConfig.runtimeConfigUrl.trim()) {
      runtimeConfigUrl = staticConfig.runtimeConfigUrl.trim()
    }

    if (!runtimeConfigUrl) {
      if (activeRuntimeConfig) return getRuntimeApiConfig()
      return publishRuntimeConfig(buildFallbackConfig(staticConfig))
    }

    try {
      const response = await fetch(runtimeConfigUrl, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      })

      if (response.status >= 400 && response.status < 500) {
        throw new Error('The ERP runtime configuration is unavailable for this PWA.')
      }
      if (!response.ok) {
        if (activeRuntimeConfig) return getRuntimeApiConfig()
        return publishRuntimeConfig(buildFallbackConfig(staticConfig))
      }

      let payload
      try {
        payload = await response.json()
      } catch {
        throw new Error('The ERP runtime configuration payload is invalid.')
      }
      const validated = validateRuntimeConfig(payload)
      const nextConfig = {
        ...validated,
        runtimeConfigUrl,
        lastSuccessfulRefreshAt: Date.now(),
        fromRuntime: true,
      }

      // Replace the active endpoint map only after the complete payload is valid.
      resetEndpoints(payload.endpoints)
      return publishRuntimeConfig(nextConfig)
    } catch (error) {
      const message = error?.message || ''
      if (message.includes('runtime configuration')
        || message.includes('login endpoint')
        || message.includes('runtime endpoint')) {
        throw error
      }

      if (activeRuntimeConfig || isTransientRefreshError(error)) {
        return activeRuntimeConfig ? getRuntimeApiConfig() : publishRuntimeConfig(buildFallbackConfig(staticConfig))
      }

      throw error
    }
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

export async function loadRuntimeApiConfig() {
  return refreshRuntimeApiConfig({ force: true })
}

export function setupRuntimeApiRefreshListeners() {
  if (typeof window === 'undefined') return

  const refresh = () => {
    if (document.visibilityState === 'hidden') return
    refreshRuntimeApiConfig().catch(() => {
      // Keep the last-known-good configuration during background refreshes.
    })
  }

  window.addEventListener('focus', refresh)
  document.addEventListener('visibilitychange', refresh)
}
