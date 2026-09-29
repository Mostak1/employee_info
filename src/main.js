import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import './style.css'
import App from './App.vue'
import router from './router'
import { loadRuntimeApiConfig, setupRuntimeApiRefreshListeners } from './config/api'
import { configureApi } from './lib/api'

async function bootstrap() {
  const runtime = await loadRuntimeApiConfig()
  configureApi(runtime.baseUrl, runtime.runtimeKey)
  setupRuntimeApiRefreshListeners()
  registerSW({ immediate: true })

  createApp(App).use(createPinia()).use(router).mount('#app')
}

bootstrap()
