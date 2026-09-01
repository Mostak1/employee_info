import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import './style.css'
import App from './App.vue'
import router from './router'
import { loadRuntimeApiBaseUrl } from './config/api'
import { configureApi } from './lib/api'

async function bootstrap() {
  const apiBaseUrl = await loadRuntimeApiBaseUrl()
  configureApi(apiBaseUrl)
  registerSW({ immediate: true })

  createApp(App).use(createPinia()).use(router).mount('#app')
}

bootstrap()
