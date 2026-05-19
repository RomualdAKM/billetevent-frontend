<template>
  <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:bg-orange-primary focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold">
    Aller au contenu principal
  </a>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <UiToastContainer />
  <UiBackToTop />
  <UiCookieConsent />
</template>
