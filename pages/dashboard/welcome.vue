<script setup lang="ts">
/**
 * Onboarding organisateur — page d'accueil après élévation buyer→organizer.
 * Affichée une seule fois (flag localStorage), puis l'organisateur va directement
 * à /dashboard. Présente une checklist 4 étapes Stripe-style.
 */
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const ONBOARDING_KEY = 'billetevent_organizer_onboarding_v1'
const authStore = useAuthStore()
const api = useOrganizerApi()
const router = useRouter()

const loading = ref(true)
const eventsCount = ref(0)
const firstSaleDone = ref(false)
const firstWithdrawDone = ref(false)
const kycStatus = computed(() => (authStore.user as any)?.kyc_status || 'pending')
const kycDone = computed(() => kycStatus.value === 'validated')

async function loadStatus() {
  loading.value = true
  try {
    // Charge en parallèle : count events + balance pour détecter 1ère vente / retrait
    const [eventsRes, walletRes] = await Promise.all([
      api.getEvents().catch(() => null),
      api.getWalletBalance().catch(() => null),
    ])
    const events = (eventsRes as any)?.data?.data ?? (eventsRes as any)?.data ?? []
    eventsCount.value = Array.isArray(events) ? events.length : 0
    const wallet = (walletRes as any)?.data ?? walletRes
    firstSaleDone.value = (wallet?.total_balance ?? 0) > 0 || (wallet?.lifetime_earnings ?? 0) > 0
    firstWithdrawDone.value = (wallet?.lifetime_withdrawn ?? 0) > 0
  } catch { /* silencieux */ }
  loading.value = false
}

onMounted(async () => {
  // Si déjà passé par l'onboarding, rediriger vers dashboard et stopper
  try {
    if (localStorage.getItem(ONBOARDING_KEY) === '1') {
      await navigateTo('/dashboard')
      return
    }
  } catch { /* silencieux */ }
  await loadStatus()
})

const steps = computed(() => [
  {
    id: 'create',
    title: 'Créez votre premier événement',
    description: 'Titre, date, lieu, billet — en moins de 5 minutes.',
    done: eventsCount.value > 0,
    actionLabel: eventsCount.value > 0 ? 'Voir mes événements' : 'Créer un événement',
    to: eventsCount.value > 0 ? '/dashboard/events' : '/dashboard/events/create',
  },
  {
    id: 'kyc',
    title: 'Validez votre identité (KYC)',
    description: 'Obligatoire pour retirer vos revenus. Pièce d\'identité + un justificatif suffit.',
    done: kycDone.value,
    actionLabel: kycDone.value ? 'KYC validé' : 'Compléter mon KYC',
    to: '/dashboard/kyc',
  },
  {
    id: 'sale',
    title: 'Faites votre première vente',
    description: 'Partagez votre lien sur WhatsApp et les réseaux. La 1ère vente arrive vite.',
    done: firstSaleDone.value,
    actionLabel: firstSaleDone.value ? 'Voir mes ventes' : 'Promouvoir mon événement',
    to: firstSaleDone.value ? '/dashboard/tickets' : '/dashboard/events',
  },
  {
    id: 'withdraw',
    title: 'Recevez votre premier reversement',
    description: 'Une fois votre KYC validé et votre 1ère vente effectuée, retirez sur Wave, Orange Money ou virement.',
    done: firstWithdrawDone.value,
    actionLabel: firstWithdrawDone.value ? 'Voir mon portefeuille' : 'Mon portefeuille',
    to: '/dashboard/wallet',
  },
])

const completedCount = computed(() => steps.value.filter(s => s.done).length)
const progressPercent = computed(() => Math.round((completedCount.value / steps.value.length) * 100))

function finishOnboarding() {
  try { localStorage.setItem(ONBOARDING_KEY, '1') } catch { /* silencieux */ }
  router.push('/dashboard')
}

function skipOnboarding() {
  finishOnboarding()
}
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-6">
    <div class="mb-6">
      <div class="text-sm font-semibold text-orange-primary mb-2">Bienvenue parmi les organisateurs</div>
      <h1 class="font-serif text-2xl md:text-3xl text-text-primary mb-2">Bonjour {{ (authStore.user as any)?.first_name || 'à vous' }}</h1>
      <p class="text-sm text-text-secondary">Voici les 4 étapes pour démarrer sur BilletEvent. Vous pouvez les faire dans l'ordre que vous voulez.</p>
    </div>

    <!-- Progress bar -->
    <div class="bg-surface border border-border-light rounded-xl p-5 mb-5">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm font-bold text-text-primary">{{ completedCount }} / {{ steps.length }} étapes complétées</span>
        <span class="text-xs text-text-tertiary">{{ progressPercent }} %</span>
      </div>
      <div class="h-2 rounded-full bg-surface-2 overflow-hidden">
        <div class="h-full bg-orange-primary transition-all duration-500" :style="{ width: progressPercent + '%' }" />
      </div>
    </div>

    <!-- Steps -->
    <div v-if="loading" class="space-y-3">
      <div v-for="i in 4" :key="i" class="h-24 rounded-xl bg-surface-2 animate-pulse" />
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="(step, i) in steps"
        :key="step.id"
        class="bg-surface border rounded-xl p-5 flex items-start gap-4 transition-colors"
        :class="step.done ? 'border-green-dark bg-green-dim/30' : 'border-border-light'"
      >
        <!-- Icône statut -->
        <div
          class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          :class="step.done ? 'bg-green-dark text-white' : 'bg-surface-2 text-text-tertiary'"
        >
          <svg v-if="step.done" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span v-else class="text-sm font-bold">{{ i + 1 }}</span>
        </div>

        <div class="flex-1 min-w-0">
          <h3 class="text-base font-bold text-text-primary mb-1">{{ step.title }}</h3>
          <p class="text-sm text-text-secondary mb-3">{{ step.description }}</p>
          <NuxtLink
            :to="step.to"
            class="inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
            :class="step.done ? 'text-green-dark hover:text-green-dark/80' : 'text-orange-primary hover:text-orange-light'"
          >
            {{ step.actionLabel }} →
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Bouton "Passer" -->
    <div class="mt-6 flex flex-col sm:flex-row gap-2 items-center justify-between">
      <button
        type="button"
        class="text-sm text-text-tertiary hover:text-orange-primary transition-colors"
        @click="skipOnboarding"
      >
        Passer pour le moment
      </button>
      <NuxtLink
        to="/dashboard"
        class="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-bold bg-orange-primary text-white hover:bg-orange-light transition-colors"
        @click="finishOnboarding"
      >
        Aller au tableau de bord →
      </NuxtLink>
    </div>
  </div>
</template>
