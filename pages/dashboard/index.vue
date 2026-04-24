<template>
  <div class="flex flex-col gap-6">
    <!-- KYC Banner: pending -->
    <div v-if="kycBannerType === 'pending'" class="flex items-center justify-between bg-gold-dim border border-[rgba(217,119,6,0.2)] rounded-xl px-5 py-3.5">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <p class="text-sm text-gold font-medium">Complétez votre vérification d'identité pour activer les reversements.</p>
      </div>
      <NuxtLink to="/dashboard/kyc" class="text-sm text-gold font-semibold hover:underline whitespace-nowrap ml-4">Compléter →</NuxtLink>
    </div>
    <!-- KYC Banner: submitted -->
    <div v-else-if="kycBannerType === 'submitted'" class="flex items-center justify-between bg-blue-dim border border-[rgba(27,43,94,0.12)] rounded-xl px-5 py-3.5">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-blue-dim flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue-light)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <p class="text-sm text-blue-main font-medium">Vos documents sont en cours de vérification. Délai estimé : 24-48h.</p>
      </div>
      <NuxtLink to="/dashboard/kyc" class="text-sm text-blue-light font-semibold hover:underline whitespace-nowrap ml-4">Voir le statut →</NuxtLink>
    </div>
    <!-- KYC Banner: rejected -->
    <div v-else-if="kycBannerType === 'rejected'" class="flex items-center justify-between bg-red-dim border border-[rgba(220,38,38,0.15)] rounded-xl px-5 py-3.5">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full bg-red-dim flex items-center justify-center shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-red-error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <p class="text-sm text-red-error font-medium">Votre vérification a été refusée. Veuillez resoumettre vos documents.</p>
      </div>
      <NuxtLink to="/dashboard/kyc" class="text-sm text-red-error font-semibold hover:underline whitespace-nowrap ml-4">Resoumettre →</NuxtLink>
    </div>

    <!-- Page Header + Period selector -->
    <div>
      <UiPageHeader title="Vue d'ensemble" subtitle="Suivez vos performances et votre activité en temps réel" />
      <div class="flex items-center gap-3 flex-wrap -mt-2">
        <span class="text-sm text-text-secondary">{{ periodLabel }}</span>
        <div class="flex bg-surface-2 rounded-lg p-1 gap-0.5">
          <button
            v-for="p in periods"
            :key="p.key"
            class="px-3 py-1.5 rounded-lg border-none bg-transparent text-xs font-semibold text-text-secondary cursor-pointer transition-all duration-150 font-sans hover:bg-surface hover:text-text-primary"
            :class="activePeriod === p.key ? 'bg-surface text-text-primary' : ''"
            @click="activePeriod = p.key"
          >{{ p.label }}</button>
        </div>
        <div v-if="activePeriod === 'custom'" class="flex items-center gap-1.5">
          <input v-model="dateFrom" type="date" class="px-2.5 py-1.5 rounded-lg border border-border-light text-xs text-text-primary bg-surface outline-none font-sans transition-[border-color] duration-150 focus:border-orange-primary" />
          <span class="text-xs text-text-tertiary">→</span>
          <input v-model="dateTo" type="date" class="px-2.5 py-1.5 rounded-lg border border-border-light text-xs text-text-primary bg-surface outline-none font-sans transition-[border-color] duration-150 focus:border-orange-primary" />
        </div>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <DashboardStatCard
        v-for="stat in stats"
        :key="stat.label"
        :value="stat.value"
        :label="stat.label"
        :color="stat.color"
        :trend="stat.trend"
        :sub-label="stat.subLabel"
      >
        <template #icon><span v-html="stat.icon" /></template>
      </DashboardStatCard>
    </div>

    <!-- Ventes par événement + Types de pass -->
    <div class="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
      <div class="bg-surface border border-border-light rounded-xl overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <div>
            <div class="text-sm font-semibold text-text-primary">Ventes par événement</div>
            <div class="text-xs text-text-tertiary mt-0.5">Répartition de vos ventes par événement</div>
          </div>
          <NuxtLink to="/dashboard/tickets" class="text-xs text-orange-primary font-semibold cursor-pointer hover:opacity-75 transition-opacity duration-150">Voir détails →</NuxtLink>
        </div>
        <div class="p-5 pt-3">
          <div class="flex flex-col gap-5">
            <div v-for="(evt, idx) in salesEvents" :key="evt.name">
              <div class="flex flex-col gap-1.5">
                <div class="flex justify-between items-baseline">
                  <div class="flex items-center gap-2">
                    <div class="w-2.5 h-2.5 rounded-full shrink-0" :style="{ background: evt.color }" />
                    <span class="text-sm font-semibold text-text-primary">{{ evt.name }}</span>
                  </div>
                  <div class="flex items-baseline gap-3">
                    <span class="text-sm font-bold font-serif text-text-primary">{{ evt.tickets }}</span>
                    <span class="text-xs text-text-tertiary">{{ evt.revenue }}</span>
                  </div>
                </div>
                <div class="h-2 rounded-full bg-surface-2 overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-500" :style="{ width: evt.pct + '%', background: evt.color }" />
                </div>
                <div class="flex justify-between">
                  <span class="text-xs text-text-tertiary">Capacité : {{ evt.capacity }}</span>
                  <span class="text-xs font-semibold" :style="{ color: evt.color }">{{ evt.pct }}% rempli</span>
                </div>
              </div>
              <div v-if="idx < salesEvents.length - 1" class="h-px bg-border-light mt-4" />
            </div>
            <div v-if="!salesEvents.length" class="py-8 text-center text-sm text-text-tertiary">Aucune donnée de vente</div>
          </div>
        </div>
      </div>
      <div class="bg-surface border border-border-light rounded-xl overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <div>
            <div class="text-sm font-semibold text-text-primary">Types de pass</div>
            <div class="text-xs text-text-tertiary mt-0.5">Distribution des types de billets vendus</div>
          </div>
        </div>
        <div class="p-5 pt-3 flex flex-col gap-4">
          <div v-for="pass in passTypes" :key="pass.name">
            <div class="flex justify-between items-center mb-1.5">
              <div class="flex items-center gap-2"><div class="w-2.5 h-2.5 rounded-full" :style="{ background: pass.color }" /><span class="text-sm text-text-primary">{{ pass.name }}</span></div>
              <span class="text-sm font-bold font-serif text-text-primary">{{ pass.pct }}%</span>
            </div>
            <div class="h-2 rounded-full bg-surface-2 overflow-hidden"><div class="h-full rounded-full transition-all duration-500" :style="{ width: pass.pct + '%', background: pass.color }" /></div>
          </div>
          <div v-if="!passTypes.length" class="py-8 text-center text-sm text-text-tertiary">Aucun billet vendu</div>
        </div>
      </div>
    </div>

    <!-- Événements récents + Activité récente -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Événements récents — mini-cards cliquables -->
      <div class="bg-surface border border-border-light rounded-xl overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <div class="text-sm font-semibold text-text-primary">Événements récents</div>
          <NuxtLink to="/dashboard/events" class="text-xs text-orange-primary font-semibold cursor-pointer hover:opacity-75 transition-opacity duration-150">Voir tout →</NuxtLink>
        </div>
        <div class="p-4 flex flex-col gap-3">
          <NuxtLink
            v-for="evt in recentEvents"
            :key="evt.name"
            :to="'/dashboard/events'"
            class="flex items-center justify-between p-3.5 rounded-xl border border-border-light bg-surface hover:bg-surface-2 hover:border-border-medium transition-all duration-150 cursor-pointer no-underline"
          >
            <div class="min-w-0 flex-1">
              <div class="text-sm font-semibold text-text-primary leading-tight">{{ evt.name }}</div>
              <div class="text-xs text-text-tertiary mt-1">{{ evt.date }}</div>
            </div>
            <div class="flex flex-col items-end gap-1 shrink-0 ml-3">
              <UiStatusBadge
                :variant="evt.badgeVariant"
                :label="evt.status"
                size="sm"
              />
              <div class="text-xs text-text-secondary">{{ evt.tickets }}</div>
            </div>
          </NuxtLink>
          <div v-if="!recentEvents.length" class="py-8 text-center text-sm text-text-tertiary">Aucun événement récent</div>
        </div>
      </div>

      <!-- Activité récente — timeline aérée -->
      <div class="bg-surface border border-border-light rounded-xl overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <div class="text-sm font-semibold text-text-primary">Activité récente</div>
        </div>
        <div class="p-4 flex flex-col gap-0">
          <template v-if="activities.length">
            <div
              v-for="(act, idx) in activities"
              :key="idx"
              class="flex items-start gap-3.5 py-3.5"
              :class="idx < activities.length - 1 ? 'border-b border-border-light/60' : ''"
            >
              <div
                class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                :style="{ background: act.bgColor }"
              >
                <span v-html="act.iconSvg" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm text-text-primary leading-relaxed" v-html="act.text" />
                <div class="text-xs text-text-tertiary mt-0.5">{{ act.time }}</div>
              </div>
            </div>
          </template>
          <div v-else class="py-10 text-center text-sm text-text-tertiary">Aucune activité récente</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const api = useOrganizerApi()
