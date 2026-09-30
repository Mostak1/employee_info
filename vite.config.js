import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  // base: '/crm/employee_info/',
  base: './',
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
        enabled: true,
      },
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png'],
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
        name: 'Carenet HRM',
        short_name: 'Carenet HRM',
        description: 'Employee self-service attendance',
        theme_color: '#0f766e',
        background_color: '#f4f7f9',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/crm/employee_info/',
        start_url: '/crm/employee_info/',
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
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
})
