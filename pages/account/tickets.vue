<script setup lang="ts">
definePageMeta({ layout: 'account', middleware: 'auth' })

import QRCode from 'qrcode'

const api = useAccountApi()
const { error: showError } = useNotification()

const loading = ref(true)
const orders = ref<any[]>([])
const activeTab = ref<'upcoming' | 'past'>('upcoming')

// Modal QR plein écran
const qrModalOpen = ref(false)
const qrImageUrl = ref('')
const qrTicket = ref<any>(null)

const loadOrders = async () => {
  loading.value = true
  try {
    // On lit les commandes pour en extraire les billets (un order = N billets via items.tickets)
    const res = await api.getOrders({ per_page: 50 })
    const data = (res as any).data ?? res
    orders.value = data.data ?? data ?? []
  } catch {
    showError('Impossible de charger vos billets')
  } finally {
    loading.value = false
  }
}

onMounted(loadOrders)

// Aplatir : un tableau de tickets enrichis de leur event et order
const allTickets = computed(() => {
  const list: any[] = []
  for (const order of orders.value) {
    // Seuls les orders payés ont des billets utilisables
    if (order.status !== 'paid' && order.status !== 'confirmed') continue
    const event = order.event || {}
    const items = order.items || []
    for (const item of items) {
      const pass = item.event_pass || item.eventPass || {}
      const tickets = item.tickets || []
      for (const ticket of tickets) {
        // Ne pas afficher les billets annulés/remboursés dans la liste billets
        if (ticket.status === 'cancelled' || ticket.status === 'refunded') continue
        list.push({
          id: ticket.id,
          reference: ticket.reference,
          status: ticket.status,
          qrData: ticket.qr_data,
          passName: pass.name || 'Billet',
          eventTitle: event.title || 'Événement',
          eventDate: event.date_start,
          eventLocation: [event.venue || event.location, event.city].filter(Boolean).join(', '),
          eventSlug: event.slug,
          orderId: order.id,
          orderReference: order.reference,
        })
      }
    }
  }
  return list
})

const upcomingTickets = computed(() =>
  allTickets.value
    .filter(t => !t.eventDate || new Date(t.eventDate).getTime() >= Date.now())
    .sort((a, b) => new Date(a.eventDate || 0).getTime() - new Date(b.eventDate || 0).getTime()),
)

const pastTickets = computed(() =>
  allTickets.value
    .filter(t => t.eventDate && new Date(t.eventDate).getTime() < Date.now())
    .sort((a, b) => new Date(b.eventDate || 0).getTime() - new Date(a.eventDate || 0).getTime()),
)

const visibleTickets = computed(() =>
  activeTab.value === 'upcoming' ? upcomingTickets.value : pastTickets.value,
)

const formatDate = (iso?: string) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
const formatTime = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.getHours().toString().padStart(2, '0') + 'h' + d.getMinutes().toString().padStart(2, '0')
}
const daysUntil = (iso?: string) => {
  if (!iso) return null
  const diff = new Date(iso).getTime() - Date.now()
  if (diff < 0) return null
  const days = Math.floor(diff / 86_400_000)
  if (days === 0) return "Aujourd'hui"
  if (days === 1) return 'Demain'
  if (days < 7) return `Dans ${days} jours`
  if (days < 30) return `Dans ${Math.floor(days / 7)} sem.`
  return formatDate(iso)
}

async function openQr(ticket: any) {
  qrTicket.value = ticket
  qrImageUrl.value = ''
  qrModalOpen.value = true
  // Force la luminosité écran si supporté (capteur lumière)
  // Génère le QR à haute résolution
  try {
    qrImageUrl.value = await QRCode.toDataURL(ticket.qrData || ticket.reference, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: { dark: '#1a1a2e', light: '#ffffff' },
    })
    // Tente de garder l'écran allumé (Wake Lock API)
    if ('wakeLock' in navigator) {
      try { await (navigator as any).wakeLock.request('screen') } catch { /* silencieux */ }
    }
  } catch {
    showError('Impossible de générer le QR code')
  }
}

function closeQr() {
  qrModalOpen.value = false
  qrTicket.value = null
  qrImageUrl.value = ''
}
</script>