const { error: notifyError } = useNotification()
const authStore = useAuthStore()
const { user } = authStore

const loading = ref(true)
const activePeriod = ref('30d')
const dateFrom = ref('')
const dateTo = ref('')

const kycStatus = computed(() => (user as Record<string, unknown> | null)?.kyc_status as string | undefined)
const kycBannerType = computed(() => {
  const status = kycStatus.value
  if (status === 'validated') return 'none'
  if (status === 'submitted') return 'submitted'
  if (status === 'rejected') return 'rejected'
  return 'pending' // pending, null, undefined
})

const periods = [
  { key: '7d', label: '7j' },
  { key: '30d', label: '30j' },
  { key: '90d', label: '3 mois' },
  { key: '1y', label: '12 mois' },
  { key: 'custom', label: 'Personnalisé' }
]

const periodApiValue = computed(() => activePeriod.value)

const periodLabel = computed(() => {
  const map: Record<string, string> = { '7d': '7 derniers jours', '30d': '30 derniers jours', '90d': '3 derniers mois', '1y': '12 derniers mois', 'custom': 'Période personnalisée' }
  return map[activePeriod.value]
})

const defaultIcons = {
  tickets: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="9" y1="9" x2="9" y2="15"/></svg>',
  revenue: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  events: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  participants: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
}

