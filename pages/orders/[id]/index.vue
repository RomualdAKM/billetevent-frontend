<script setup lang="ts">
definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const orderId = route.params.id as string
const api = useAccountApi()
const { initPixels, trackPurchase } = useTracking()

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

const stopPolling = () => {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null }
  if (pollTimeout) { clearTimeout(pollTimeout); pollTimeout = null }
}

const startPolling = () => {
  stopPolling()
  pollInterval = setInterval(async () => {
    try {
      const res = await api.getOrder(orderId)
      order.value = res?.data ?? res
      if (order.value?.status !== 'pending') {
        stopPolling()
        // Tracker l'achat quand le statut passe à paid
        maybeTrackPurchase()
      }
    } catch { /* silently ignore polling errors */ }
  }, 5000)
  pollTimeout = setTimeout(() => stopPolling(), 120000)
}

const loadOrder = async () => {
  loading.value = true
  try {
    const res = await api.getOrder(orderId)
    order.value = res?.data ?? res
    if (order.value?.status === 'pending') startPolling()
    // Tracker l'achat si déjà payé au chargement initial
    maybeTrackPurchase()
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
    const orgId = order.value?.event?.user_id || order.value?.event?.organizer_id
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

      <!-- Actions -->
      <div class="flex items-center gap-3 flex-wrap">
        <NuxtLink v-if="order.status === 'paid'" :to="`/orders/${orderId}/ticket`" class="inline-flex items-center justify-center px-5 py-2.5 bg-orange-primary text-white rounded-lg text-sm font-medium no-underline transition-colors hover:bg-orange-light">
          Voir mes billets
        </NuxtLink>
        <NuxtLink to="/account/orders" class="inline-flex items-center justify-center px-5 py-2.5 border border-border-light text-text-primary rounded-lg text-sm font-medium no-underline transition-colors hover:border-text-tertiary">
          Mes commandes
        </NuxtLink>
      </div>

      <div class="mt-6">
        <NuxtLink to="/" class="text-sm text-text-tertiary transition-colors hover:text-text-primary">Retour a l'accueil</NuxtLink>
      </div>
    </div>
  </div>
</template>
