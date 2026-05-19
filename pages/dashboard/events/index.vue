<template>
  <div class="flex flex-col gap-6">
    <UiPageHeader title="Mes événements" subtitle="Gérez et suivez tous vos événements">
      <NuxtLink
        to="/dashboard/events/create"
        class="bg-orange-primary text-white border-none rounded-lg px-5 py-2.5 text-sm font-bold cursor-pointer font-sans whitespace-nowrap transition-all duration-150 hover:bg-orange-light flex items-center gap-2 no-underline"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nouvel événement
      </NuxtLink>
    </UiPageHeader>

    <!-- Barre de filtres : recherche + dropdown statut -->
    <div class="flex items-center gap-3 flex-wrap">
      <div class="relative flex-1 min-w-[200px] max-w-xs">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un événement…"
          class="w-full pl-9 pr-3.5 py-2 rounded-lg border border-border-light bg-surface text-sm text-text-primary font-sans outline-none transition-[border-color] duration-150 focus:border-orange-primary placeholder:text-text-tertiary"
        />
      </div>
      <div class="flex gap-1.5 flex-wrap">
        <button
          v-for="f in filters"
          :key="f.key"
          class="px-3.5 py-2 rounded-lg text-xs font-semibold border cursor-pointer transition-all duration-150"
          :class="activeFilter === f.key
            ? 'bg-orange-dim border-orange-primary text-orange-primary'
            : 'bg-surface border-border-light text-text-secondary hover:bg-surface-2 hover:border-border-medium hover:text-text-primary'"
          @click="activeFilter = f.key"
        >{{ f.label }}</button>
      </div>
    </div>

    <!-- Empty State -->
    <UiEmptyState
      v-if="!loading && !filteredEvents.length"
      title="Aucun événement pour le moment"
      description="Créez votre premier événement et commencez à vendre des billets en quelques minutes."
      action-label="Créer votre premier événement"
      action-to="/dashboard/events/create"
    >
      <template #icon>
        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.2">
          <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </template>
    </UiEmptyState>

    <!-- Grid événements -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      <div
        v-for="evt in filteredEvents"
        :key="evt.id"
        class="bg-surface border border-border-light rounded-xl overflow-hidden transition-all duration-200 flex flex-col min-w-0 hover:border-border-medium"
      >
        <!-- Image de couverture -->
        <div class="h-40 relative flex items-center justify-center shrink-0 overflow-hidden" :style="{ background: evt.flyerUrl ? 'none' : evt.gradient }">
          <img v-if="evt.flyerUrl" :src="evt.flyerUrl" :alt="evt.title" class="absolute inset-0 w-full h-full object-cover" />
          <div v-else class="text-5xl drop-shadow-sm" v-html="evt.icon" />
          <div class="absolute top-3 left-3">
            <UiStatusBadge
              :variant="evt.badgeVariant"
              :label="evt.statusLabel"
              size="sm"
            />
          </div>
        </div>

        <!-- Contenu card -->
        <div class="p-4 flex flex-col gap-2.5 flex-1 min-w-0">
          <div class="font-semibold text-base leading-tight text-text-primary overflow-hidden line-clamp-2">{{ evt.title }}</div>

          <div class="flex items-center gap-4 text-xs text-text-secondary">
            <span class="flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              {{ evt.date }}
            </span>
            <span class="flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              {{ evt.location }}
            </span>
          </div>

          <!-- Barre de remplissage -->
          <div>
            <div class="flex justify-between mb-1 gap-1.5">
              <span class="text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Remplissage</span>
              <span class="text-xs text-text-secondary font-semibold">{{ evt.fillText }}</span>
            </div>
            <div class="h-1.5 bg-surface-3 rounded-full overflow-hidden"><div class="h-full rounded-full transition-[width] duration-500" :style="{ width: evt.fillPct + '%', background: evt.fillColor }" /></div>
          </div>

          <!-- Stats inline -->
          <div class="flex items-center bg-surface-2 rounded-lg py-2 mt-auto">
            <div class="flex-1 text-center min-w-0">
              <div class="font-serif text-sm text-text-primary leading-none">{{ evt.statRevenue }}</div>
              <div class="text-[10px] text-text-tertiary mt-0.5 uppercase tracking-wider">FCFA</div>
            </div>
            <div class="w-px h-5 bg-border-light shrink-0" />
            <div class="flex-1 text-center min-w-0">
              <div class="font-serif text-sm text-text-primary leading-none">{{ evt.statTickets }}</div>
              <div class="text-[10px] text-text-tertiary mt-0.5 uppercase tracking-wider">billets</div>
            </div>
            <div class="w-px h-5 bg-border-light shrink-0" />
            <div class="flex-1 text-center min-w-0">
              <div class="font-serif text-sm text-text-primary leading-none">{{ evt.fillPctDisplay }}%</div>
              <div class="text-[10px] text-text-tertiary mt-0.5 uppercase tracking-wider">rempli</div>
            </div>
          </div>

          <!-- Boutons actions -->
          <div class="grid gap-1.5 mt-1" :class="evt.isDraft ? 'grid-cols-[1fr_1fr_auto]' : 'grid-cols-[1fr_1fr_1fr_auto]'">
            <button
              v-if="!evt.isDraft"
              class="p-2.5 border border-border-light rounded-lg bg-orange-primary text-white cursor-pointer font-sans transition-all duration-150 flex items-center justify-center hover:bg-orange-light"
              title="Voir"
              @click="navigateTo('/events/' + (evt.slug || evt.id))"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button
              v-if="evt.isDraft"
              class="p-2.5 border border-orange-primary rounded-lg cursor-pointer font-sans transition-all duration-150 flex items-center justify-center text-white bg-orange-primary hover:bg-orange-light"
              title="Publier"
              @click="openPublish(evt)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
            <button
              class="p-2.5 border border-border-light rounded-lg bg-surface text-text-secondary cursor-pointer font-sans transition-all duration-150 flex items-center justify-center hover:bg-surface-2 hover:text-text-primary hover:border-border-medium"
              title="Modifier"
              @click="navigateTo('/dashboard/events/create?edit=' + evt.id)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button
              v-if="!evt.isDraft"
              class="p-2.5 border border-border-light rounded-lg bg-surface text-text-secondary cursor-pointer font-sans transition-all duration-150 flex items-center justify-center hover:bg-surface-2 hover:text-text-primary hover:border-border-medium"
              title="Validateur"
              @click="navigateTo('/dashboard/events/' + evt.id + '/validators')"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
            </button>
            <div class="relative" data-event-actions-menu>
              <button
                class="p-2.5 border border-border-light rounded-lg bg-transparent text-text-tertiary cursor-pointer font-sans transition-all duration-150 flex items-center justify-center hover:bg-surface-2 hover:text-text-primary hover:border-border-medium"
                title="Plus d'actions"
                @click.stop="events.forEach(e => { if (e !== evt) e.showMore = false }); evt.showMore = !evt.showMore"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>
              </button>
              <div v-if="evt.showMore" class="absolute right-0 bottom-full mb-1 bg-surface border border-border-light rounded-lg z-10 min-w-[200px] py-1">
                <button
                  v-if="!evt.isDraft"
                  class="w-full px-3.5 py-2.5 text-xs text-text-secondary hover:bg-surface-2 hover:text-text-primary text-left flex items-center gap-2 cursor-pointer"
                  @click="evt.showMore = false; copyMarketingLink(evt)"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Copier le lien
                </button>
                <button
                  v-if="!evt.isDraft"
                  class="w-full px-3.5 py-2.5 text-xs text-text-secondary hover:bg-surface-2 hover:text-text-primary text-left flex items-center gap-2 cursor-pointer"
                  @click="evt.showMore = false; previewMarketingLink(evt)"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Aperçu landing page
                </button>
                <button
                  v-if="!evt.isDraft"
                  class="w-full px-3.5 py-2.5 text-xs text-text-secondary hover:bg-surface-2 hover:text-text-primary text-left flex items-center gap-2 cursor-pointer"
                  @click="evt.showMore = false; openStats(evt)"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                  Statistiques
                </button>
                <button
                  class="w-full px-3.5 py-2.5 text-xs text-left flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  :class="(evt.tickets_sold ?? 0) > 0
                    ? 'text-text-tertiary'
                    : 'text-red-error hover:bg-red-dim'"
                  :disabled="(evt.tickets_sold ?? 0) > 0"
                  :title="(evt.tickets_sold ?? 0) > 0 ? 'Suppression bloquée : des billets ont déjà été vendus' : 'Supprimer cet événement'"
                  @click="evt.showMore = false; openDelete(evt)"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UiConfirmModal
      :is-open="publishModalOpen"
      title="Publier l'événement"
      :message="'Publier ' + (selectedEvent?.title || '') + ' ? Il sera visible par tous les utilisateurs.'"
      confirm-text="Publier"
      cancel-text="Annuler"
      variant="info"
      @confirm="confirmPublish"
      @cancel="publishModalOpen = false"
    />

    <UiConfirmModal
      :is-open="deleteModalOpen"
      title="Supprimer l'événement"
      :message="'Supprimer définitivement ' + (selectedEvent?.title || '') + ' ? Cette action est irréversible.'"
      confirm-text="Supprimer"
      cancel-text="Annuler"
      variant="danger"
      @confirm="confirmDelete"
      @cancel="deleteModalOpen = false"
    />

    <UiBaseModal
      :is-open="statsModalOpen"
      :title="'Statistiques — ' + (selectedEvent?.title || '')"
      size="lg"
      @close="statsModalOpen = false"
    >
      <div v-if="selectedEvent" class="space-y-5">
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="bg-surface-2 rounded-xl p-4 text-center">
            <div class="font-serif text-xl text-text-primary">{{ selectedEvent.statRevenue }}</div>
            <div class="text-xs text-text-tertiary mt-1 uppercase">Revenus FCFA</div>
          </div>
          <div class="bg-surface-2 rounded-xl p-4 text-center">
            <div class="font-serif text-xl text-text-primary">{{ selectedEvent.statTickets }}</div>
            <div class="text-xs text-text-tertiary mt-1 uppercase">Billets vendus</div>
          </div>
          <div class="bg-surface-2 rounded-xl p-4 text-center">
            <div class="font-serif text-xl text-text-primary">{{ selectedEvent.fillPctDisplay }}%</div>
            <div class="text-xs text-text-tertiary mt-1 uppercase">Taux de remplissage</div>
          </div>
          <div class="bg-surface-2 rounded-xl p-4 text-center">
            <div class="font-serif text-xl text-text-primary">{{ selectedEvent.stats.checkIns }}</div>
            <div class="text-xs text-text-tertiary mt-1 uppercase">Check-ins</div>
          </div>
        </div>
        <div>
          <h4 class="text-sm font-semibold text-text-primary mb-3">Ventes par type de billet</h4>
          <div class="space-y-3">
            <div v-for="ticket in selectedEvent.stats.tickets" :key="ticket.type" class="flex items-center gap-3">
              <span class="text-xs text-text-secondary w-20 shrink-0">{{ ticket.type }}</span>
              <div class="flex-1 h-6 bg-surface-3 rounded-full overflow-hidden relative">
                <div class="h-full rounded-full transition-all duration-500" :style="{ width: ticket.pct + '%', background: ticket.color }" />
              </div>
              <span class="text-xs font-semibold text-text-primary w-16 text-right shrink-0">{{ ticket.sold }}/{{ ticket.total }}</span>
              <span class="text-xs text-text-tertiary w-20 text-right shrink-0">{{ ticket.revenue }}</span>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-3 pt-3 border-t border-border-light">
          <div class="text-center">
            <div class="text-xs text-text-tertiary mb-1">Panier moyen</div>
            <div class="font-serif text-base text-text-primary">{{ selectedEvent.stats.avgCart }}</div>
          </div>
          <div class="text-center">
            <div class="text-xs text-text-tertiary mb-1">Taux de conversion</div>
            <div class="font-serif text-base text-text-primary">{{ selectedEvent.stats.convRate }}</div>
          </div>
          <div class="text-center">
            <div class="text-xs text-text-tertiary mb-1">Remboursements</div>
            <div class="font-serif text-base text-text-primary">{{ selectedEvent.stats.refunds }}</div>
          </div>
        </div>
      </div>
    </UiBaseModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const api = useOrganizerApi()
