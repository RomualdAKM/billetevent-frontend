<script setup>
const props = defineProps({
  error: Object
})

const is404 = computed(() => props.error?.statusCode === 404)
const title = computed(() => is404.value ? 'Page introuvable' : 'Erreur serveur')
const message = computed(() => is404.value
  ? "La page que vous recherchez n'existe pas ou a été déplacée."
  : "Une erreur inattendue s'est produite. Veuillez réessayer.")

const handleBack = () => clearError({ redirect: '/' })

const handlePrevious = () => {
  clearError({ redirect: undefined })
  window.history.back()
}
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-bg-primary px-4">
    <div class="text-center max-w-lg">
      <div class="text-[120px] font-bold text-border-light leading-none mb-2 select-none">
        {{ error?.statusCode || 500 }}
      </div>

      <div class="mb-6">
        <svg v-if="is404" width="80" height="80" viewBox="0 0 80 80" fill="none" class="mx-auto text-text-tertiary">
          <rect x="18" y="10" width="44" height="56" rx="4" stroke="currentColor" stroke-width="2.5" fill="none" />
          <line x1="28" y1="26" x2="44" y2="26" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <line x1="28" y1="34" x2="52" y2="34" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <line x1="28" y1="42" x2="48" y2="42" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          <circle cx="40" cy="56" r="6" stroke="currentColor" stroke-width="2" fill="none" />
          <text x="38" y="59" font-size="10" fill="currentColor" font-weight="bold">?</text>
        </svg>
        <svg v-else width="80" height="80" viewBox="0 0 80 80" fill="none" class="mx-auto text-text-tertiary">
          <circle cx="40" cy="40" r="18" stroke="currentColor" stroke-width="2.5" fill="none" />
          <path d="M40 22 L40 18" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          <path d="M40 62 L40 58" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          <path d="M22 40 L18 40" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          <path d="M62 40 L58 40" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          <path d="M34 34 L28 28" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          <path d="M52 52 L46 46" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          <line x1="35" y1="45" x2="45" y2="35" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
          <line x1="32" y1="42" x2="38" y2="48" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </div>

      <h1 class="font-serif text-3xl text-blue-main mb-3">{{ title }}</h1>
      <p class="text-text-secondary text-lg max-w-md text-center mx-auto mb-8">{{ message }}</p>

      <div class="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          class="px-6 py-2.5 rounded-xl bg-orange-primary text-white text-sm font-semibold cursor-pointer border-none transition-colors hover:bg-orange-light"
          @click="handleBack"
        >
          Retour à l'accueil
        </button>
        <button
          class="px-6 py-2.5 rounded-xl bg-transparent border border-border-light text-text-primary text-sm font-semibold cursor-pointer transition-colors hover:bg-bg-surface"
          @click="handlePrevious"
        >
          Page précédente
        </button>
      </div>
    </div>

    <div class="mt-16">
      <NuxtLink to="/" class="flex items-center gap-2 no-underline opacity-50 hover:opacity-80 transition-opacity duration-200">
        <img src="/logo.png" alt="BilletEvent" class="h-6" />
      </NuxtLink>
    </div>
  </div>
</template>
