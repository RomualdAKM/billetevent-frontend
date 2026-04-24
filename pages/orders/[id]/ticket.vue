<script setup lang="ts">
import QRCode from 'qrcode'

definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const { info, error: notifyError } = useNotification()
const { getOrder } = useAccountApi()
const config = useRuntimeConfig()

const loading = ref(true)
const order = ref<Record<string, any> | null>(null)
const tickets = ref<any[]>([])
const activeIndex = ref(0)
const qrImageUrl = ref('')

const orderId = computed(() => String(route.params.id))

const ticket = computed(() => tickets.value[activeIndex.value] ?? null)
const ticketRef = computed(() => ticket.value?.reference ?? '')
const eventName = computed(() => order.value?.event?.title ?? '')
const eventDate = computed(() => {
  const d = order.value?.event?.date_start ?? order.value?.event?.start_date
  if (!d) return ''
  return new Date(d).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
})
const eventLocation = computed(() => {
  const e = order.value?.event
  return e ? [e.venue ?? e.location, e.city].filter(Boolean).join(', ') : ''
})
const ticketType = computed(() => ticket.value?._pass_name ?? ticket.value?.pass_name ?? 'Standard')
const attendeeName = computed(() => {
  const u = order.value?.user
  return u ? [u.first_name, u.last_name].filter(Boolean).join(' ') : ''
})
const qrData = computed(() => ticket.value?.qr_data ?? ticket.value?.qr_code ?? ticket.value?.reference ?? '')

const orderState = computed(() => {
  if (!order.value) return 'loading'
  if (order.value.status === 'pending' && !order.value.paid_at) return 'unpaid'
  if (order.value.status === 'failed') return 'failed'
  if (order.value.paid_at && tickets.value.length === 0) return 'generating'
  if (tickets.value.length > 0) return 'ready'
  return 'unknown'
})

watch([ticket], async () => {
  const data = qrData.value
  if (!data) {
    qrImageUrl.value = ''
    return
  }
  try {
    qrImageUrl.value = await QRCode.toDataURL(data, {
      width: 256,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    })
  } catch {
    qrImageUrl.value = ''
  }
}, { immediate: true })

async function loadOrder() {
  loading.value = true
  try {
    const res = await getOrder(orderId.value)
    const data = res?.data ?? res
    order.value = data

    const allTickets: any[] = []
    if (data?.items?.length) {
      for (const item of data.items) {
        if (item.tickets?.length) {
          for (const t of item.tickets) {
            allTickets.push({ ...t, _pass_name: item.event_pass?.name ?? t.pass_name })
          }
        }
      }
    }
    tickets.value = allTickets
  } catch {
    notifyError('Impossible de charger la commande')
  } finally {
    loading.value = false
  }
}