const { success, error: notifyError } = useNotification()

const loading = ref(true)
const actionLoading = ref(false)
const activeFilter = ref('all')
const searchQuery = ref('')
const publishModalOpen = ref(false)
const deleteModalOpen = ref(false)
const statsModalOpen = ref(false)
const selectedEvent = ref<any>(null)

const badgeVariantMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  online: 'success',
  upcoming: 'info',
  draft: 'neutral',
  ended: 'neutral',
}

const statusMap: Record<string, { label: string; filter: string }> = {
  published: { label: 'En ligne', filter: 'online' },
  ongoing: { label: 'En cours', filter: 'online' },
  draft: { label: 'Brouillon', filter: 'draft' },
  upcoming: { label: 'À venir', filter: 'upcoming' },
  ended: { label: 'Terminé', filter: 'ended' },
}

const gradients = [
  'linear-gradient(135deg, #1a1a2e 0%, #F05A28 100%)',
  'linear-gradient(135deg, #0f2027 0%, #2563EB 100%)',
  'linear-gradient(135deg, #1a0533 0%, #7C3AED 100%)',
  'linear-gradient(135deg, #0a2e1f 0%, #16A34A 100%)',
]

const fillColors = ['var(--color-orange-primary)', 'var(--color-blue-main)', 'var(--color-text-tertiary)', 'var(--color-green-dark)']

