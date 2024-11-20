
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // ssr: false,

  devServer: {
    host: '0.0.0.0',
  },

  app: {
    head: {
      title: 'Wuxia Wednesday',
      meta: [
        { name: 'description', content: 'Movie graph explorer' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#000000' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'mask-icon', href: '/mask-icon.svg', color: '#000000' },
      ],
      htmlAttrs: {
        lang: 'en',
      },
    },
  },

  sourcemap: true,
  modules: ['@vite-pwa/nuxt'],

  pwa: {
    // devOptions: {
    //   enabled: true
    // },
    includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
    manifest: {
      name: 'Wuxia Wednesday',
      short_name: 'Wuxia',
      description: 'Movie graph explorer',
      theme_color: '#000000',
      background_color: '#000000',
      display: 'standalone',
      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
  },

  compatibilityDate: '2024-11-20'
});