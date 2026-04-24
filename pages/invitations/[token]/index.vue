<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const { post } = useApi()

const loading = ref(true)
const accepted = ref(false)
const eventName = ref('')
const errorMessage = ref('')

onMounted(async () => {
  const token = route.params.token as string
  if (!token) {
    loading.value = false
    errorMessage.value = 'Lien d\'invitation invalide.'
    return
  }

  try {
    const res = await post(`/invitations/${token}/accept`)
    const data = res?.data ?? res
    accepted.value = true
    eventName.value = data?.event_name || data?.ticket?.event || data?.event?.title || data?.event?.name || ''
  } catch (err: any) {
    const status = err?.status || err?.response?.status
    const msg = err?.message || err?.data?.message || err?.response?._data?.message || ''

    if (status === 404) {
      errorMessage.value = 'Cette invitation n\'existe pas ou a été supprimée.'
    } else if (status === 410 || msg.toLowerCase().includes('expir')) {
      errorMessage.value = 'Cette invitation a expiré et n\'est plus valide.'
    } else if (status === 409 || msg.toLowerCase().includes('déjà') || msg.toLowerCase().includes('already')) {
      errorMessage.value = 'Cette invitation a déjà été acceptée.'
    } else {
      errorMessage.value = msg || 'Une erreur est survenue lors de l\'acceptation de l\'invitation.'
    }
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="min-h-screen bg-bg-primary flex items-center justify-center px-4 py-16">
    <div class="w-full max-w-md">

      <!-- Loading -->
      <div v-if="loading" class="bg-surface rounded-xl p-10 text-center">
        <div class="w-8 h-8 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin mx-auto mb-5" />
        <p class="text-sm text-text-secondary">Acceptation en cours...</p>
      </div>

      <!-- Success -->
      <div v-else-if="accepted" class="bg-surface rounded-xl px-8 py-10 text-center">
        <div class="w-12 h-12 rounded-full bg-green-dim flex items-center justify-center mx-auto mb-5">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-green-dark">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 class="font-serif text-xl text-text-primary mb-2">Invitation acceptée</h1>
        <p v-if="eventName" class="text-sm font-medium text-text-primary mb-1">{{ eventName }}</p>
        <p class="text-sm text-text-secondary leading-relaxed mb-8">
          Votre billet a été généré et envoyé par email.
        </p>

        <NuxtLink
          to="/"
          class="inline-flex items-center justify-center text-sm font-medium text-text-secondary hover:text-text-primary no-underline transition-colors"
        >
          Retour à l'accueil
        </NuxtLink>
      </div>

      <!-- Error -->
      <div v-else class="bg-surface rounded-xl px-8 py-10 text-center">
        <div class="w-10 h-10 rounded-full bg-red-dim flex items-center justify-center mx-auto mb-5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-red-error">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>

        <h2 class="text-lg font-medium text-text-primary mb-2">Une erreur est survenue</h2>
        <p class="text-sm text-text-secondary mb-8 max-w-sm mx-auto leading-relaxed">{{ errorMessage }}</p>

        <NuxtLink
          to="/"
          class="inline-flex items-center justify-center text-sm font-medium text-text-secondary hover:text-text-primary no-underline transition-colors"
        >
          Retour à l'accueil
        </NuxtLink>
      </div>

    </div>
  </div>
</template>
