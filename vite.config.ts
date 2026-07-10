import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { getHttpsServerOptions } from 'office-addin-dev-certs'

// The Office task pane MUST be served over HTTPS for Word to load it. We reuse
// the locally-trusted development certificate that `office-addin-dev-certs`
// installs (run `npm run cert` once). Same-origin `/api/*` requests are proxied
// to the Python analysis bridge on :8000, so the pane never makes a cross-origin
// call — no CORS, no mixed content.
export default defineConfig(async () => {
  const https = await getHttpsServerOptions().catch((e: unknown) => {
    throw new Error(
      'HTTPS dev certificate not available. Run `npm run cert` once ' +
        '(office-addin-dev-certs install), then retry `npm run dev`. Original: ' +
        String(e),
    )
  })

  return {
    base: './',
    plugins: [react()],
    server: {
      port: 3000,
      strictPort: true,
      https,
      proxy: {
        '/api': { target: 'http://localhost:8000', changeOrigin: true },
      },
    },
  }
})
