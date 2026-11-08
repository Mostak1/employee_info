import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_APP_BASE || '/'

  return {
    base,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    plugins: [
      vue(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: mode === 'development',
          suppressWarnings: true,
        },
        includeAssets: ['awc.png', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png'],
        workbox: {
          globIgnores: ['**/config.json'],
          runtimeCaching: [
            {
              urlPattern: /\/config\.json$/,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /\/api\/runtime-config\//,
              handler: 'NetworkOnly',
            },
          ],
        },
        manifest: {
          name: 'AWC Employee App',
          short_name: 'AWC Employee App',
          description: 'Employee self-service attendance',
          theme_color: '#0f766e',
          background_color: '#f4f7f9',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: base,
          start_url: base,
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
  }
})
