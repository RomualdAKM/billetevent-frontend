<script setup lang="ts">
definePageMeta({ layout: 'account', middleware: 'auth' })

const api = useAccountApi()
const config = useRuntimeConfig()
const { success, error: showError, info } = useNotification()

const activeTab = ref('all')
const loading = ref(false)
const page = ref(1)
const lastPage = ref(1)
const refunding = ref(false)
const downloading = ref<string | null>(null)
const resending = ref<string | null>(null)
const expandedId = ref<number | string | null>(null)
const expandedLoading = ref(false)

const tabs = [
  { key: 'all', label: 'Tous' },
  { key: 'confirmed', label: 'Confirmés' },
  { key: 'pending', label: 'En attente' },
  { key: 'refunded', label: 'Remboursés' },
]

const orders = ref<any[]>([])

const filteredOrders = computed(() => {
  if (activeTab.value === 'all') return orders.value
  if (activeTab.value === 'confirmed') return orders.value.filter((o: any) => o.status === 'paid' || o.status === 'confirmed')
  return orders.value.filter((o: any) => o.status === activeTab.value)
})

const loadOrders = async () => {
  loading.value = true
  try {
    const res = await api.getOrders({ page: page.value })
    const data = res.data ?? res
    orders.value = data.data ?? data
    lastPage.value = data.last_page ?? 1
  } catch {
    showError('Impossible de charger les achats')
  } finally {
    loading.value = false
  }
}

watch(activeTab, () => {
  page.value = 1
  loadOrders()
})
watch(page, loadOrders)
onMounted(loadOrders)

