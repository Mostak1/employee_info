export const API_ENDPOINTS = Object.freeze({
  login: '/auth/login',
  logout: '/auth/logout',
  me: '/me',
  attendance: '/attendance',
})

export const DEFAULT_API_BASE_URL = '/api/v1/pwa'

export function normalizeApiBaseUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return ''
  return value.trim().replace(/\/+$/, '')
}

function buildApiBaseUrl() {
  return normalizeApiBaseUrl(import.meta.env.VITE_API_URL) || DEFAULT_API_BASE_URL
}

export async function loadRuntimeApiBaseUrl() {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}config.json`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    })

    if (response.ok) {
      const config = await response.json()
      const runtimeUrl = normalizeApiBaseUrl(config?.apiBaseUrl)
      if (runtimeUrl) return runtimeUrl
    }
  } catch {
    // Runtime configuration is optional; use the build-time fallback below.
  }

  return buildApiBaseUrl()
}
