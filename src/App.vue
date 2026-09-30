<template>
  <RouterView />
  <Toaster rich-colors position="top-right" :close-button="true" />
  <PwaInstallPrompt />
</template>

<script setup>
import { onBeforeUnmount, onMounted } from 'vue'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'vue-sonner'
import { RUNTIME_API_ERROR_EVENT } from '@/config/api'
import PwaInstallPrompt from '@/components/pwa/PwaInstallPrompt.vue'

function handleRuntimeApiError(event) {
  const { code, message } = event.detail || {}
  if (code === 'endpoint_disabled') {
    toast.error('Endpoint unavailable', { description: message })
    return
  }

  toast.error('API configuration update failed', { description: message })
}

onMounted(() => window.addEventListener(RUNTIME_API_ERROR_EVENT, handleRuntimeApiError))
onBeforeUnmount(() => window.removeEventListener(RUNTIME_API_ERROR_EVENT, handleRuntimeApiError))
</script>
