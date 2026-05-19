<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()

// Keep the marketing landing layout (no BilletEvent navbar/footer) after
// payment if the buyer arrived via /e/[slug] checkout. The flag is set by
// PayDunya's return_url and by useCheckout's post-payment navigateTo.
if (route.query.from === 'landing') {
  setPageLayout('landing')
}
const authStore = useAuthStore()
const orderId = route.params.id as string
const api = useAccountApi()
const { initPixels, trackPurchase } = useTracking()

// A `token` query param means the buyer arrived through the magic link
// sent by GuestAccountWelcome — fetch the order through the public guest
// route using that token instead of the authenticated route.
const guestToken = computed(() =>
  typeof route.query.token === 'string' ? route.query.token : ''
)
const hasGuestToken = computed(() => guestToken.value.length > 0)
const isGuestView = computed(() => hasGuestToken.value && !authStore.isLoggedIn)
const activateAccountLink = computed(() => {
  const email = order.value?.user?.email || order.value?.guest_email
  return email
    ? `/auth/forgot-password?email=${encodeURIComponent(email)}`
    : '/auth/forgot-password'
})

const loading = ref(true)
const order = ref<Record<string, any> | null>(null)
const purchaseTracked = ref(false)

let pollInterval: ReturnType<typeof setInterval> | null = null
let pollTimeout: ReturnType<typeof setTimeout> | null = null

const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR').format(price) + ' F CFA'

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const fetchOrder = () =>
  hasGuestToken.value
    ? api.getGuestOrder(orderId, { token: guestToken.value })
    : api.getOrder(orderId)

const stopPolling = () => {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null }
  if (pollTimeout) { clearTimeout(pollTimeout); pollTimeout = null }
}

const startPolling = () => {
  stopPolling()
  pollInterval = setInterval(async () => {
    try {
      const res = await fetchOrder()
      order.value = res?.data ?? res
      if (order.value?.status !== 'pending') {
        stopPolling()
        maybeTrackPurchase()
      }
    } catch { /* silently ignore polling errors */ }
  }, 5000)
  pollTimeout = setTimeout(() => stopPolling(), 120000)
}

const loadOrder = async () => {
  // Without a token, only authenticated buyers can view an order
  if (!hasGuestToken.value && !authStore.isLoggedIn) {
    // Strip query (might leak nothing here, but be consistent with other middleware)
    await navigateTo({ path: '/auth/login', query: { redirect: route.path } })
    return
  }

  loading.value = true
  try {
    const res = await fetchOrder()
    order.value = res?.data ?? res
    if (order.value?.status === 'pending') startPolling()
    maybeTrackPurchase()
    // Order is now persisted server-side — safe to clear the local cart so
    // it doesn't reappear if the buyer browses back to /checkout
    const cartStore = useCartStore()
    cartStore.clearCart()
  } catch {
    showError({ statusCode: 404, statusMessage: 'Commande introuvable' })
  } finally {
    loading.value = false
  }
}

/** Tracker l'achat une seule fois quand le statut est paid */
async function maybeTrackPurchase() {
  if (purchaseTracked.value || order.value?.status !== 'paid') return
  purchaseTracked.value = true
  try {
    // EventResource exposes `event.organizer.id`, NOT `event.user_id` or
    // `event.organizer_id` — that path was wrong and pixels never fired.
    const orgId = order.value?.event?.organizer?.id
    if (orgId) {
      await initPixels(orgId)
      trackPurchase({
        orderId: order.value?.reference || orderId,
        value: order.value?.total ?? order.value?.amount ?? 0,
        currency: 'XOF',
      })
    }
  } catch {
    // Silencieux — le tracking ne doit pas bloquer la page
  }
}