const stats = ref<any[]>([])
const salesEvents = ref<any[]>([])
const passTypes = ref<any[]>([])
const recentEvents = ref<any[]>([])
const activities = ref<any[]>([])

const mapStats = (raw: any) => {
  if (!raw) return []
  return [
    { value: String(raw.tickets_sold ?? 0), label: 'Billets vendus', subLabel: 'depuis 30 jours', color: 'orange', trend: formatTrend(raw.tickets_trend), icon: defaultIcons.tickets },
    { value: String(raw.revenue ?? 0), label: 'Revenus FCFA', subLabel: 'ce mois', color: 'orange', trend: formatTrend(raw.revenue_trend), icon: defaultIcons.revenue },
    { value: String(raw.events_count ?? 0), label: 'Événements actifs', subLabel: 'en cours', color: 'orange', trend: formatTrend(raw.events_trend), icon: defaultIcons.events },
    { value: String(raw.participants ?? 0), label: 'Participants inscrits', subLabel: 'total cumulé', color: 'orange', trend: formatTrend(raw.participants_trend), icon: defaultIcons.participants },
  ]
}

const formatTrend = (value: any) => {
  if (value === null || value === undefined) return null
  const num = Number(value)
  if (num === 0) return null
  return { direction: num > 0 ? 'up' : 'down', value: `${Math.abs(num)}%` }
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch { return dateStr }
}

const formatTimeAgo = (dateStr: string | null) => {
  if (!dateStr) return ''
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'À l\'instant'
    if (mins < 60) return `il y a ${mins} min`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `il y a ${hours}h`
    const days = Math.floor(hours / 24)
    return `il y a ${days}j`
  } catch { return '' }
}

const activityColor = (type: string) => {
  const map: Record<string, string> = { sale: 'var(--color-green-dark)', refund: 'var(--color-red-error)', event_published: 'var(--color-orange-primary)' }
  return map[type] || 'var(--color-orange-primary)'
}

const activityBgColor = (type: string) => {
  const map: Record<string, string> = { sale: 'var(--color-green-dim)', refund: 'var(--color-red-dim)', event_published: 'var(--color-orange-dim)' }
  return map[type] || 'var(--color-orange-dim)'
}

