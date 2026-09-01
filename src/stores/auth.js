import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import api from '../lib/api'
import { API_ENDPOINTS } from '../config/api'

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
      const { data } = await api.post(API_ENDPOINTS.login, credentials)
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

  async function logout() {
    try { await api.post(API_ENDPOINTS.logout) } catch { /* local cleanup still applies */ }
    token.value = null
    localStorage.removeItem('carenet_access_token')
    localStorage.removeItem('carenet_user')
    user.value = null
  }

  async function fetchCurrentUser() {
    const { data } = await api.get(API_ENDPOINTS.me)
    if (data.user) {
      user.value = data.user
      localStorage.setItem('carenet_user', JSON.stringify(user.value))
    }
    return user.value
  }

  return { token, user, loading, error, isAuthenticated, login, logout, fetchCurrentUser }
})