onMounted(() => loadOrder())
onBeforeUnmount(() => stopPolling())
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="w-5 h-5 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin"></div>
    </div>

    <div v-else-if="order" class="max-w-[520px] mx-auto px-6 py-14 max-sm:px-4 max-sm:py-8">

      <!-- Status header -->
      <div class="mb-8">
        <!-- Paid -->
        <template v-if="order.status === 'paid'">
          <div class="flex items-center gap-2 mb-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-text-primary"><polyline points="20 6 9 17 4 12"/></svg>
            <h1 class="text-lg font-semibold text-text-primary">Commande confirmee</h1>
          </div>
          <p class="text-sm text-text-tertiary">Votre paiement a ete traite avec succes.</p>
        </template>

        <!-- Pending -->
        <template v-else-if="order.status === 'pending'">
          <div class="flex items-center gap-2 mb-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-text-tertiary"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <h1 class="text-lg font-semibold text-text-primary">Paiement en cours</h1>
          </div>
          <p class="text-sm text-text-tertiary">Votre paiement est en attente de confirmation. Cette page se met a jour automatiquement.</p>
        </template>

        <!-- Failed -->
        <template v-else-if="order.status === 'failed'">
          <div class="flex items-center gap-2 mb-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-text-tertiary"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            <h1 class="text-lg font-semibold text-text-primary">Paiement echoue</h1>
          </div>
          <p class="text-sm text-text-tertiary">Le paiement n'a pas pu etre traite. Veuillez reessayer.</p>
        </template>

        <!-- Fallback -->
        <template v-else>
          <h1 class="text-lg font-semibold text-text-primary mb-1">Commande {{ order.status }}</h1>
          <p class="text-sm text-text-tertiary">Statut de votre commande : {{ order.status }}</p>
        </template>
      </div>

      <!-- Order details -->
      <div class="border border-border-light rounded-lg p-6 mb-6 max-sm:p-4">
        <div class="flex flex-col gap-3.5">
          <div class="flex justify-between items-baseline">
            <span class="text-sm text-text-tertiary">Numero</span>
            <span class="text-sm font-medium text-text-primary">{{ order.reference || orderId }}</span>
          </div>
          <div class="h-px bg-border-light"></div>
          <div class="flex justify-between items-baseline">
            <span class="text-sm text-text-tertiary">Evenement</span>
            <span class="text-sm font-medium text-text-primary text-right max-w-[280px]">{{ order.event?.title || order.event_name || '' }}</span>
          </div>
          <div class="h-px bg-border-light"></div>
          <div class="flex justify-between items-baseline">
            <span class="text-sm text-text-tertiary">Date</span>
            <span class="text-sm text-text-primary">{{ order.event?.date_label || formatDate(order.event_date) || '' }}</span>
          </div>
          <div class="h-px bg-border-light"></div>
          <div class="flex justify-between items-baseline">
            <span class="text-sm text-text-tertiary">Lieu</span>
            <span class="text-sm text-text-primary text-right">{{ order.event?.location || order.event_location || '' }}</span>
          </div>
          <template v-if="order.items_label || order.tickets_summary">
            <div class="h-px bg-border-light"></div>
            <div class="flex justify-between items-baseline">
              <span class="text-sm text-text-tertiary">Billets</span>
              <span class="text-sm text-text-primary">{{ order.items_label || order.tickets_summary }}</span>
            </div>
          </template>
          <div class="h-px bg-border-light"></div>
          <div class="flex justify-between items-baseline">
            <span class="text-sm text-text-tertiary">Total</span>
            <span class="text-sm font-semibold text-text-primary">{{ formatPrice(order.total ?? order.amount ?? 0) }}</span>
          </div>
          <template v-if="order.payment_method">
            <div class="h-px bg-border-light"></div>
            <div class="flex justify-between items-baseline">
              <span class="text-sm text-text-tertiary">Paiement</span>
              <span class="text-sm text-text-primary">{{ order.payment_method }}</span>
            </div>
          </template>
          <template v-if="order.event?.online_link && (order.event?.event_type === 'enligne' || order.event?.event_type === 'hybride')">
            <div class="h-px bg-border-light"></div>
            <div class="flex justify-between items-baseline">
              <span class="text-sm text-text-tertiary">Lien de connexion</span>
              <a :href="order.event.online_link" target="_blank" rel="noopener" class="text-sm font-medium text-orange-primary hover:underline text-right max-w-[280px] break-all">{{ order.event.online_platform || 'Rejoindre' }}</a>
            </div>
          </template>
        </div>
      </div>

      <!-- Email notice -->
      <p v-if="order.status === 'paid'" class="text-sm text-text-tertiary mb-8">Un email de confirmation a ete envoye a votre adresse.</p>

      <!-- Guest activation banner -->
      <div
        v-if="isGuestView && order.status === 'paid'"
        class="mb-6 rounded-lg border border-orange-primary/30 bg-orange-dim/40 p-4"
      >
        <div class="flex items-start gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-primary shrink-0 mt-0.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          <div class="flex-1">
            <p class="text-sm font-semibold text-text-primary mb-1">Activez votre compte BilletEvent</p>
            <p class="text-sm text-text-secondary mb-3">
              Un compte a été créé avec votre adresse. Définissez un mot de passe pour retrouver vos billets et commandes à tout moment.
            </p>
            <NuxtLink :to="activateAccountLink" class="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-primary hover:underline">
              Définir mon mot de passe
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 flex-wrap">
        <NuxtLink v-if="order.status === 'paid'" :to="`/orders/${orderId}/ticket${hasGuestToken ? '?token=' + encodeURIComponent(guestToken) : ''}`" class="inline-flex items-center justify-center px-5 py-2.5 bg-orange-primary text-white rounded-lg text-sm font-medium no-underline transition-colors hover:bg-orange-light">
          Voir mes billets
        </NuxtLink>
        <NuxtLink v-if="!isGuestView" to="/account/orders" class="inline-flex items-center justify-center px-5 py-2.5 border border-border-light text-text-primary rounded-lg text-sm font-medium no-underline transition-colors hover:border-text-tertiary">
          Mes commandes
        </NuxtLink>
      </div>

      <div class="mt-6">
        <NuxtLink to="/" class="text-sm text-text-tertiary transition-colors hover:text-text-primary">Retour a l'accueil</NuxtLink>
      </div>
    </div>
  </div>
</template>
