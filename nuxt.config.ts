import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxt/fonts', '@nuxt/image'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  // @nuxt/fonts downloads DM Sans + DM Serif Display at build time and
  // self-hosts them with proper preload + font-display: swap. Removes the
  // render-blocking <link> to fonts.googleapis.com — big LCP win on 3G/4G.
  fonts: {
    families: [
      { name: 'DM Sans', provider: 'google', weights: [300, 400, 500, 600, 700] },
      { name: 'DM Serif Display', provider: 'google', weights: [400] },
    ],
  },
  image: {
    // Sensible defaults for buyer-facing imagery; pages opt into specific sizes via :sizes
    format: ['avif', 'webp'],
    quality: 80,
  },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8000/api',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',
      title: 'BilletEvent — Billetterie événementielle en Afrique',
      meta: [
        { name: 'description', content: 'BilletEvent est la plateforme de billetterie en ligne pour créer, promouvoir et vendre des billets pour vos événements en Afrique de l\'Ouest.' },
        { property: 'og:site_name', content: 'BilletEvent' },
        { property: 'og:locale', content: 'fr_FR' },
        { name: 'theme-color', content: '#F05A28' },
        { name: 'author', content: 'BilletEvent' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
      ],
    },
  },
})
