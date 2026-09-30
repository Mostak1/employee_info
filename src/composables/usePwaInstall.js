import { ref, computed } from 'vue'

const deferredPrompt = ref(null)
const isInstalled = ref(false)
const isDismissed = ref(false)
const showIOSInstructions = ref(false)
const showGenericInstructions = ref(false)
const isInitialized = ref(false)

const DISMISS_KEY = 'carenet_pwa_prompt_dismissed_until'
const COOLDOWN_SECONDS = 30
let dismissTimer = null

function scheduleReappear(seconds = COOLDOWN_SECONDS) {
  if (typeof window === 'undefined') return
  if (dismissTimer) {
    clearTimeout(dismissTimer)
    dismissTimer = null
  }
  const secs = typeof seconds === 'number' && !Number.isNaN(seconds) ? seconds : COOLDOWN_SECONDS
  dismissTimer = setTimeout(() => {
    isDismissed.value = false
    localStorage.removeItem(DISMISS_KEY)
  }, Math.max(secs, 1) * 1000)
}

function checkIsInstalled() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  )
}

function checkIsIOS() {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent.toLowerCase()
  return /iphone|ipad|ipod/.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
}

function checkIsDismissed() {
  if (typeof window === 'undefined') return false
  const dismissedUntil = localStorage.getItem(DISMISS_KEY)
  if (!dismissedUntil) return false
  const timestamp = parseInt(dismissedUntil, 10)
  const remaining = timestamp - Date.now()
  
  if (Number.isNaN(timestamp) || remaining <= 0) {
    localStorage.removeItem(DISMISS_KEY)
    return false
  }
  
  // Clamp any legacy/longer timestamp to max 30s
  const waitSeconds = Math.min(Math.ceil(remaining / 1000), COOLDOWN_SECONDS)
  scheduleReappear(waitSeconds)
  return true
}

export function usePwaInstall() {
  if (!isInitialized.value && typeof window !== 'undefined') {
    isInitialized.value = true
    isInstalled.value = checkIsInstalled()
    isDismissed.value = checkIsDismissed()

    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent standard mini-infobar on mobile Chrome
      e.preventDefault()
      deferredPrompt.value = e
    })

    window.addEventListener('appinstalled', () => {
      if (dismissTimer) clearTimeout(dismissTimer)
      deferredPrompt.value = null
      isInstalled.value = true
      showIOSInstructions.value = false
      showGenericInstructions.value = false
      localStorage.removeItem(DISMISS_KEY)
    })

    // Listen for display mode changes (e.g. user installed and opened in standalone)
    try {
      const matcher = window.matchMedia('(display-mode: standalone)')
      matcher.addEventListener('change', (e) => {
        isInstalled.value = e.matches
      })
    } catch {
      // Ignore older browser matchMedia error
    }
  }

  const isIOS = computed(() => checkIsIOS())
  
  // Show banner whenever not installed and not currently in the 30s dismiss cooldown
  const canShowBanner = computed(() => {
    if (isInstalled.value || isDismissed.value) return false
    return true
  })

  async function promptInstall() {
    if (deferredPrompt.value) {
      try {
        await deferredPrompt.value.prompt()
        const choiceResult = await deferredPrompt.value.userChoice
        if (choiceResult?.outcome === 'accepted') {
          deferredPrompt.value = null
          isInstalled.value = true
        } else {
          // If user cancels the prompt, dismiss for 30s
          dismiss(COOLDOWN_SECONDS)
        }
      } catch (err) {
        console.warn('PWA install prompt failed:', err)
      }
    } else if (isIOS.value) {
      showIOSInstructions.value = true
    } else {
      showGenericInstructions.value = true
    }
  }

  function dismiss(cooldownSeconds = COOLDOWN_SECONDS) {
    const secs = typeof cooldownSeconds === 'number' && !Number.isNaN(cooldownSeconds) ? cooldownSeconds : COOLDOWN_SECONDS
    isDismissed.value = true
    const expireAt = Date.now() + secs * 1000
    localStorage.setItem(DISMISS_KEY, expireAt.toString())
    scheduleReappear(secs)
  }

  return {
    deferredPrompt,
    isInstalled,
    isIOS,
    isDismissed,
    canShowBanner,
    showIOSInstructions,
    showGenericInstructions,
    promptInstall,
    dismiss,
  }
}
