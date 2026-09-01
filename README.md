# Vue 3 + Vite

This template should help get you started developing with Vue 3 in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about IDE Support for Vue in the [Vue Docs Scaling up Guide](https://vuejs.org/guide/scaling-up/tooling.html#ide-support).
# employee_info

## API configuration

The PWA loads `public/config.json` at startup. Set `apiBaseUrl` there to change the
backend URL in a deployed build; refresh the app after changing the file. The value
should include the `/api/v1/pwa` path and should not include a trailing slash.

For local development or when the runtime file is unavailable, set `VITE_API_URL` in
`.env.development`. The fallback order is:

1. `public/config.json` → `apiBaseUrl`
2. `VITE_API_URL`
3. `/api/v1/pwa`

Endpoint paths are defined centrally in `src/config/api.js`.
