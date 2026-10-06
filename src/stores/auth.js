import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { runtimeRequest } from '../lib/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('carenet_access_token'))
  const user = ref(JSON.parse(localStorage.getItem('carenet_user') || 'null'))
  const loading = ref(false)
  const error = ref('')
  const isAuthenticated = computed(() => Boolean(token.value))

  async function login(credentials) {
    loading.value = true
    error.value = ''
    try {
      const { data } = await runtimeRequest('post', 'login', { data: credentials })
      token.value = data.access_token
      localStorage.setItem('carenet_access_token', token.value)
      user.value = data.user || null
      localStorage.setItem('carenet_user', JSON.stringify(user.value))
      return true
    } catch (requestError) {
      error.value = requestError.response?.data?.message || 'Unable to sign in. Please try again.'
      return false
    } finally {
      loading.value = false
    }
  }

  function clearSession() {
    token.value = null
    user.value = null
    localStorage.removeItem('carenet_access_token')
    localStorage.removeItem('carenet_user')
  }

  async function logout() {
    try { await runtimeRequest('post', 'logout') } catch { /* local cleanup still applies */ }
    clearSession()
  }

  async function fetchCurrentUser() {
    const { data } = await runtimeRequest('get', 'me')
    if (data.user) {
      user.value = data.user
      localStorage.setItem('carenet_user', JSON.stringify(user.value))
    }
    return user.value
  }

  return { token, user, loading, error, isAuthenticated, login, logout, clearSession, fetchCurrentUser }
})