<template>
  <div>
    <UiPageHeader title="Mes billets" subtitle="Présentez le QR code à l'entrée de l'événement" />

    <!-- Tabs upcoming / past -->
    <div class="flex gap-2 mb-6 border-b border-border-light overflow-x-auto">
      <button
        type="button"
        :class="[
          'px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors',
          activeTab === 'upcoming'
            ? 'border-orange-primary text-orange-primary'
            : 'border-transparent text-text-tertiary hover:text-text-secondary',
        ]"
        @click="activeTab = 'upcoming'"
      >
        À venir
        <span v-if="upcomingTickets.length" class="ml-1 text-xs opacity-70">({{ upcomingTickets.length }})</span>
      </button>
      <button
        type="button"
        :class="[
          'px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors',
          activeTab === 'past'
            ? 'border-orange-primary text-orange-primary'
            : 'border-transparent text-text-tertiary hover:text-text-secondary',
        ]"
        @click="activeTab = 'past'"
      >
        Passés
        <span v-if="pastTickets.length" class="ml-1 text-xs opacity-70">({{ pastTickets.length }})</span>
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div v-for="i in 4" :key="i" class="h-32 rounded-xl bg-surface-2 animate-pulse" />
    </div>

    <!-- Empty state actionnable -->
    <UiEmptyState
      v-else-if="visibleTickets.length === 0 && activeTab === 'upcoming'"
      title="Aucun billet à venir"
      description="Vos prochains billets apparaîtront ici. Trouvez votre prochain événement."
      action-label="Découvrir des événements"
      @action="navigateTo('/events')"
    >
      <template #icon>
        <svg class="w-12 h-12" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2 9a3 3 0 010 6v2a2 2 0 002 2h16a2 2 0 002-2v-2a3 3 0 010-6V7a2 2 0 00-2-2H4a2 2 0 00-2 2z"/>
        </svg>
      </template>
    </UiEmptyState>

    <UiEmptyState
      v-else-if="visibleTickets.length === 0 && activeTab === 'past'"
      title="Aucun billet passé"
      description="Vos anciens billets seront archivés ici après chaque événement."
    >
      <template #icon>
        <svg class="w-12 h-12" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      </template>
    </UiEmptyState>

    <!-- Tickets grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div
        v-for="ticket in visibleTickets"
        :key="ticket.id"
        class="bg-surface border border-border-light rounded-xl overflow-hidden hover:border-orange-primary transition-colors flex"
      >
        <!-- Bande gauche avec date "stub" -->
        <div class="bg-orange-dim/60 px-3 py-4 flex flex-col items-center justify-center text-center shrink-0 w-20 border-r-2 border-dashed border-border-light">
          <div class="font-serif text-2xl text-orange-primary leading-none">
            {{ ticket.eventDate ? new Date(ticket.eventDate).getDate() : '—' }}
          </div>
          <div class="text-[10px] uppercase tracking-wider text-text-secondary font-semibold mt-0.5">
            {{ ticket.eventDate ? new Date(ticket.eventDate).toLocaleDateString('fr-FR', { month: 'short' }) : '' }}
          </div>
          <div v-if="ticket.eventDate" class="text-[10px] text-text-tertiary mt-1">
            {{ formatTime(ticket.eventDate) }}
          </div>
        </div>

        <!-- Contenu -->
        <div class="flex-1 p-4 min-w-0 flex flex-col">
          <div class="flex items-start justify-between gap-2 mb-1">
            <h3 class="font-bold text-sm text-text-primary leading-snug line-clamp-2 flex-1 min-w-0">
              {{ ticket.eventTitle }}
            </h3>
            <span v-if="activeTab === 'upcoming' && ticket.eventDate" class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-primary text-white shrink-0">
              {{ daysUntil(ticket.eventDate) }}
            </span>
          </div>
          <div class="text-xs text-text-tertiary mb-1 line-clamp-1">{{ ticket.passName }}</div>
          <div v-if="ticket.eventLocation" class="text-xs text-text-tertiary line-clamp-1 mb-2">📍 {{ ticket.eventLocation }}</div>
          <div class="flex items-center gap-2 mt-auto pt-2">
            <button
              type="button"
              class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-orange-primary text-white text-xs font-bold hover:bg-orange-light transition-colors"
              @click="openQr(ticket)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Voir mon QR
            </button>
            <NuxtLink
              :to="`/orders/${ticket.orderReference || ticket.orderId}`"
              class="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border-light text-text-secondary hover:border-orange-primary hover:text-orange-primary transition-colors"
              :title="`Voir la commande ${ticket.orderReference || ticket.orderId}`"
              aria-label="Voir la commande complète"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 5l7 7-7 7"/></svg>
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal QR plein écran -->
    <UiBaseModal :is-open="qrModalOpen" :title="qrTicket?.eventTitle || 'Mon billet'" size="md" @close="closeQr">
      <template v-if="qrTicket">
        <div class="flex flex-col items-center text-center">
          <div class="text-xs text-text-tertiary uppercase tracking-wider mb-1">{{ qrTicket.passName }}</div>
          <div class="text-sm text-text-secondary mb-4">{{ formatDate(qrTicket.eventDate) }}<span v-if="qrTicket.eventDate"> · {{ formatTime(qrTicket.eventDate) }}</span></div>
          <div class="bg-white p-4 rounded-xl border-2 border-border-light mb-4">
            <img v-if="qrImageUrl" :src="qrImageUrl" :alt="`QR billet ${qrTicket.reference}`" class="w-72 h-72 max-w-full" />
            <div v-else class="w-72 h-72 flex items-center justify-center text-text-tertiary text-sm">Génération du QR…</div>
          </div>
          <div class="font-mono text-sm text-text-secondary mb-2">{{ qrTicket.reference }}</div>
          <p class="text-xs text-text-tertiary max-w-xs">
            Présentez ce QR code à l'entrée de l'événement. Augmentez la luminosité de votre écran si nécessaire.
          </p>
        </div>
      </template>
    </UiBaseModal>
  </div>
</template>