const defaultIcon = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'

const events = ref<any[]>([])

const filters = computed(() => {
  const total = events.value.length
  return [
    { key: 'all', label: `Tous (${total})` },
    { key: 'online', label: 'En ligne' },
    { key: 'upcoming', label: 'À venir' },
    { key: 'draft', label: 'Brouillons' },
    { key: 'ended', label: 'Terminés' },
  ]
})

const formatFillPct = (pct: number): string => {
  if (pct === 0) return '0'
  if (pct < 10) return pct % 1 === 0 ? String(pct) : pct.toFixed(1)
  return String(Math.round(pct))
}

const mapEvent = (e: any, i: number) => {
  const s = statusMap[e.status] || statusMap.draft
  const sold = e.tickets_sold ?? 0
  const cap = e.capacity ?? 0
  const rawPct = cap > 0 ? (sold / cap) * 100 : 0
  const pct = Math.min(rawPct, 100)
  const rev = e.revenue ?? 0
  const fmtRev = rev >= 1000000 ? (rev / 1000000).toFixed(1).replace('.0', '') + 'M' : rev >= 1000 ? Math.round(rev / 1000) + 'K' : String(rev)
  return {
    id: e.id,
    slug: e.slug || e.id,
    status: s.filter,
    title: e.title,
    subtitle: e.subtitle || e.description?.substring(0, 40) || '',
    date: e.date_label || e.date || '',
    location: e.location || e.venue || '',
    gradient: e.gradient || gradients[i % gradients.length],
    flyerUrl: e.flyer_url || null,
    icon: defaultIcon,
    statusLabel: s.label,
    badgeVariant: badgeVariantMap[s.filter] || 'neutral',
    fillText: `${sold} / ${cap} billets`,
    fillPct: pct,
    fillPctDisplay: formatFillPct(pct),
    fillColor: fillColors[i % fillColors.length],
    statRevenue: fmtRev,
    statTickets: String(sold),
    tickets_sold: sold,
    isDraft: e.status === 'draft',
    showMore: false,
    stats: {
      checkIns: e.stats?.checkIns ?? '0',
      tickets: e.stats?.tickets ?? [],
      avgCart: (e.average_basket != null && e.average_basket > 0) ? e.average_basket.toLocaleString('fr-FR') + ' FCFA' : '0 FCFA',
      convRate: (e.conversion_rate != null && e.total_orders_count > 0) ? e.conversion_rate + '%' : '0%',
      refunds: e.stats?.refunds ?? '0',
    },
  }
}