const activityIcon = (type: string) => {
  const map: Record<string, string> = {
    sale: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-green-dark)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    refund: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-red-error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>',
    event_published: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
  }
  return map[type] || '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
}

const salesColors = ['var(--color-orange-primary)', 'var(--color-ink2)', 'var(--color-muted)', 'var(--color-border-medium)']
const passColors = ['var(--color-orange-primary)', 'var(--color-ink2)', 'var(--color-border-medium)', 'var(--color-muted)']

const badgeVariantMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  published: 'success',
  ongoing: 'success',
  upcoming: 'info',
  draft: 'neutral',
  ended: 'neutral',
}

const statusLabelMap: Record<string, string> = {
  published: 'En vente',
  ongoing: 'En cours',
  upcoming: 'À venir',
  draft: 'Brouillon',
  ended: 'Terminé',
}

const loadStats = async () => {
  try {
    const res = await api.getStats(periodApiValue.value, dateFrom.value || undefined, dateTo.value || undefined) as any
    const data = res?.data ?? res
    stats.value = mapStats(data)
  } catch {
    stats.value = []
  }
}

const loadDashboard = async () => {
  loading.value = true
  try {
    const [statsRes, salesRes, passRes, eventsRes, activityRes] = await Promise.allSettled([
      api.getStats(periodApiValue.value, dateFrom.value || undefined, dateTo.value || undefined),
      api.getSalesByEvent(),
      api.getPassMix(),
      api.getRecentEvents(),
      api.getRecentActivity(),
    ])

    if (statsRes.status === 'fulfilled') {
      const d = (statsRes.value as any)?.data ?? statsRes.value
      stats.value = mapStats(d)
    }

    if (salesRes.status === 'fulfilled') {
      const d = (salesRes.value as any)?.data ?? salesRes.value
      salesEvents.value = (Array.isArray(d) ? d : []).map((e: any, i: number) => ({
        name: e.name || e.title,
        tickets: e.tickets_label || `${e.tickets_sold ?? 0} billets`,
        revenue: e.revenue_label || `${e.revenue ?? 0} FCFA`,
        capacity: e.capacity_label || String(e.capacity ?? 0),
        pct: e.fill_rate ?? e.fill_percentage ?? (e.capacity > 0 ? Math.round((e.tickets_sold ?? 0) / e.capacity * 100) : 0),
        color: salesColors[i % salesColors.length],
      }))
    }

    if (passRes.status === 'fulfilled') {
      const d = (passRes.value as any)?.data ?? passRes.value
      passTypes.value = (Array.isArray(d) ? d : []).map((p: any, i: number) => ({
        name: p.name,
        pct: p.percentage ?? 0,
        color: passColors[i % passColors.length],
      }))
    }

    if (eventsRes.status === 'fulfilled') {
      const d = (eventsRes.value as any)?.data ?? eventsRes.value
      recentEvents.value = (Array.isArray(d) ? d : []).map((e: any) => ({
        name: e.title || e.name,
        date: e.date_label || formatDate(e.date),
        status: statusLabelMap[e.status] || e.status_label || e.status,
        badgeVariant: badgeVariantMap[e.status] || 'neutral',
        tickets: e.tickets_label || `${e.tickets_sold ?? 0} / ${e.capacity ?? 0} billets`,
      }))
    }

    if (activityRes.status === 'fulfilled') {
      const d = (activityRes.value as any)?.data ?? activityRes.value
      activities.value = (Array.isArray(d) ? d : []).filter((a: any) => a.description).map((a: any) => ({
        text: a.html || a.description || a.text || '',
        time: a.time_label || formatTimeAgo(a.created_at) || a.time || '',
        color: a.color || activityColor(a.type),
        bgColor: activityBgColor(a.type),
        iconSvg: activityIcon(a.type),
      }))
    }
  } catch {
    notifyError('Erreur de chargement du tableau de bord')
  } finally {
    loading.value = false
  }
}

watch(activePeriod, () => {
  if (activePeriod.value !== 'custom') {
    loadStats()
  }
})

watch([dateFrom, dateTo], () => {
  if (activePeriod.value === 'custom' && dateFrom.value && dateTo.value) {
    loadStats()
  }
})

onMounted(() => loadDashboard())
</script>
