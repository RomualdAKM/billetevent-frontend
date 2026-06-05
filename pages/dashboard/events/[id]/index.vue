<script setup lang="ts">
/**
 * Hub event organisateur — page synthèse d'UN événement.
 * Avant : l'organisateur cliquait une carte event et n'allait nulle part de canonique.
 * Désormais : aperçu de l'event + 6 raccourcis vers Ventes, Participants, Check-in,
 * Codes promo, Invitations, Validateurs, le tout pré-filtré sur cet event.
 *
 * MVP — la version "tabs complètes intégrées" est un refactor plus profond
 * qui dépendra de comment les pages globales acceptent un `?event=...` query.
 */
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const route = useRoute()
const router = useRouter()
const api = useOrganizerApi()
const { error: notifyError } = useNotification()
const { formatPrice, formatDateLong, formatTime } = useFormatters()

const eventId = computed(() => route.params.id as string)
const loading = ref(true)
const event = ref<any>(null)
const stats = ref<any>(null)

async function loadEvent() {
  loading.value = true
  try {
    const res = await api.getEvent(eventId.value)
    event.value = (res as any)?.data ?? res
    // Tentative chargement stats (silent si pas dispo)
    try {
      const sessRes = await api.getValidatorSessions(eventId.value)
      const sess = (sessRes as any)?.data ?? sessRes
      stats.value = sess?.stats || sess?.session?.stats || null
    } catch { /* silencieux */ }
  } catch {
    notifyError('Impossible de charger l\'événement')
  } finally {
    loading.value = false
  }
}

onMounted(loadEvent)

const isUpcoming = computed(() => {
  if (!event.value?.date_start) return false
  return new Date(event.value.date_start).getTime() >= Date.now()
})

const isToday = computed(() => {
  if (!event.value?.date_start) return false
  const d = new Date(event.value.date_start)
  const now = new Date()
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
})

const totalTickets = computed(() => {
  if (!event.value?.passes) return 0
  return event.value.passes.reduce((sum: number, p: any) => sum + (p.quantity || 0), 0)
})
const soldTickets = computed(() => {
  if (!event.value?.passes) return 0
  return event.value.passes.reduce((sum: number, p: any) => sum + (p.sold_count || 0), 0)
})
const fillRate = computed(() => totalTickets.value === 0 ? 0 : Math.round((soldTickets.value / totalTickets.value) * 100))
const totalRevenue = computed(() => {
  if (!event.value?.passes) return 0
  return event.value.passes.reduce((sum: number, p: any) => sum + ((p.sold_count || 0) * (p.price || 0)), 0)
})

function copyEventLink() {
  if (!import.meta.client) return
  const requestUrl = useRequestURL()
  const link = `${requestUrl.origin}/e/${event.value?.slug || event.value?.id}`
  navigator.clipboard.writeText(link).then(
    () => {
      const { success } = useNotification()
      success('Lien de l\'événement copié')
    },
    () => { /* silencieux */ }
  )
}

const quickActions = computed(() => [
  {
    label: 'Modifier',
    icon: 'edit',
    to: `/dashboard/events/create?id=${eventId.value}`,
    primary: false,
  },
  {
    label: 'Aperçu public',
    icon: 'eye',
    to: `/e/${event.value?.slug || eventId.value}`,
    primary: false,
    external: true,
  },
])

