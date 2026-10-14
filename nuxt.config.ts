// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: { head: { title: 'Tienda' } },
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@nuxt/icon', '@nuxt/fonts', '@nuxt/image'],
  components: [{ path: '~/components', pathPrefix: false }],
  imports: { dirs: ['composables/**'] },
  css: ['~/assets/css/main.css'],
  routeRules: {
    '/reset-password': {
      headers: {
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
      },
    },
    '/forgot-password': {
      headers: {
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
      },
    },
  },
  runtimeConfig: {
    backendApiBase: 'http://localhost:3001/api',
    public: {
      apiBase: '/api',
    },
  },
})
