<script setup lang="ts">
type ConsentRecord = {
  essential: true
  analytics: boolean
  marketing: boolean
  updatedAt: string
}

const STORAGE_KEY = 'billetevent_cookie_consent_v2'
const LEGACY_KEY = 'billetevent_cookie_consent'

const show = ref(false)
const showPreferences = ref(false)
const analytics = ref(false)
const marketing = ref(false)

const readStored = (): ConsentRecord | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ConsentRecord) : null
  } catch {
    return null
  }
}

const persist = (record: ConsentRecord) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record))
  // Clean up the legacy boolean flag so the user is not prompted again
  localStorage.removeItem(LEGACY_KEY)
}

onMounted(() => {
  const existing = readStored()
  if (existing) {
    analytics.value = !!existing.analytics
    marketing.value = !!existing.marketing
    return
  }
  // Migrate users who already answered the previous all-or-nothing banner
  const legacy = localStorage.getItem(LEGACY_KEY)
  if (legacy === 'accepted') {
    persist({ essential: true, analytics: true, marketing: true, updatedAt: new Date().toISOString() })
    analytics.value = true
    marketing.value = true
    return
  }
  if (legacy === 'refused') {
    persist({ essential: true, analytics: false, marketing: false, updatedAt: new Date().toISOString() })
    return
  }
  show.value = true
})

const acceptAll = () => {
  analytics.value = true
  marketing.value = true
  persist({ essential: true, analytics: true, marketing: true, updatedAt: new Date().toISOString() })
  show.value = false
  showPreferences.value = false
}

const refuseAll = () => {
  analytics.value = false
  marketing.value = false
  persist({ essential: true, analytics: false, marketing: false, updatedAt: new Date().toISOString() })
  show.value = false
  showPreferences.value = false
}

const saveChoices = () => {
  persist({
    essential: true,
    analytics: analytics.value,
    marketing: marketing.value,
    updatedAt: new Date().toISOString(),
  })
  show.value = false
  showPreferences.value = false
}
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="show"
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
      class="fixed bottom-0 left-0 right-0 z-[100] bg-surface border-t border-border-light px-4 md:px-8 py-5"
    >
      <div class="max-w-[1200px] mx-auto">
        <!-- Simple view -->
        <div v-if="!showPreferences" class="flex flex-col md:flex-row items-start md:items-center gap-4">
          <div class="flex-1">
            <p id="cookie-consent-title" class="text-sm font-semibold text-text-primary mb-1">Vos préférences de cookies</p>
            <p class="text-sm text-text-secondary leading-relaxed">
              Nous utilisons des cookies essentiels au fonctionnement du site, ainsi que des cookies analytiques et marketing optionnels.
              <NuxtLink to="/legal/privacy" class="text-orange-primary font-semibold hover:underline ml-1">En savoir plus</NuxtLink>
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              class="px-4 py-2.5 rounded-lg text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              @click="showPreferences = true"
            >
              Personnaliser
            </button>
            <button
              type="button"
              class="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border-light bg-surface text-text-primary hover:border-text-tertiary transition-colors cursor-pointer"
              @click="refuseAll"
            >
              Refuser
            </button>
            <button
              type="button"
              class="px-5 py-2.5 rounded-lg text-sm font-semibold bg-orange-primary text-white hover:bg-orange-light transition-colors cursor-pointer"
              @click="acceptAll"
            >
              Tout accepter
            </button>
          </div>
        </div>

        <!-- Detailed view -->
        <div v-else class="flex flex-col gap-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-sm font-semibold text-text-primary mb-1">Personnaliser vos cookies</p>
              <p class="text-xs text-text-tertiary">Vous pouvez modifier ces préférences à tout moment depuis votre profil.</p>
            </div>
            <button
              type="button"
              aria-label="Revenir au choix simple"
              class="text-text-tertiary hover:text-text-primary transition-colors p-1 cursor-pointer"
              @click="showPreferences = false"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <!-- Essential (forced on) -->
            <div class="rounded-lg border border-border-light bg-bg-primary p-3.5">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-sm font-semibold text-text-primary">Essentiels</span>
                <span class="text-[0.65rem] uppercase tracking-wider font-bold text-text-tertiary bg-surface-2 px-2 py-0.5 rounded">Toujours actifs</span>
              </div>
              <p class="text-xs text-text-tertiary leading-relaxed">Connexion, panier, sécurité. Indispensables au fonctionnement du site.</p>
            </div>

            <!-- Analytics -->
            <label class="rounded-lg border border-border-light bg-bg-primary p-3.5 cursor-pointer">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-sm font-semibold text-text-primary">Analytiques</span>
                <input
                  v-model="analytics"
                  type="checkbox"
                  class="w-4 h-4 accent-orange-primary cursor-pointer"
                />
              </div>
              <p class="text-xs text-text-tertiary leading-relaxed">Mesure d'audience anonyme pour améliorer le site (Google Analytics, etc.).</p>
            </label>

            <!-- Marketing -->
            <label class="rounded-lg border border-border-light bg-bg-primary p-3.5 cursor-pointer">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="text-sm font-semibold text-text-primary">Marketing</span>
                <input
                  v-model="marketing"
                  type="checkbox"
                  class="w-4 h-4 accent-orange-primary cursor-pointer"
                />
              </div>
              <p class="text-xs text-text-tertiary leading-relaxed">Publicité ciblée et remarketing (Meta Pixel, Google Ads).</p>
            </label>
          </div>

          <div class="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              type="button"
              class="px-4 py-2.5 rounded-lg text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              @click="refuseAll"
            >
              Tout refuser
            </button>
            <button
              type="button"
              class="px-5 py-2.5 rounded-lg text-sm font-semibold border border-border-light bg-surface text-text-primary hover:border-text-tertiary transition-colors cursor-pointer"
              @click="saveChoices"
            >
              Enregistrer mes choix
            </button>
            <button
              type="button"
              class="px-5 py-2.5 rounded-lg text-sm font-semibold bg-orange-primary text-white hover:bg-orange-light transition-colors cursor-pointer"
              @click="acceptAll"
            >
              Tout accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.4s ease, opacity 0.4s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
