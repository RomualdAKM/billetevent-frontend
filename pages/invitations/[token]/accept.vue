<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const { get, post } = useApi()

const token = route.params.token as string

const loading = ref(true)
const accepting = ref(false)
const invitation = ref<any>(null)
const accepted = ref(false)
const ticketInfo = ref<any>(null)
const errorType = ref<'not_found' | 'already_accepted' | 'expired' | 'cancelled' | 'generic' | null>(null)
const errorMessage = ref('')

const typeLabels: Record<string, string> = {
  vip: 'VIP',
  press: 'Presse',
  partner: 'Partenaire',
}

const formatDate = (iso: string) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const fetchInvitation = async () => {
  if (!token) {
    errorType.value = 'not_found'
    errorMessage.value = 'Lien d\'invitation invalide.'
    loading.value = false
    return
  }

  try {
    const res = await get(`/invitations/${token}`)
    const data = res?.data ?? res

    if (data.expired) {
      errorType.value = 'expired'
      errorMessage.value = 'Cette invitation a expiré. L\'événement est déjà passé.'
      loading.value = false
      return
    }

    if (data.status === 'accepted') {
      errorType.value = 'already_accepted'
      errorMessage.value = 'Cette invitation a déjà été acceptée. Vérifiez votre boîte email pour retrouver votre billet.'
      loading.value = false
      return
    }

    if (data.status === 'cancelled') {
      errorType.value = 'cancelled'
      errorMessage.value = 'Cette invitation a été annulée par l\'organisateur.'
      loading.value = false
      return
    }

    invitation.value = data
  } catch (err: any) {
    const status = err?.status || err?.response?.status
    if (status === 404) {
      errorType.value = 'not_found'
      errorMessage.value = 'Cette invitation n\'existe pas ou a été supprimée.'
    } else {
      errorType.value = 'generic'
      errorMessage.value = err?.message || 'Une erreur est survenue. Veuillez réessayer plus tard.'
    }
  } finally {
    loading.value = false
  }
}

const acceptedEmail = ref('')

const acceptInvitation = async () => {
  accepting.value = true
  try {
    const res = await post(`/invitations/${token}/accept`)
    const data = res?.data ?? res
    accepted.value = true
    ticketInfo.value = data?.ticket || null
    acceptedEmail.value = data?.email || invitation.value?.email || ''
  } catch (err: any) {
    const msg = err?.message || err?.data?.message || err?.response?._data?.message || ''
    if (msg.toLowerCase().includes('plus valide') || msg.toLowerCase().includes('déjà')) {
      errorType.value = 'already_accepted'
      errorMessage.value = 'Cette invitation a déjà été acceptée.'
    } else if (msg.toLowerCase().includes('passé')) {
      errorType.value = 'expired'
      errorMessage.value = 'Cet événement est déjà passé.'
    } else {
      errorType.value = 'generic'
      errorMessage.value = msg || 'Une erreur est survenue lors de l\'acceptation.'
    }
    invitation.value = null
  } finally {
    accepting.value = false
  }
}

onMounted(fetchInvitation)
</script>