const navTiles = computed(() => [
  { label: 'Ventes & Billets', description: 'Tous les billets vendus pour cet événement', icon: 'tickets', to: `/dashboard/tickets?event=${eventId.value}`, count: soldTickets.value },
  { label: 'Participants', description: 'Liste complète, export, communication', icon: 'users', to: `/dashboard/participants?event=${eventId.value}`, count: soldTickets.value },
  { label: 'Check-in', description: 'Scans, doublons, taux d\'entrée', icon: 'checkin', to: `/dashboard/checkin?event=${eventId.value}`, count: stats.value?.checked_in ?? 0 },
  { label: 'Validateurs', description: 'Créer/régénérer accès portiers', icon: 'shield', to: `/dashboard/events/${eventId.value}/validators` },
  { label: 'Codes promo', description: 'Réductions ciblées', icon: 'promo', to: `/dashboard/promo-codes?event=${eventId.value}` },
  { label: 'Invitations', description: 'Invités VIP, accès gratuit', icon: 'mail', to: `/dashboard/invitations?event=${eventId.value}` },
])
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 py-6">
    <!-- Back -->
    <NuxtLink to="/dashboard/events" class="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-orange-primary mb-4">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      Mes événements
    </NuxtLink>

    <div v-if="loading" class="space-y-4">
      <div class="h-32 rounded-2xl bg-surface-2 animate-pulse" />
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div v-for="i in 6" :key="i" class="h-24 rounded-xl bg-surface-2 animate-pulse" />
      </div>
    </div>

    <template v-else>
      <!-- Header event -->
      <div class="bg-surface border border-border-light rounded-2xl p-5 mb-4">
        <div class="flex items-start gap-4 mb-4">
          <div class="w-16 h-16 rounded-xl overflow-hidden bg-surface-2 shrink-0">
            <img v-if="event?.flyer_url" :src="event.flyer_url" :alt="event.title" class="w-full h-full object-cover" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span v-if="isToday" class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-orange-primary text-white px-2 py-0.5 rounded-full">
                <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Aujourd'hui
              </span>
              <span v-else-if="isUpcoming" class="text-[10px] font-bold uppercase tracking-wider bg-green-dim text-green-dark px-2 py-0.5 rounded-full">À venir</span>
              <span v-else class="text-[10px] font-bold uppercase tracking-wider bg-surface-2 text-text-tertiary px-2 py-0.5 rounded-full">Passé</span>
              <span v-if="event?.status" class="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">· {{ event.status }}</span>
            </div>
            <h1 class="font-serif text-xl text-text-primary leading-tight mb-1">{{ event?.title }}</h1>
            <div class="text-xs text-text-tertiary">
              <span v-if="event?.date_start">{{ formatDateLong(event.date_start) }} · {{ formatTime(event.date_start) }}</span>
              <span v-if="event?.venue || event?.city"> · {{ [event?.venue, event?.city].filter(Boolean).join(', ') }}</span>
            </div>
          </div>
        </div>

        <!-- KPIs -->
        <div class="grid grid-cols-3 gap-3 mb-4 pt-4 border-t border-border-light">
          <div>
            <div class="text-[10px] uppercase tracking-wider text-text-tertiary font-bold mb-0.5">Vendus</div>
            <div class="font-serif text-xl text-text-primary tabular-nums">{{ soldTickets }} <span class="text-text-tertiary text-base">/ {{ totalTickets }}</span></div>
            <div class="text-[10px] text-text-tertiary mt-0.5">{{ fillRate }} % de remplissage</div>
          </div>
          <div>
            <div class="text-[10px] uppercase tracking-wider text-text-tertiary font-bold mb-0.5">CA</div>
            <div class="font-serif text-xl text-text-primary tabular-nums">{{ formatPrice(totalRevenue) }}</div>
          </div>
          <div v-if="stats">
            <div class="text-[10px] uppercase tracking-wider text-text-tertiary font-bold mb-0.5">Entrés</div>
            <div class="font-serif text-xl text-text-primary tabular-nums">{{ stats.checked_in ?? 0 }}</div>
            <div class="text-[10px] text-text-tertiary mt-0.5">scans validés</div>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="flex flex-wrap gap-2">
          <NuxtLink
            v-for="action in quickActions"
            :key="action.label"
            :to="action.to"
            :target="action.external ? '_blank' : undefined"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors border border-border-light text-text-secondary hover:border-orange-primary hover:text-orange-primary"
          >
            {{ action.label }}
          </NuxtLink>
          <button
            type="button"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors border border-border-light text-text-secondary hover:border-orange-primary hover:text-orange-primary"
            @click="copyEventLink"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copier le lien
          </button>
          <NuxtLink
            v-if="isToday || isUpcoming"
            :to="`/dashboard/events/${eventId}/live`"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors bg-orange-primary text-white hover:bg-orange-light"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            Tableau de bord Live
          </NuxtLink>
        </div>
      </div>

      <!-- Nav tiles vers pages globales préfiltrées -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <NuxtLink
          v-for="tile in navTiles"
          :key="tile.label"
          :to="tile.to"
          class="bg-surface border border-border-light rounded-xl p-4 hover:border-orange-primary transition-colors group"
        >
          <div class="flex items-start justify-between mb-2">
            <h3 class="text-sm font-bold text-text-primary group-hover:text-orange-primary transition-colors">{{ tile.label }}</h3>
            <span v-if="tile.count !== undefined && tile.count !== null" class="text-xs font-bold text-text-tertiary tabular-nums">{{ tile.count }}</span>
          </div>
          <p class="text-xs text-text-tertiary">{{ tile.description }}</p>
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