// --- Helpers ---
const formatPrice = (price: number) => {
  if (!price || price === 0) return 'Gratuit'
  return new Intl.NumberFormat('fr-FR').format(price) + ' F CFA'
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const formatDateFull = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

const getOrderEvent = (order: any) => {
  if (typeof order.event === 'string') return order.event
  return order.event?.title || order.event?.name || '—'
}

const getEventSlug = (order: any) => {
  if (typeof order.event === 'object' && order.event) {
    const slug = order.event.slug || order.event.id
    return slug ? `/events/${slug}` : null
  }
  return null
}

const getEventDate = (order: any) => {
  const e = order.event
  if (!e || typeof e === 'string') return ''
  return formatDateFull(e.date_start || e.start_date || e.date || '')
}

const getEventLocation = (order: any) => {
  const e = order.event
  if (!e || typeof e === 'string') return ''
  return [e.venue ?? e.location, e.city].filter(Boolean).join(', ')
}

const getOrderDate = (order: any) => order.created_at || order.paid_at || order.date
const getOrderAmount = (order: any) => order.total ?? order.montant ?? 0
const getOrderRef = (order: any) => order.reference || `ORD-${order.id}`
const getOrderPayment = (order: any) => order.paiement || order.payment_method || '—'
const getRefundPolicy = (order: any) => order.event?.refund_policy_label || ''

const getOrderTickets = (order: any): any[] => {
  if (!Array.isArray(order.items)) return []
  const tickets: any[] = []
  for (const item of order.items) {
    if (Array.isArray(item.tickets)) {
      for (const t of item.tickets) {
        tickets.push({ ...t, _pass_name: item.event_pass?.name ?? t.pass_name ?? item.pass_name ?? 'Standard' })
      }
    }
  }
  return tickets
}

const orderStatusBadge = (status: string) => {
  if (status === 'paid' || status === 'confirmed') return { class: 'bg-green-50 text-green-700', label: 'Confirmé' }
  if (status === 'pending') return { class: 'bg-amber-50 text-amber-700', label: 'En attente' }
  if (status === 'refunded') return { class: 'bg-gray-100 text-gray-600', label: 'Remboursé' }
  return { class: 'bg-gray-100 text-gray-600', label: status }
}

const ticketStatusBadge = (status: string) => {
  if (status === 'valid') return { class: 'bg-green-50 text-green-700', label: 'Valide' }
  if (status === 'used') return { class: 'bg-blue-50 text-blue-700', label: 'Utilisé' }
  if (status === 'cancelled') return { class: 'bg-red-50 text-red-700', label: 'Annulé' }
  return { class: 'bg-gray-100 text-gray-600', label: status || 'Valide' }
}

// --- Expand / collapse ---
const toggleExpand = async (orderId: number | string) => {
  if (expandedId.value === orderId) {
    expandedId.value = null
    return
  }
  expandedId.value = orderId
  // Load full detail if items not available
  const order = orders.value.find((o: any) => o.id === orderId)
  if (order && (!order.items || !order.items.length)) {
    expandedLoading.value = true
    try {
      const res = await api.getOrder(orderId)
      const detail = res.data ?? res
      // Merge detail into existing order
      Object.assign(order, detail)
    } catch {
      // Silent fail — show what we have
    } finally {
      expandedLoading.value = false
    }
  }
}

// --- Ticket actions ---
const downloadTicket = async (reference: string) => {
  if (!reference) return
  downloading.value = reference
  info('Le téléchargement du PDF va commencer...')
  try {
    const blob = await $fetch(`/tickets/${reference}/download`, {
      baseURL: String(config.public.apiBase),
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
        Accept: 'application/pdf',
      },
      responseType: 'blob',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `billet-${reference}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch {
    showError('Impossible de télécharger le billet')
  } finally {
    downloading.value = null
  }
}

const resendTicket = async (reference: string) => {
  if (!reference) return
  resending.value = reference
  try {
    await api.resendTicket(reference)
    success('Billet renvoyé par email avec succès')
  } catch {
    showError('Impossible de renvoyer le billet par email')
  } finally {
    resending.value = null
  }
}

// --- Refund ---
const showRefundModal = ref(false)
const refundOrderId = ref<number | string | null>(null)

const requestRefund = (orderId: number | string) => {
  refundOrderId.value = orderId
  showRefundModal.value = true
}

const confirmRefund = async () => {
  if (!refundOrderId.value) return
  refunding.value = true
  try {
    await api.requestRefund(refundOrderId.value)
    showRefundModal.value = false
    refundOrderId.value = null
    success('Demande de remboursement envoyée avec succès')
    await loadOrders()
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.data?.message || 'Erreur lors de la demande de remboursement'
    showError(msg)
    showRefundModal.value = false
  } finally {
    refunding.value = false
  }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="font-serif text-2xl text-text-primary">Mes achats</h1>
      <p class="text-text-secondary mt-1">Retrouvez toutes vos commandes et billets</p>
    </div>

    <!-- Tabs -->
    <div class="flex gap-6 border-b border-border-light mb-6">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="pb-3 text-sm font-medium transition-colors relative"
        :class="activeTab === tab.key ? 'text-orange-primary border-b-2 border-orange-primary' : 'text-text-tertiary hover:text-text-primary'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <svg class="animate-spin h-7 w-7 text-orange-primary" viewBox="0 0 24 24" fill="none">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>

    <!-- Orders list -->
    <div v-else-if="filteredOrders.length" class="space-y-4">
      <div
        v-for="order in filteredOrders"
        :key="order.id"
        class="bg-surface rounded-xl overflow-hidden transition-all"
      >
        <!-- Summary row — always visible -->
        <button
          type="button"
          class="w-full text-left px-5 py-4 sm:px-6 sm:py-5 cursor-pointer hover:bg-surface-2/40 transition-colors"
          @click="toggleExpand(order.id)"
        >
          <div class="flex flex-col sm:flex-row sm:items-center gap-3">
            <!-- Left: event info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <span class="text-xs text-text-tertiary font-mono">{{ getOrderRef(order) }}</span>
                <span :class="['px-2 py-0.5 rounded-full text-[11px] font-semibold', orderStatusBadge(order.status).class]">
                  {{ orderStatusBadge(order.status).label }}
                </span>
              </div>
              <h3 class="font-semibold text-text-primary truncate">{{ getOrderEvent(order) }}</h3>
              <div class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-text-tertiary">
                <span v-if="getEventDate(order)" class="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {{ getEventDate(order) }}
                </span>
                <span v-if="getEventLocation(order)" class="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {{ getEventLocation(order) }}
                </span>
              </div>
            </div>

            <!-- Right: amount + chevron -->
            <div class="flex items-center gap-4 sm:shrink-0">
              <div class="text-right">
                <p class="font-bold text-text-primary">{{ formatPrice(getOrderAmount(order)) }}</p>
                <p class="text-xs text-text-tertiary">{{ formatDate(getOrderDate(order)) }}</p>
              </div>
              <svg
                width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                class="text-text-tertiary transition-transform shrink-0"
                :class="{ 'rotate-180': expandedId === order.id }"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </button>

        <!-- Expanded detail -->
        <div v-if="expandedId === order.id" class="border-t border-border-light px-5 py-5 sm:px-6 sm:py-6 bg-bg-primary/50">
          <!-- Loading detail -->
          <div v-if="expandedLoading" class="flex items-center justify-center py-6">
            <svg class="animate-spin h-5 w-5 text-orange-primary" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>

          <template v-else>
            <!-- Order info grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mb-6">
              <div class="flex justify-between sm:flex-col">
                <span class="text-xs text-text-tertiary">Date d'achat</span>
                <span class="text-sm text-text-primary">{{ formatDate(getOrderDate(order)) }}</span>
              </div>
              <div class="flex justify-between sm:flex-col">
                <span class="text-xs text-text-tertiary">Mode de paiement</span>
                <span class="text-sm text-text-primary">{{ getOrderPayment(order) }}</span>
              </div>
              <div class="flex justify-between sm:flex-col">
                <span class="text-xs text-text-tertiary">Montant total</span>
                <span class="text-sm font-semibold text-text-primary">{{ formatPrice(getOrderAmount(order)) }}</span>
              </div>
              <div v-if="getRefundPolicy(order)" class="flex justify-between sm:flex-col">
                <span class="text-xs text-text-tertiary">Politique de remboursement</span>
                <span class="text-sm text-text-secondary">{{ getRefundPolicy(order) }}</span>
              </div>
            </div>

            <!-- Tickets list -->
            <div v-if="getOrderTickets(order).length" class="mb-5">
              <h4 class="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
                Billets ({{ getOrderTickets(order).length }})
              </h4>
              <div class="space-y-2">
                <div
                  v-for="ticket in getOrderTickets(order)"
                  :key="ticket.id || ticket.reference"
                  class="bg-surface rounded-lg p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <!-- Ticket info -->
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-sm font-semibold text-text-primary">{{ ticket._pass_name || 'Standard' }}</span>
                      <span :class="['px-2 py-0.5 rounded-full text-[11px] font-semibold', ticketStatusBadge(ticket.status).class]">
                        {{ ticketStatusBadge(ticket.status).label }}
                      </span>
                    </div>
                    <p class="text-xs text-text-tertiary font-mono">{{ ticket.reference || ticket.id }}</p>
                    <p v-if="ticket.status === 'used' && ticket.used_at" class="text-xs text-text-tertiary mt-0.5">
                      Utilisé le {{ formatDateFull(ticket.used_at) }}
                    </p>
                  </div>

                  <!-- Ticket actions -->
                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-primary text-white hover:bg-orange-light transition-colors disabled:opacity-50"
                      :disabled="downloading === (ticket.reference || ticket.id)"
                      @click.stop="downloadTicket(ticket.reference || ticket.id)"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      {{ downloading === (ticket.reference || ticket.id) ? '...' : 'PDF' }}
                    </button>
                    <button
                      type="button"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-2 text-text-primary hover:bg-surface-3 transition-colors disabled:opacity-50"
                      :disabled="resending === (ticket.reference || ticket.id)"
                      @click.stop="resendTicket(ticket.reference || ticket.id)"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                      {{ resending === (ticket.reference || ticket.id) ? '...' : 'Email' }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- No tickets message -->
            <div v-else class="mb-5">
              <p class="text-sm text-text-tertiary italic">Aucun billet associé à cette commande</p>
            </div>

            <!-- Actions -->
            <div class="flex flex-wrap items-center gap-2 pt-4 border-t border-border-light">
              <NuxtLink
                :to="`/orders/${order.id}`"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-surface-2 text-text-primary hover:bg-surface-3 transition-colors no-underline"
                @click.stop
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                Voir les détails
              </NuxtLink>

              <NuxtLink
                v-if="getEventSlug(order)"
                :to="getEventSlug(order)!"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-surface-2 text-text-primary hover:bg-surface-3 transition-colors no-underline"
                @click.stop
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Voir l'événement
              </NuxtLink>

              <!-- Refund button -->
              <button
                v-if="(order.status === 'paid' || order.status === 'confirmed') && order.event?.refund_policy !== 'none'"
                type="button"
                class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                :class="order.event?.is_refundable
                  ? 'text-orange-primary bg-orange-dim hover:bg-orange-primary hover:text-white'
                  : 'text-text-tertiary bg-surface-2 cursor-not-allowed opacity-60'"
                :disabled="!order.event?.is_refundable"
                @click.stop="order.event?.is_refundable && requestRefund(order.id)"
              >
                {{ order.event?.is_refundable ? 'Demander un remboursement' : 'Délai dépassé' }}
              </button>
            </div>
          </template>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="lastPage > 1" class="flex items-center justify-center gap-2 pt-4">
        <button
          v-for="p in lastPage"
          :key="p"
          type="button"
          class="w-8 h-8 rounded-lg text-xs font-medium transition-colors"
          :class="p === page ? 'bg-orange-primary text-white' : 'bg-surface-2 text-text-secondary hover:bg-surface-3'"
          @click="page = p"
        >
          {{ p }}
        </button>
      </div>
    </div>

    <!-- Empty state actionnable : message + 2 CTAs (parcourir + favoris) -->
    <div v-else class="flex flex-col items-center justify-center py-16 px-4 text-center">
      <svg width="48" height="48" viewBox="0 0 24 24" class="text-text-tertiary/30 mb-4" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
      </svg>
      <h3 class="text-base font-semibold text-text-primary mb-1">
        {{ activeTab === 'all' ? 'Aucun achat pour le moment' : 'Aucune commande dans cette catégorie' }}
      </h3>
      <p class="text-sm text-text-secondary max-w-sm mb-5">
        {{ activeTab === 'all'
          ? 'Trouvez votre prochain événement. Concerts, conférences, soirées — tout se passe ici.'
          : 'Vos commandes correspondant à ce filtre apparaîtront ici.' }}
      </p>
      <div class="flex flex-col sm:flex-row gap-2">
        <NuxtLink
          to="/events"
          class="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-bold bg-orange-primary text-white hover:bg-orange-light transition-colors no-underline"
        >
          Découvrir des événements
        </NuxtLink>
        <NuxtLink
          to="/account/favorites"
          class="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-semibold border border-border-light text-text-secondary hover:border-orange-primary hover:text-orange-primary transition-colors no-underline"
        >
          Mes favoris
        </NuxtLink>
      </div>
    </div>

    <!-- Refund confirmation modal -->
    <UiConfirmModal
      :is-open="showRefundModal"
      title="Demander un remboursement"
      message="Souhaitez-vous demander un remboursement pour cette commande ? Cette action ne peut pas être annulée."
      confirm-text="Confirmer le remboursement"
      cancel-text="Annuler"
      variant="warning"
      @confirm="confirmRefund"
      @cancel="showRefundModal = false"
    />
  </div>
</template>
