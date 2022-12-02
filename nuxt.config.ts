// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  vite: {
    server: {
      strictPort: true,
      // Reverse Proxy
      // https://github.com/nuxt/framework/issues/1021#issuecomment-947123482
      hmr: {
        protocol: 'wss',
        clientPort: 443,
        path: 'hmr/',
      }
    }
  },
  app: {
    head: {
      title: 'Wuxia Wednesday',
      meta: [
        { name: 'description', content: 'Movie graph explorer' },
      ]
    }
  },
  sourcemap: true,
})
