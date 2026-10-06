import { ref } from 'vue'

export function useGeolocation() {
  const isSupported = typeof window !== 'undefined' && 'geolocation' in navigator
  const loading = ref(false)
  const coords = ref(null)
  const error = ref(null)
  const isPermissionDenied = ref(false)

  function getCurrentLocation(options = {}) {
    return new Promise((resolve) => {
      if (!isSupported) {
        const message = 'Geolocation is not supported by your browser or device.'
        error.value = message
        resolve({ success: false, error: message, isPermissionDenied: false })
        return
      }

      loading.value = true
      error.value = null
      isPermissionDenied.value = false

      function tryGetPosition(highAccuracy) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            loading.value = false
            const result = {
              latitude: Number(position.coords.latitude.toFixed(6)),
              longitude: Number(position.coords.longitude.toFixed(6)),
              accuracy: position.coords.accuracy,
            }
            coords.value = result
            error.value = null
            isPermissionDenied.value = false
            resolve({ success: true, ...result })
          },
          (err) => {
            if (highAccuracy && (err.code === 2 || err.code === 3)) {
              // Retry with standard accuracy (Wi-Fi/Cellular/IP) for desktop browsers
              tryGetPosition(false)
              return
            }

            loading.value = false
            let message = 'Unable to retrieve location.'
            let denied = false

            if (err.code === 1) {
              denied = true
              isPermissionDenied.value = true
              message = 'Location access is blocked. Please allow location permissions in your browser address bar and try again.'
            } else if (err.code === 2) {
              message = 'Location information is currently unavailable. Please verify GPS / location is enabled.'
            } else if (err.code === 3) {
              message = 'Location request timed out. Please click Re-detect to try again.'
            }

            error.value = message
            resolve({
              success: false,
              error: message,
              isPermissionDenied: denied,
              code: err.code,
            })
          },
          {
            enableHighAccuracy: highAccuracy,
            timeout: highAccuracy ? 10000 : 15000,
            maximumAge: 0,
            ...options,
          },
        )
      }

      tryGetPosition(true)
    })
  }

  return {
    isSupported,
    loading,
    coords,
    error,
    isPermissionDenied,
    getCurrentLocation,
  }
}

