// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },

  nitro: {
    preset: 'node-server'
  },

  compatibilityDate: '2025-01-04'
})