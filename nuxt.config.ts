
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,

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
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
        { rel: 'preconnect', crossorigin: 'anonymous', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', crossorigin: 'anonymous', href: 'https://fonts.gstatic.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400&display=swap', crossorigin: 'anonymous' },
      ],
      htmlAttrs: {
        lang: 'en',
      },
    },
  },

  sourcemap: true,
  modules: ['@vite-pwa/nuxt'],

  pwa: {
    devOptions: {
      enabled: process.env.NODE_ENV === 'development',
    },
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
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        },
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'gstatic-fonts-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365 // <== 365 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            },
          }
        },
        {
          urlPattern: /^https:\/\/api\.themoviedb\.org\/\d+\/search\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'tmdb-search-cache',
            expiration: {
              maxAgeSeconds: 60 * 60 * 1 // <== 1 hour
            },
            cacheableResponse: {
              statuses: [0, 200]
            },
          }
        },
        {
          urlPattern: /^https:\/\/api\.themoviedb\.org\/\d+\/movie\/popular.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'tmdb-popular-cache',
            expiration: {
              maxAgeSeconds: 60 * 60 * 24 * 1 // <== 1 day
            },
            cacheableResponse: {
              statuses: [0, 200]
            },
          }
        },
        {
          urlPattern: /^https:\/\/api\.themoviedb\.org\/\d+\/(?:movie|person)\/(?!.*popular).*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'tmdb-api-cache',
            expiration: {
              maxAgeSeconds: 60 * 60 * 24 * 30 // <== 30 days
            },
            cacheableResponse: {
              statuses: [0, 200]
            },
          }
        },
      ],
    },
  },

  compatibilityDate: '2024-11-20'
});