const filteredEvents = computed(() => {
  let list = events.value
  if (activeFilter.value !== 'all') {
    list = list.filter(e => e.status === activeFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase()
    list = list.filter(e => e.title.toLowerCase().includes(q) || e.location.toLowerCase().includes(q))
  }
  return list
})

const loadEvents = async () => {
  loading.value = true
  try {
    const res = await api.getEvents() as any
    const data = res?.data ?? res
    events.value = (Array.isArray(data) ? data : []).map(mapEvent)
  } catch {
    notifyError('Impossible de charger les événements')
  } finally {
    loading.value = false
  }
}

const openPublish = (evt: any) => {
  selectedEvent.value = evt
  publishModalOpen.value = true
}

const confirmPublish = async () => {
  if (!selectedEvent.value) return
  actionLoading.value = true
  try {
    await api.publishEvent(selectedEvent.value.id)
    selectedEvent.value.status = 'online'
    selectedEvent.value.statusLabel = 'En ligne'
    selectedEvent.value.badgeVariant = 'success'
    selectedEvent.value.isDraft = false
    success(`"${selectedEvent.value.title}" a été publié avec succès`)
  } catch (err: any) {
    // Surface the specific reason from EventPolicy (KYC missing, no passes, etc.)
    notifyError(err?.message || 'Impossible de publier l\'\u00e9vénement')
  } finally {
    actionLoading.value = false
    publishModalOpen.value = false
  }
}

const openStats = (evt: any) => {
  selectedEvent.value = evt
  statsModalOpen.value = true
}

const openDelete = (evt: any) => {
  // Defense in depth: button is disabled when sales exist, but block here too
  if ((evt?.tickets_sold ?? 0) > 0) {
    notifyError('Cet événement ne peut pas être supprimé car des billets ont déjà été vendus. Annulez-le plutôt depuis ses paramètres.')
    return
  }
  selectedEvent.value = evt
  deleteModalOpen.value = true
}

const marketingLinkFor = (evt: any): string | null => {
  if (typeof window === 'undefined') return null
  const slug = evt?.slug || evt?.id
  if (!slug) return null
  return `${window.location.origin}/e/${slug}`
}

/**
 * Copy the marketing landing URL (/e/[slug]) to the clipboard.
 * This is the link organisers paste into Facebook Ads, WhatsApp, Instagram
 * etc. — it points to a stripped-down conversion page (no BilletEvent chrome).
 */
const copyMarketingLink = async (evt: any) => {
  const url = marketingLinkFor(evt)
  if (!url) {
    notifyError('Lien indisponible pour cet événement')
    return
  }
  try {
    await navigator.clipboard.writeText(url)
    success('Lien copié — prêt à partager sur WhatsApp, Facebook, Instagram…')
  } catch {
    notifyError('Impossible de copier le lien automatiquement. ' + url)
  }
}

/** Open the marketing landing in a new tab so the organiser can preview what buyers will see. */
const previewMarketingLink = (evt: any) => {
  const url = marketingLinkFor(evt)
  if (!url) {
    notifyError('Lien indisponible pour cet événement')
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
}

const confirmDelete = async () => {
  if (!selectedEvent.value) return
  if ((selectedEvent.value.tickets_sold ?? 0) > 0) {
    notifyError('Suppression annulée — des billets ont été vendus.')
    deleteModalOpen.value = false
    return
  }
  actionLoading.value = true
  try {
    await api.deleteEvent(selectedEvent.value.id)
    const idx = events.value.findIndex(e => e.id === selectedEvent.value.id)
    if (idx !== -1) events.value.splice(idx, 1)
    success(`"${selectedEvent.value.title}" a été supprimé`)
  } catch {
    notifyError('Impossible de supprimer l\'\u00e9vénement')
  } finally {
    actionLoading.value = false
    deleteModalOpen.value = false
  }
}

// Close any open "more actions" dropdown when the user clicks outside of any
// row's menu — otherwise opening menu A then clicking row B leaves both open
const closeAllShowMore = (e: MouseEvent) => {
  if (!(e.target as HTMLElement | null)?.closest('[data-event-actions-menu]')) {
    events.value.forEach(evt => { if (evt && evt.showMore) evt.showMore = false })
  }
}

onMounted(() => {
  loadEvents()
  if (typeof document !== 'undefined') {
    document.addEventListener('click', closeAllShowMore)
  }
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.removeEventListener('click', closeAllShowMore)
  }
})
</script>
