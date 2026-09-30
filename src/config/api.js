export const API_ENDPOINTS = {
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

export const DEFAULT_API_BASE_URL = '/api'
export const RUNTIME_API_ERROR_EVENT = 'carenet:runtime-api-error'

export function normalizeApiBaseUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  let normalized = value.trim().replace(/\/+$/, '')
  normalized = normalized.replace(/\/v1\/pwa$/i, '').replace(/\/pwa$/i, '')
  return normalized || DEFAULT_API_BASE_URL
}

export function apiRoute(key, params = {}) {
  const template = API_ENDPOINTS[key]
  if (!template) {
    throw new Error(`The API endpoint "${key}" is not registered.`)
  }

  return template.replace(/\{([A-Za-z0-9_.-]+)\}/g, (_, parameter) => {
    if (!Object.prototype.hasOwnProperty.call(params, parameter) || params[parameter] === undefined || params[parameter] === null) {
      throw new Error(`The API endpoint "${key}" requires the "${parameter}" parameter.`)
    }

    return encodeURIComponent(String(params[parameter]))
  })
}

export function emitRuntimeApiError(code, message) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(RUNTIME_API_ERROR_EVENT, {
    detail: { code, message },
  }))
}

export async function loadRuntimeApiConfig() {
  return { baseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_URL) || DEFAULT_API_BASE_URL }
}

export async function refreshRuntimeApiConfig() {
  return loadRuntimeApiConfig()
}

export function setupRuntimeApiRefreshListeners() {
  // No-op for direct API configuration
}

export function getRuntimeApiConfig() {
  return { baseUrl: normalizeApiBaseUrl(import.meta.env.VITE_API_URL) || DEFAULT_API_BASE_URL }
}