<template>
  <div class="min-h-screen bg-bg-primary flex items-center justify-center px-4 py-16">
    <div class="w-full max-w-lg">

      <!-- Loading -->
      <div v-if="loading" class="bg-surface rounded-xl p-10 text-center">
        <div class="w-8 h-8 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin mx-auto mb-5" />
        <p class="text-sm text-text-secondary">Chargement...</p>
      </div>

      <!-- Success -->
      <div v-else-if="accepted" class="bg-surface rounded-xl overflow-hidden">
        <div class="px-8 pt-10 pb-8 text-center">
          <!-- Check icon -->
          <div class="w-12 h-12 rounded-full bg-green-dim flex items-center justify-center mx-auto mb-5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-green-dark">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h1 class="font-serif text-xl text-text-primary mb-2">Invitation acceptée</h1>
          <p class="text-sm text-text-secondary leading-relaxed mb-6">
            Votre billet a été généré et envoyé par email<template v-if="acceptedEmail"> à <span class="font-medium text-text-primary">{{ acceptedEmail }}</span></template>.
          </p>

          <!-- Ticket details -->
          <div v-if="ticketInfo" class="text-left border-t border-border-light pt-6 mb-6">
            <p class="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-4">Récapitulatif</p>
            <div class="space-y-3">
              <div v-if="ticketInfo.event_name" class="flex justify-between items-baseline">
                <span class="text-sm text-text-tertiary">Événement</span>
                <span class="text-sm font-medium text-text-primary">{{ ticketInfo.event_name }}</span>
              </div>
              <div v-if="ticketInfo.pass_name" class="flex justify-between items-baseline">
                <span class="text-sm text-text-tertiary">Pass</span>
                <span class="text-sm text-text-secondary">{{ ticketInfo.pass_name }}</span>
              </div>
              <div v-if="ticketInfo.event_date" class="flex justify-between items-baseline">
                <span class="text-sm text-text-tertiary">Date</span>
                <span class="text-sm text-text-secondary">{{ ticketInfo.event_date }}</span>
              </div>
              <div v-if="ticketInfo.event_location" class="flex justify-between items-baseline">
                <span class="text-sm text-text-tertiary">Lieu</span>
                <span class="text-sm text-text-secondary">{{ ticketInfo.event_location }}</span>
              </div>
              <div v-if="ticketInfo.reference" class="flex justify-between items-baseline">
                <span class="text-sm text-text-tertiary">Référence</span>
                <span class="text-sm font-mono font-medium text-text-primary">{{ ticketInfo.reference }}</span>
              </div>
            </div>
          </div>

          <NuxtLink
            to="/"
            class="inline-flex items-center justify-center text-sm font-medium text-text-secondary hover:text-text-primary no-underline transition-colors"
          >
            Retour à l'accueil
          </NuxtLink>
        </div>
      </div>

      <!-- Invitation details -->
      <div v-else-if="invitation" class="bg-surface rounded-xl overflow-hidden">
        <div class="px-8 pt-10 pb-8">
          <!-- Header -->
          <div class="mb-8">
            <p class="text-sm text-text-tertiary mb-1">Vous êtes invité(e) à</p>
            <h1 class="font-serif text-xl text-text-primary mb-3">{{ invitation.event?.title }}</h1>
            <span class="inline-block text-xs font-medium text-orange-primary bg-orange-dim px-2.5 py-1 rounded">
              {{ typeLabels[invitation.type] || invitation.type }}
            </span>
          </div>

          <!-- Details list -->
          <div class="space-y-3.5 mb-8">
            <div v-if="invitation.event?.date_start" class="flex justify-between items-baseline">
              <span class="text-sm text-text-tertiary">Date</span>
              <span class="text-sm text-text-primary">{{ formatDate(invitation.event.date_start) }}</span>
            </div>
            <div v-if="invitation.event?.location" class="flex justify-between items-baseline">
              <span class="text-sm text-text-tertiary">Lieu</span>
              <span class="text-sm text-text-primary">{{ invitation.event.location }}</span>
            </div>
            <div class="flex justify-between items-baseline">
              <span class="text-sm text-text-tertiary">Billet</span>
              <span class="text-sm text-text-primary">{{ invitation.pass?.name }}</span>
            </div>
          </div>

          <!-- Custom message -->
          <div v-if="invitation.message" class="bg-bg-primary rounded-lg p-4 border-l-3 border-orange-primary mb-8">
            <p class="text-sm text-text-secondary italic leading-relaxed">{{ invitation.message }}</p>
          </div>

          <!-- CTA -->
          <button
            @click="acceptInvitation"
            :disabled="accepting"
            class="w-full bg-orange-primary hover:bg-orange-light text-white font-medium py-2.5 px-6 rounded-lg transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
          >
            <template v-if="accepting">
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Acceptation en cours...
            </template>
            <template v-else>
              Accepter l'invitation
            </template>
          </button>

          <!-- Decline link -->
          <div class="text-center mt-3">
            <NuxtLink
              to="/"
              class="text-xs text-text-tertiary hover:text-text-secondary no-underline transition-colors"
            >
              Refuser
            </NuxtLink>
          </div>

          <!-- Disclaimer -->
          <p class="text-xs text-text-tertiary text-center mt-6">
            En acceptant, un billet gratuit sera généré et envoyé à {{ invitation.email }}.
          </p>
        </div>
      </div>

      <!-- Error states -->
      <div v-else class="bg-surface rounded-xl px-8 py-10 text-center">
        <!-- Already accepted -->
        <template v-if="errorType === 'already_accepted'">
          <div class="w-10 h-10 rounded-full bg-blue-dim flex items-center justify-center mx-auto mb-5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-blue-light">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 class="text-lg font-medium text-text-primary mb-2">Invitation déjà acceptée</h2>
        </template>

        <!-- Expired -->
        <template v-else-if="errorType === 'expired'">
          <div class="w-10 h-10 rounded-full bg-gold-dim flex items-center justify-center mx-auto mb-5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-gold">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h2 class="text-lg font-medium text-text-primary mb-2">Invitation expirée</h2>
        </template>

        <!-- Not found / Cancelled / Generic -->
        <template v-else>
          <div class="w-10 h-10 rounded-full bg-red-dim flex items-center justify-center mx-auto mb-5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-red-error">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </div>
          <h2 class="text-lg font-medium text-text-primary mb-2">Invitation invalide</h2>
        </template>

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
