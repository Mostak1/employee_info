# employee_info

## API configuration

The PWA loads `public/config.json` at startup. Set `runtimeConfigUrl` there to the
location-specific ERP runtime configuration endpoint. The ERP response supplies
the normalized `/api` root, endpoint paths, and runtime key. The PWA refreshes this
configuration automatically at startup, on focus, on visibility changes, and after
a runtime API `404`.

For local development or when the runtime file is unavailable, the fallback order is:

1. ERP runtime configuration from `runtimeConfigUrl`
2. `public/config.json` -> `apiBaseUrl`
3. `VITE_API_URL`
4. `/api`

Endpoint paths are accessed by endpoint key through `apiRoute()` in
`src/config/api.js`. Runtime requests use `runtimeRequest()` so changed routes can
be rebuilt and retried once. Every runtime-configured request sends
`X-Api-Runtime-Key`.
