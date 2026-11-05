import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import './style.css'
import App from './App.vue'
import router from './router'
import { registerSessionExpiredHandler } from './lib/api'
import { useAuthStore } from './stores/auth'

registerSW({ immediate: true })

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

registerSessionExpiredHandler(async () => {
  const auth = useAuthStore(pinia)
  auth.clearSession()

  const currentRoute = router.currentRoute.value
  if (currentRoute.name === 'login') return

  await router.replace({
    name: 'login',
    query: { redirect: currentRoute.fullPath },
  })
})

app.mount('#app')