async function downloadPdf(ref?: string) {
  const targetRef = ref || ticketRef.value
  if (!targetRef) {
    notifyError('Aucun billet disponible au telechargement')
    return
  }
  info('Le telechargement du PDF va commencer...')
  try {
    const blob = await $fetch(`/tickets/${targetRef}/download`, {
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
    a.download = `billet-${targetRef}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    notifyError('Impossible de telecharger le PDF')
  }
}

async function downloadAllPdfs() {
  for (const t of tickets.value) {
    await downloadPdf(t.reference)
  }
}

function addToCalendar() {
  const e = order.value?.event
  if (!e) return
  const start = (e.date_start || e.start_date) ? new Date(e.date_start || e.start_date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') : ''
  const end = (e.date_end || e.end_date) ? new Date(e.date_end || e.end_date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '') : start
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title || '',
    dates: `${start}/${end}`,
    location: [e.venue ?? e.location, e.city].filter(Boolean).join(', '),
    details: `Commande ${orderId.value}`,
  })
  window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank')
}

onMounted(() => loadOrder())
</script>

<template>
  <!-- Loading -->
  <div v-if="loading" class="min-h-screen bg-white flex items-center justify-center">
    <div class="w-5 h-5 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin"></div>
  </div>

  <!-- Not found -->
  <div v-else-if="!order" class="min-h-screen bg-white flex items-center justify-center">
    <div class="text-center">
      <p class="text-sm text-text-tertiary mb-4">Commande introuvable</p>
      <NuxtLink to="/account/orders" class="text-sm text-text-secondary hover:text-text-primary transition-colors">Retour a mes commandes</NuxtLink>
    </div>
  </div>

  <!-- Unpaid -->
  <div v-else-if="orderState === 'unpaid'" class="min-h-screen bg-white flex items-center justify-center">
    <div class="text-center max-w-sm px-6">
      <div class="flex items-center justify-center gap-2 mb-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-text-tertiary"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        <p class="text-lg font-semibold text-text-primary">Paiement en attente</p>
      </div>
      <p class="text-sm text-text-tertiary mb-6">Votre paiement n'a pas encore ete confirme. Les billets seront generes automatiquement apres reception du paiement.</p>
      <div class="flex items-center justify-center gap-3">
        <NuxtLink :to="`/orders/${orderId}`" class="px-5 py-2.5 bg-orange-primary text-white rounded-lg text-sm font-medium no-underline transition-colors hover:bg-orange-light">Voir la commande</NuxtLink>
        <NuxtLink to="/account/orders" class="text-sm text-text-tertiary hover:text-text-primary transition-colors">Mes commandes</NuxtLink>
      </div>
    </div>
  </div>

  <!-- Failed -->
  <div v-else-if="orderState === 'failed'" class="min-h-screen bg-white flex items-center justify-center">
    <div class="text-center max-w-sm px-6">
      <div class="flex items-center justify-center gap-2 mb-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-text-tertiary"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        <p class="text-lg font-semibold text-text-primary">Paiement echoue</p>
      </div>
      <p class="text-sm text-text-tertiary mb-6">Le paiement de cette commande a echoue. Aucun billet ne peut etre genere.</p>
      <div class="flex items-center justify-center gap-3">
        <NuxtLink :to="`/orders/${orderId}`" class="px-5 py-2.5 bg-orange-primary text-white rounded-lg text-sm font-medium no-underline transition-colors hover:bg-orange-light">Voir la commande</NuxtLink>
        <NuxtLink to="/account/orders" class="text-sm text-text-tertiary hover:text-text-primary transition-colors">Mes commandes</NuxtLink>
      </div>
    </div>
  </div>

  <!-- Generating -->
  <div v-else-if="orderState === 'generating'" class="min-h-screen bg-white flex items-center justify-center">
    <div class="text-center max-w-sm px-6">
      <div class="flex items-center justify-center gap-2 mb-2">
        <div class="w-4 h-4 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin"></div>
        <p class="text-lg font-semibold text-text-primary">Generation en cours</p>
      </div>
      <p class="text-sm text-text-tertiary mb-6">Vos billets sont en cours de preparation. Veuillez actualiser dans quelques instants.</p>
      <div class="flex items-center justify-center gap-3">
        <button class="px-5 py-2.5 bg-orange-primary text-white rounded-lg text-sm font-medium border-none cursor-pointer transition-colors hover:bg-orange-light" @click="loadOrder">Actualiser</button>
        <NuxtLink :to="`/orders/${orderId}`" class="text-sm text-text-tertiary hover:text-text-primary transition-colors">Retour</NuxtLink>
      </div>
    </div>
  </div>

  <!-- Ticket ready -->
  <div v-else class="min-h-screen bg-white">
    <div class="max-w-[460px] mx-auto px-6 py-10 max-sm:px-4 max-sm:py-6">

      <!-- Header -->
      <div class="flex items-center justify-between mb-6">
        <div>
          <h1 class="text-lg font-semibold text-text-primary">E-Ticket</h1>
          <span v-if="tickets.length > 1" class="text-xs text-text-tertiary">{{ activeIndex + 1 }} sur {{ tickets.length }}</span>
        </div>
        <span class="text-xs text-text-tertiary">BilletEvent</span>
      </div>

      <!-- Ticket tabs -->
      <div v-if="tickets.length > 1" class="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button
          v-for="(t, i) in tickets"
          :key="t.reference"
          class="px-3 py-1.5 rounded-md text-xs font-medium border cursor-pointer transition-all shrink-0"
          :class="i === activeIndex ? 'bg-text-primary text-white border-text-primary' : 'bg-white text-text-secondary border-border-light hover:border-text-tertiary'"
          @click="activeIndex = i"
        >
          Billet {{ i + 1 }}
        </button>
      </div>

      <!-- Ticket card -->
      <div class="border border-border-light rounded-lg overflow-hidden">

        <!-- Event info -->
        <div class="p-6 max-sm:p-4">
          <div class="text-base font-semibold text-text-primary mb-4">{{ eventName }}</div>

          <div class="flex flex-col gap-3">
            <div class="flex justify-between items-baseline">
              <span class="text-sm text-text-tertiary">Date</span>
              <span class="text-sm text-text-primary text-right">{{ eventDate }}</span>
            </div>
            <div class="h-px bg-border-light"></div>
            <div class="flex justify-between items-baseline">
              <span class="text-sm text-text-tertiary">Lieu</span>
              <span class="text-sm text-text-primary text-right">{{ eventLocation }}</span>
            </div>
            <div class="h-px bg-border-light"></div>
            <div class="flex justify-between items-baseline">
              <span class="text-sm text-text-tertiary">Type</span>
              <span class="text-sm text-text-primary">{{ ticketType }}</span>
            </div>
            <div class="h-px bg-border-light"></div>
            <div class="flex justify-between items-baseline">
              <span class="text-sm text-text-tertiary">Participant</span>
              <span class="text-sm font-medium text-text-primary">{{ attendeeName }}</span>
            </div>
            <div class="h-px bg-border-light"></div>
            <div class="flex justify-between items-baseline">
              <span class="text-sm text-text-tertiary">Reference</span>
              <span class="text-sm font-mono text-text-primary">{{ ticketRef }}</span>
            </div>
          </div>
        </div>

        <!-- QR code -->
        <div class="border-t border-border-light p-6 max-sm:p-4 flex flex-col items-center">
          <img v-if="qrImageUrl" :src="qrImageUrl" alt="QR Code" width="180" height="180" class="mb-3" />
          <div v-else class="w-[180px] h-[180px] border border-border-light rounded flex items-center justify-center mb-3">
            <span class="text-xs text-text-tertiary">QR en cours...</span>
          </div>
          <p class="text-xs text-text-tertiary">Presentez ce code a l'entree de l'evenement</p>
        </div>

        <!-- Footer -->
        <div class="border-t border-border-light px-6 py-3 max-sm:px-4">
          <p class="text-[11px] text-text-tertiary text-center">Ce billet est personnel et non cessible</p>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 mt-6 flex-wrap">
        <button
          class="inline-flex items-center gap-1.5 px-4 py-2.5 border border-border-light text-text-primary rounded-lg text-sm font-medium cursor-pointer transition-colors hover:border-text-tertiary bg-white"
          @click="tickets.length > 1 ? downloadAllPdfs() : downloadPdf()"
        >
          Telecharger PDF{{ tickets.length > 1 ? ` (${tickets.length})` : '' }}
        </button>
        <button
          class="inline-flex items-center gap-1.5 px-4 py-2.5 border border-border-light text-text-primary rounded-lg text-sm font-medium cursor-pointer transition-colors hover:border-text-tertiary bg-white"
          @click="addToCalendar"
        >
          Ajouter au calendrier
        </button>
      </div>

      <div class="mt-6">
        <NuxtLink :to="`/orders/${route.params.id}`" class="text-sm text-text-tertiary transition-colors hover:text-text-primary">Retour a la commande</NuxtLink>
      </div>
    </div>
  </div>
</template>
