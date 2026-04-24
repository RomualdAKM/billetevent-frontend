import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  imports: {
    dirs: ['composables/api'],
  },
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
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
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Serif+Display&display=swap',
        },
      ],
    },
  },
})
