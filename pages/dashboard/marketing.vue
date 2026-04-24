<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const api = useOrganizerApi()
const { success, error, info } = useNotification()

const loading = ref(false)
const actionLoading = ref(false)
const activeTab = ref('email')
const activeFilter = ref('all')
const showNewCampaign = ref(false)
const showDetail = ref(false)
const selectedCampaign = ref<any>(null)

const smsDisabled = true

const filters = ref([
  { key: 'all', label: 'Tous' },
])

const campaignForm = ref({
  name: '',
  event_id: '',
  subject: '',
  body: '',
  smsMessage: '',
  recipients: '',
  recipient_type: 'all',
  contacts: '',
})

const availableTags = [
  { tag: '{{first_name}}', label: 'Prénom' },
  { tag: '{{last_name}}', label: 'Nom' },
  { tag: '{{event_name}}', label: 'Nom de l\'événement' },
  { tag: '{{event_date}}', label: 'Date de l\'événement' },
  { tag: '{{event_location}}', label: 'Lieu de l\'événement' },
]

function insertTag(tag: string) {
  campaignForm.value.body += ` ${tag} `
}

function resetForm() {
  campaignForm.value = { name: '', event_id: '', subject: '', body: '', smsMessage: '', recipients: '', recipient_type: 'all', contacts: '' }
}

function openNewCampaign() {
  resetForm()
  showNewCampaign.value = true
}

async function saveDraft() {
  actionLoading.value = true
  try {
    const payload: any = { ...campaignForm.value, type: activeTab.value, status: 'draft', recipient_type: campaignForm.value.recipient_type }
    if (campaignForm.value.recipient_type === 'custom' && campaignForm.value.contacts) {
      payload.contacts = campaignForm.value.contacts.split(/[,\n]+/).map((e: string) => e.trim()).filter((e: string) => e)
    }
    await api.createCampaign(payload)
    showNewCampaign.value = false
    success('Campagne enregistrée comme brouillon')
    await loadCampaigns()
  } catch (err: any) {
    error(err?.message || err?.data?.message || 'Erreur')
  } finally {
    actionLoading.value = false
  }
}

async function scheduleCampaign() {
  actionLoading.value = true
  try {
    const payload: any = { ...campaignForm.value, type: activeTab.value, status: 'scheduled', recipient_type: campaignForm.value.recipient_type }
    if (campaignForm.value.recipient_type === 'custom' && campaignForm.value.contacts) {
      payload.contacts = campaignForm.value.contacts.split(/[,\n]+/).map((e: string) => e.trim()).filter((e: string) => e)
    }
    await api.createCampaign(payload)
    showNewCampaign.value = false
    success('Campagne planifiée avec succès')
    await loadCampaigns()
  } catch (err: any) {
    error(err?.message || err?.data?.message || 'Erreur')
  } finally {
    actionLoading.value = false
  }
}

async function sendNow() {
  actionLoading.value = true
  try {
    const payload: any = { ...campaignForm.value, type: activeTab.value, status: 'draft', recipient_type: campaignForm.value.recipient_type }
    if (campaignForm.value.recipient_type === 'custom' && campaignForm.value.contacts) {
      payload.contacts = campaignForm.value.contacts.split(/[,\n]+/).map((e: string) => e.trim()).filter((e: string) => e)
    }
    const res = await api.createCampaign(payload)
    const created = (res as any).data ?? res
    await api.sendCampaign(created.id)
    showNewCampaign.value = false
    success('Campagne envoyée avec succès')
    await loadCampaigns()
  } catch (err: any) {
    error(err?.message || err?.data?.message || 'Erreur')
  } finally {
    actionLoading.value = false
  }
}

function openDetail(campaign: any) {
  selectedCampaign.value = campaign
  showDetail.value = true
}

const smsCharCount = computed(() => campaignForm.value.smsMessage.length)

const campaigns = ref<any[]>([])

const campaignTableColumns = [
  { key: 'name', label: 'Campagne' },
  { key: 'meta', label: 'Détails', hideOnMobile: true },
  { key: 'stat', label: 'Envois', hideOnMobile: true },
  { key: 'badge', label: 'Statut' },
]

const statusLabels: Record<string, string> = {
  draft: 'Brouillon',
  scheduled: 'Planifiée',
  sent: 'Envoyée',
}

const statusBadgeClasses: Record<string, string> = {
  draft: 'bg-surface-2 text-text-secondary',
  scheduled: 'bg-orange-dim text-orange-primary',
  sent: 'bg-green-100 text-green-700',
}

const statusVariantMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  draft: 'neutral',
  scheduled: 'warning',
  sent: 'success',
}

function mapCampaign(c: any) {
  const statusVal = typeof c.status === 'object' ? c.status.value ?? c.status : c.status
  const eventName = c.event?.title ?? '—'
  const dateStr = c.sent_at
    ? new Date(c.sent_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    : c.scheduled_at
      ? 'Planifiée : ' + new Date(c.scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
      : new Date(c.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  const recipientLabel = c.recipients_count != null ? `${c.recipients_count} destinataire(s)` : ''
  return {
    ...c,
    status_value: statusVal,
    meta: [eventName, dateStr, recipientLabel].filter(Boolean).join(' · '),
    badge: statusLabels[statusVal] ?? statusVal,
    badgeClass: statusBadgeClasses[statusVal] ?? 'bg-surface-2 text-text-secondary',
    stat: c.metrics?.emails_sent != null ? `${c.metrics.emails_sent} envoyé(s)` : '',
    previewSubject: c.subject ?? '',
    previewBody: c.body ?? '',
  }
}

function safeNum(val: any) {
  const n = Number(val)
  return isNaN(n) ? 0 : n
}

const emailKpis = computed(() => {
  const emailCampaigns = campaigns.value.filter((c: any) => {
    const t = typeof c.type === 'object' ? c.type?.value ?? c.type : c.type
    return t === 'email'
  })
  const withMetrics = emailCampaigns.filter((c: any) => c.metrics)
  const totalSent = withMetrics.reduce((sum: number, c: any) => sum + safeNum(c.metrics?.emails_sent), 0)
  const avgOpen = withMetrics.length
    ? (withMetrics.reduce((sum: number, c: any) => sum + safeNum(c.metrics?.open_rate), 0) / withMetrics.length).toFixed(1)
    : '0'
  const avgClick = withMetrics.length
    ? (withMetrics.reduce((sum: number, c: any) => sum + safeNum(c.metrics?.click_rate), 0) / withMetrics.length).toFixed(1)
    : '0'
  const totalConversions = withMetrics.reduce((sum: number, c: any) => sum + safeNum(c.metrics?.conversions), 0)
  return [
    { value: String(totalSent), label: 'Emails envoyés', accent: true, iconColor: 'text-orange-primary', icon: 'email' },
    { value: `${avgOpen}%`, label: 'Taux d\'ouverture', accent: false, iconColor: 'text-text-secondary', icon: 'eye' },
    { value: `${avgClick}%`, label: 'Taux de clic', accent: false, iconColor: 'text-orange-primary', icon: 'click' },
    { value: String(totalConversions), label: 'Conversions billets', accent: false, iconColor: 'text-text-secondary', icon: 'ticket' },
  ]
})

const smsKpis = computed(() => [
  { value: '—', label: 'SMS envoyés', accent: true, iconColor: 'text-orange-primary', icon: 'sms' },
  { value: '—', label: 'Taux de livraison', accent: false, iconColor: 'text-text-secondary', icon: 'check' },
  { value: '—', label: 'Crédits restants', accent: false, iconColor: 'text-orange-primary', icon: 'dollar' },
  { value: '—', label: 'Conversions billets', accent: false, iconColor: 'text-text-secondary', icon: 'ticket' },
])

const filteredEmailCampaigns = computed(() => {
  const list = campaigns.value.filter((c: any) => {
    const t = typeof c.type === 'object' ? c.type?.value ?? c.type : c.type
    return t === 'email'
  })
  if (activeFilter.value === 'all') return list
  return list.filter((c: any) => c.event?.id == activeFilter.value || c.event_id == activeFilter.value)
})

const filteredSmsCampaigns = computed(() => {
  const list = campaigns.value.filter((c: any) => {
    const t = typeof c.type === 'object' ? c.type?.value ?? c.type : c.type
    return t === 'sms'
  })
  if (activeFilter.value === 'all') return list
  return list.filter((c: any) => c.event?.id == activeFilter.value || c.event_id == activeFilter.value)
})

async function loadCampaigns() {
  loading.value = true
  try {
    const res = await api.getCampaigns()
    const data = (res as any).data ?? res
    const raw = Array.isArray(data) ? data : ((data as any).data ?? [])
    campaigns.value = raw.map(mapCampaign)
  } catch {
    useNotification().error('Impossible de charger les campagnes')
  } finally {
    loading.value = false
  }
}

const pixelFb = ref(false)
const pixelTt = ref(false)
const pixelGa = ref(false)
const pixelGads = ref(false)
const pixelFbId = ref('')
const pixelTtId = ref('')
const pixelGaId = ref('')
const pixelGadsId = ref('')
const pixelGadsLabel = ref('')

async function loadPixels() {
  try {
    const res = await api.getPixels()
    const data = (res as any).data ?? res
    if (data.facebook_pixel_id) { pixelFb.value = true; pixelFbId.value = data.facebook_pixel_id }
    if (data.tiktok_pixel_id) { pixelTt.value = true; pixelTtId.value = data.tiktok_pixel_id }
    if (data.google_analytics_id) { pixelGa.value = true; pixelGaId.value = data.google_analytics_id }
    if (data.google_ads_id) { pixelGads.value = true; pixelGadsId.value = data.google_ads_id; pixelGadsLabel.value = data.google_ads_label || '' }
  } catch {
    useNotification().error('Impossible de charger la configuration des pixels')
  }
}

async function savePixel(name: string, idRef: any) {
  if (!idRef.value.trim()) { error(`L'identifiant du pixel ${name} est requis`); return }
  try {
    await api.updatePixels({
      facebook_pixel_id: pixelFb.value ? pixelFbId.value : null,
      tiktok_pixel_id: pixelTt.value ? pixelTtId.value : null,
      google_analytics_id: pixelGa.value ? pixelGaId.value : null,
      google_ads_id: pixelGads.value ? pixelGadsId.value : null,
      google_ads_label: pixelGads.value ? pixelGadsLabel.value : null,
    })
    success(`Pixel ${name} configuré`)
  } catch (err: any) {
    error(err?.message || err?.data?.message || 'Erreur')
  }
}

async function savePixelGads() {
  if (!pixelGadsId.value.trim()) { error('L\'identifiant de conversion est requis'); return }
  await savePixel('Google Ads', pixelGadsId)
}

watch(pixelFb, (val) => { if (!val) { pixelFbId.value = ''; info('Pixel Facebook désactivé') } })
watch(pixelTt, (val) => { if (!val) { pixelTtId.value = ''; info('Pixel TikTok désactivé') } })
watch(pixelGa, (val) => { if (!val) { pixelGaId.value = ''; info('Pixel Google Analytics désactivé') } })
watch(pixelGads, (val) => { if (!val) { pixelGadsId.value = ''; pixelGadsLabel.value = ''; info('Pixel Google Ads désactivé') } })

const orgEvents = ref<any[]>([])

async function loadOrgEvents() {
  try {
    const res = await api.getEvents()
    const data = (res as any).data ?? res
    orgEvents.value = Array.isArray(data) ? data : ((data as any).data ?? [])
  } catch { /* silent */ }
}

onMounted(() => {
  loadCampaigns()
  loadPixels()
  loadOrgEvents()
})
</script>

<template>
  <div>
    <UiPageHeader title="Marketing" subtitle="Créez et gérez vos campagnes email">
      <button
        class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-orange-primary text-white hover:bg-orange-light transition-colors cursor-pointer"
        @click="openNewCampaign"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nouvelle campagne
      </button>
    </UiPageHeader>

    <!-- Filtres événement -->
    <div class="flex gap-2 mb-4 flex-wrap items-center">
      <span class="text-xs text-text-secondary font-semibold">Événement :</span>
      <button
        v-for="f in filters"
        :key="f.key"
        class="px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all"
        :class="activeFilter === f.key ? 'bg-orange-dim border-orange-primary text-orange-primary' : 'bg-surface-2 border-border-light text-text-secondary hover:bg-orange-dim hover:border-orange-primary hover:text-orange-primary'"
        @click="activeFilter = f.key"
      >{{ f.label }}</button>
    </div>

    <!-- Onglets Email / SMS -->
    <div class="flex gap-1.5 mb-5 border-b border-border-light">
      <button
        class="flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-semibold border-x border-t cursor-pointer transition-all"
        :class="activeTab === 'email' ? 'bg-orange-dim border-orange-primary text-orange-primary' : 'bg-surface border-border-light text-text-secondary hover:text-text-primary'"
        @click="activeTab = 'email'"
      >Email <span class="inline-flex items-center justify-center rounded-full px-2 py-px text-xs font-bold bg-orange-dim text-orange-primary">{{ filteredEmailCampaigns.length }}</span></button>
      <button
        class="flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-semibold border-x border-t transition-all relative"
        :class="smsDisabled ? 'bg-surface border-border-light text-text-tertiary cursor-not-allowed opacity-60' : (activeTab === 'sms' ? 'bg-orange-dim border-orange-primary text-orange-primary cursor-pointer' : 'bg-surface border-border-light text-text-secondary hover:text-text-primary cursor-pointer')"
        :disabled="smsDisabled"
        @click="!smsDisabled && (activeTab = 'sms')"
      >SMS <span v-if="smsDisabled" class="inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold bg-orange-primary/10 text-orange-primary">Bientôt disponible</span>
      <span v-else class="inline-flex items-center justify-center rounded-full px-2 py-px text-xs font-bold text-text-secondary">{{ filteredSmsCampaigns.length }}</span></button>
    </div>

    <!-- Onglet Email -->
    <div v-if="activeTab === 'email'">
      <!-- KPIs -->
      <div class="grid grid-cols-4 gap-4 mb-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <div
          v-for="(kpi, i) in emailKpis"
          :key="i"
          class="bg-surface border border-border-light rounded-xl p-5 relative overflow-hidden hover:border-border-medium transition-colors"
        >
          <div class="flex items-center justify-between mb-3">
            <div :class="kpi.iconColor">
              <svg v-if="kpi.icon === 'email'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <svg v-if="kpi.icon === 'eye'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-if="kpi.icon === 'click'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><path d="M21 3L9 15"/><path d="M10 3H3v18h18v-7"/></svg>
              <svg v-if="kpi.icon === 'ticket'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>
            </div>
          </div>
          <div class="font-serif text-3xl leading-none mb-1">{{ kpi.value }}</div>
          <div class="text-xs text-text-secondary">{{ kpi.label }}</div>
        </div>
      </div>

      <!-- Table des campagnes avec DataTable -->
      <UiDataTable
        :columns="campaignTableColumns"
        :rows="filteredEmailCampaigns"
        :loading="loading"
        empty-title="Aucune campagne"
        empty-description="Créez votre première campagne email pour promouvoir vos événements."
        @row-click="openDetail"
      >
        <template #cell-name="{ row }">
          <span class="font-semibold text-text-primary">{{ row.name }}</span>
        </template>

        <template #cell-meta="{ row }">
          <span class="text-xs text-text-tertiary">{{ row.meta }}</span>
        </template>

        <template #cell-stat="{ row }">
          <span v-if="row.stat" class="text-xs font-bold text-text-primary">{{ row.stat }}</span>
          <span v-else class="text-xs text-text-tertiary">—</span>
        </template>

        <template #cell-badge="{ row }">
          <UiStatusBadge
            :variant="statusVariantMap[row.status_value] || 'neutral'"
            :label="row.badge"
          />
        </template>
      </UiDataTable>
    </div>

    <!-- Onglet SMS -->
    <div v-if="activeTab === 'sms'">
      <div class="bg-surface border border-border-light rounded-xl p-10 text-center">
        <div class="w-16 h-16 rounded-2xl bg-orange-primary/10 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        </div>
        <h3 class="font-serif text-xl text-text-primary mb-2">Campagnes SMS — Bientôt disponible</h3>
        <p class="text-sm text-text-secondary max-w-md mx-auto leading-relaxed">Le marketing par SMS n'est pas encore disponible. Nous travaillons sur l'intégration de l'envoi de SMS pour atteindre votre audience par messages texte. Restez à l'écoute !</p>
      </div>
    </div>

    <!-- Modal nouvelle campagne -->
    <UiBaseModal :is-open="showNewCampaign" title="Nouvelle campagne email" size="lg" @close="showNewCampaign = false">
      <div class="flex flex-col gap-5">
        <div>
          <label class="text-xs font-bold text-text-secondary block mb-2">Nom de la campagne <span class="text-orange-primary">*</span></label>
          <input v-model="campaignForm.name" placeholder="ex: Invitation Vibe Venture 2025" class="w-full px-4 py-3 rounded-lg border border-border-light bg-surface text-sm text-text-primary outline-none transition-all focus:border-orange-primary" />
        </div>
        <div>
          <label class="text-xs font-bold text-text-secondary block mb-2">Événement cible <span class="text-orange-primary">*</span></label>
          <select v-model="campaignForm.event_id" class="w-full px-4 py-3 rounded-lg border border-border-light bg-surface text-sm text-text-primary outline-none transition-all cursor-pointer focus:border-orange-primary">
            <option value="">-- Sélectionner --</option>
            <option v-for="evt in orgEvents" :key="evt.id" :value="evt.id">{{ evt.title || evt.name }}</option>
          </select>
        </div>
        <template v-if="activeTab === 'email'">
          <div>
            <label class="text-xs font-bold text-text-secondary block mb-2">Objet de l'email <span class="text-orange-primary">*</span></label>
            <input v-model="campaignForm.subject" placeholder="ex: Rejoignez-nous pour Vibe Venture !" class="w-full px-4 py-3 rounded-lg border border-border-light bg-surface text-sm text-text-primary outline-none transition-all focus:border-orange-primary" />
          </div>
          <div>
            <label class="text-xs font-bold text-text-secondary block mb-2">Corps du message (HTML simplifié)</label>
            <div class="flex flex-wrap gap-1.5 mb-2">
              <button v-for="t in availableTags" :key="t.tag" type="button" class="px-2.5 py-1 rounded-full text-xs font-semibold border border-border-light bg-surface-2 text-text-secondary hover:bg-orange-dim hover:border-orange-primary hover:text-orange-primary transition-all cursor-pointer" @click="insertTag(t.tag)">{{ t.label }}</button>
            </div>
            <textarea v-model="campaignForm.body" rows="8" placeholder="Écrivez votre message ici..." class="w-full px-4 py-3 rounded-lg border border-border-light bg-surface text-sm text-text-primary outline-none transition-all resize-y min-h-[180px] leading-relaxed focus:border-orange-primary" />
          </div>
        </template>
        <div>
          <label class="text-xs font-bold text-text-secondary block mb-2">Destinataires</label>
          <select v-model="campaignForm.recipient_type" class="w-full px-4 py-3 rounded-lg border border-border-light bg-surface text-sm text-text-primary outline-none transition-all cursor-pointer focus:border-orange-primary">
            <option value="all">Tous les participants</option>
            <option value="vip">VIP uniquement</option>
            <option value="recent">Acheteurs récents (30 jours)</option>
            <option value="custom">Personnalisé</option>
          </select>
        </div>
        <div v-if="campaignForm.recipient_type === 'custom'">
          <label class="text-xs font-bold text-text-secondary block mb-2">Adresses email des destinataires <span class="text-orange-primary">*</span></label>
          <textarea v-model="campaignForm.contacts" rows="4" placeholder="Entrez les adresses email, séparées par des virgules ou des retours à la ligne&#10;ex: john@email.com, jane@email.com" class="w-full px-4 py-3 rounded-lg border border-border-light bg-surface text-sm text-text-primary outline-none transition-all resize-y min-h-[100px] leading-relaxed focus:border-orange-primary" />
          <p class="text-xs text-text-tertiary mt-1">Séparez les adresses par des virgules ou des retours à la ligne</p>
        </div>
      </div>
      <template #footer>
        <div class="flex items-center justify-end gap-2.5 flex-wrap">
          <button :disabled="actionLoading" class="px-5 py-2.5 rounded-lg text-sm font-semibold text-text-secondary bg-surface-2 hover:bg-surface-3 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed" @click="saveDraft">
            <span class="flex items-center gap-2">
              <svg v-if="actionLoading" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="0.75"/></svg>
              {{ actionLoading ? 'Sauvegarde...' : 'Enregistrer le brouillon' }}
            </span>
          </button>
          <button :disabled="actionLoading" class="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-ink2 hover:bg-ink2/90 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed" @click="scheduleCampaign">
            <span class="flex items-center gap-2">
              <svg v-if="actionLoading" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="0.75"/></svg>
              {{ actionLoading ? 'Planification...' : 'Planifier' }}
            </span>
          </button>
          <button :disabled="actionLoading" class="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-orange-primary hover:bg-orange-light transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed" @click="sendNow">
            <span class="flex items-center gap-2">
              <svg v-if="actionLoading" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="0.75"/></svg>
              {{ actionLoading ? 'Envoi en cours...' : 'Envoyer maintenant' }}
            </span>
          </button>
        </div>
      </template>
    </UiBaseModal>

    <!-- Modal détail campagne -->
    <UiBaseModal :is-open="showDetail" :title="selectedCampaign?.name" size="lg" @close="showDetail = false">
      <template v-if="selectedCampaign">
        <div class="flex items-center gap-2 mb-5">
          <UiStatusBadge
            :variant="statusVariantMap[selectedCampaign.status_value] || 'neutral'"
            :label="selectedCampaign.badge"
          />
          <span class="text-xs text-text-tertiary">Email</span>
        </div>
        <div class="grid grid-cols-3 gap-3 mb-5 max-sm:grid-cols-1">
          <div class="bg-surface-2 rounded-xl p-4 text-center">
            <div class="font-serif text-xl text-text-primary">{{ selectedCampaign.metrics?.emails_sent ?? '—' }}</div>
            <div class="text-xs text-text-tertiary mt-1">Destinataires</div>
          </div>
          <div class="bg-surface-2 rounded-xl p-4 text-center">
            <div class="font-serif text-xl text-text-primary">{{ selectedCampaign.metrics?.open_rate != null && !isNaN(Number(selectedCampaign.metrics.open_rate)) ? Number(selectedCampaign.metrics.open_rate) + '%' : '—' }}</div>
            <div class="text-xs text-text-tertiary mt-1">Taux d'ouverture</div>
          </div>
          <div class="bg-surface-2 rounded-xl p-4 text-center">
            <div class="font-serif text-xl text-text-primary">{{ selectedCampaign.metrics?.click_rate != null && !isNaN(Number(selectedCampaign.metrics.click_rate)) ? Number(selectedCampaign.metrics.click_rate) + '%' : '—' }}</div>
            <div class="text-xs text-text-tertiary mt-1">Taux de clic</div>
          </div>
          <div class="bg-surface-2 rounded-xl p-4 text-center">
            <div class="font-serif text-xl text-text-primary">{{ selectedCampaign.metrics?.conversions ?? '—' }}</div>
            <div class="text-xs text-text-tertiary mt-1">Conversions</div>
          </div>
        </div>
        <div class="border border-border-light rounded-xl overflow-hidden">
          <div class="px-5 py-3 bg-surface-2 border-b border-border-light text-xs font-bold text-text-tertiary uppercase tracking-wider">Aperçu du message</div>
          <div class="p-5">
            <div v-if="selectedCampaign.previewSubject" class="text-sm font-bold text-text-primary mb-2">{{ selectedCampaign.previewSubject }}</div>
            <div class="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{{ selectedCampaign.previewBody }}</div>
          </div>
        </div>
      </template>
    </UiBaseModal>

    <!-- Section Intégrations & Suivi -->
    <div class="mt-8">
      <h2 class="font-serif text-xl text-text-primary mb-1">Intégrations & Suivi</h2>
      <p class="text-sm text-text-secondary mb-5">Connectez vos pixels publicitaires pour suivre les conversions sur vos événements</p>

      <div class="flex flex-col gap-3.5">
        <!-- Facebook Pixel -->
        <div class="bg-surface border border-border-light rounded-xl overflow-hidden transition-colors" :class="pixelFb ? 'border-orange-primary' : ''">
          <div class="flex items-center gap-3.5 px-5 py-4 max-sm:flex-col max-sm:gap-2.5">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" class="shrink-0"><rect width="40" height="40" rx="8" fill="#1877F2"/><path d="M27.785 25.781l.858-5.594h-5.371v-3.63c0-1.53.75-3.023 3.156-3.023h2.442V8.844s-2.215-.378-4.332-.378c-4.42 0-7.308 2.678-7.308 7.527v4.265h-4.91v5.594h4.91V40h6.043V25.781h4.512z" fill="white"/></svg>
            <div class="flex-1">
              <div class="text-sm font-bold mb-0.5">Facebook Pixel</div>
              <div class="text-xs text-text-secondary leading-relaxed">Suivez les conversions et optimisez vos publicités Facebook & Instagram</div>
            </div>
            <UiBaseToggle :model-value="pixelFb" @update:model-value="pixelFb = $event" />
          </div>
          <div v-if="pixelFb" class="px-5 pb-5 border-t border-border-light">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1.5">Pixel ID</label>
                <input v-model="pixelFbId" placeholder="Ex: 1234567890123456" class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-surface text-text-primary text-sm focus:outline-none focus:border-orange-primary transition" />
              </div>
            </div>
            <div class="mt-4">
              <div class="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Événements suivis automatiquement</div>
              <div class="flex flex-wrap gap-1.5"><span class="border border-border-light rounded-full px-2.5 py-0.5 text-xs font-semibold text-text-secondary font-mono">PageView</span><span class="border border-border-light rounded-full px-2.5 py-0.5 text-xs font-semibold text-text-secondary font-mono">ViewContent</span><span class="border border-border-light rounded-full px-2.5 py-0.5 text-xs font-semibold text-text-secondary font-mono">InitiateCheckout</span><span class="border border-border-light rounded-full px-2.5 py-0.5 text-xs font-semibold text-text-secondary font-mono">Purchase</span></div>
            </div>
            <div class="mt-4 flex justify-end">
              <button class="px-6 py-2.5 rounded-lg text-sm font-medium bg-orange-primary text-white hover:bg-orange-light transition-colors cursor-pointer" @click="savePixel('Facebook', pixelFbId)">Enregistrer</button>
            </div>
          </div>
        </div>

        <!-- TikTok Pixel -->
        <div class="bg-surface border border-border-light rounded-xl overflow-hidden transition-colors" :class="pixelTt ? 'border-orange-primary' : ''">
          <div class="flex items-center gap-3.5 px-5 py-4 max-sm:flex-col max-sm:gap-2.5">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" class="shrink-0"><rect width="40" height="40" rx="8" fill="#010101"/><path d="M29.067 16.434a7.13 7.13 0 01-4.168-1.332v6.07a6.832 6.832 0 11-5.899-6.773v3.48a3.432 3.432 0 102.499 3.293V10h3.4a7.13 7.13 0 004.168 6.434z" fill="white"/><path d="M29.067 16.434a7.13 7.13 0 01-4.168-1.332v6.07a6.832 6.832 0 11-5.899-6.773v3.48a3.432 3.432 0 102.499 3.293V10h3.4a7.13 7.13 0 004.168 6.434z" fill="#25F4EE" fill-opacity="0.5"/></svg>
            <div class="flex-1">
              <div class="text-sm font-bold mb-0.5">TikTok Pixel</div>
              <div class="text-xs text-text-secondary leading-relaxed">Mesurez l'impact de vos publicités TikTok sur les ventes de billets</div>
            </div>
            <UiBaseToggle :model-value="pixelTt" @update:model-value="pixelTt = $event" />
          </div>
          <div v-if="pixelTt" class="px-5 pb-5 border-t border-border-light">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1.5">Pixel ID</label>
                <input v-model="pixelTtId" placeholder="Ex: CXXXXXXXXXXXXXXXXX" class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-surface text-text-primary text-sm focus:outline-none focus:border-orange-primary transition" />
              </div>
            </div>
            <div class="mt-4">
              <div class="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Événements suivis automatiquement</div>
              <div class="flex flex-wrap gap-1.5"><span class="border border-border-light rounded-full px-2.5 py-0.5 text-xs font-semibold text-text-secondary font-mono">ViewContent</span><span class="border border-border-light rounded-full px-2.5 py-0.5 text-xs font-semibold text-text-secondary font-mono">AddToCart</span><span class="border border-border-light rounded-full px-2.5 py-0.5 text-xs font-semibold text-text-secondary font-mono">PlaceAnOrder</span><span class="border border-border-light rounded-full px-2.5 py-0.5 text-xs font-semibold text-text-secondary font-mono">CompletePayment</span></div>
            </div>
            <div class="mt-4 flex justify-end">
              <button class="px-6 py-2.5 rounded-lg text-sm font-medium bg-orange-primary text-white hover:bg-orange-light transition-colors cursor-pointer" @click="savePixel('TikTok', pixelTtId)">Enregistrer</button>
            </div>
          </div>
        </div>

        <!-- Google Analytics -->
        <div class="bg-surface border border-border-light rounded-xl overflow-hidden transition-colors" :class="pixelGa ? 'border-orange-primary' : ''">
          <div class="flex items-center gap-3.5 px-5 py-4 max-sm:flex-col max-sm:gap-2.5">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" class="shrink-0"><rect width="40" height="40" rx="8" fill="#E37400"/><path d="M27.5 28.75a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" fill="white"/><path d="M27.5 13.75v10" stroke="white" stroke-width="3.5" stroke-linecap="round"/><path d="M20 17.5v7.5" stroke="white" stroke-width="3.5" stroke-linecap="round"/><path d="M12.5 21.25v3.75" stroke="white" stroke-width="3.5" stroke-linecap="round"/></svg>
            <div class="flex-1">
              <div class="text-sm font-bold mb-0.5">Google Analytics 4</div>
              <div class="text-xs text-text-secondary leading-relaxed">Analysez le trafic sur vos pages événement et l'entonnoir d'achat</div>
            </div>
            <UiBaseToggle :model-value="pixelGa" @update:model-value="pixelGa = $event" />
          </div>
          <div v-if="pixelGa" class="px-5 pb-5 border-t border-border-light">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1.5">Measurement ID</label>
                <input v-model="pixelGaId" placeholder="Ex: G-XXXXXXXXXX" class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-surface text-text-primary text-sm focus:outline-none focus:border-orange-primary transition" />
              </div>
            </div>
            <div class="mt-4">
              <div class="text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">Événements suivis automatiquement</div>
              <div class="flex flex-wrap gap-1.5"><span class="border border-border-light rounded-full px-2.5 py-0.5 text-xs font-semibold text-text-secondary font-mono">page_view</span><span class="border border-border-light rounded-full px-2.5 py-0.5 text-xs font-semibold text-text-secondary font-mono">view_item</span><span class="border border-border-light rounded-full px-2.5 py-0.5 text-xs font-semibold text-text-secondary font-mono">begin_checkout</span><span class="border border-border-light rounded-full px-2.5 py-0.5 text-xs font-semibold text-text-secondary font-mono">purchase</span></div>
            </div>
            <div class="mt-4 flex justify-end">
              <button class="px-6 py-2.5 rounded-lg text-sm font-medium bg-orange-primary text-white hover:bg-orange-light transition-colors cursor-pointer" @click="savePixel('Google Analytics', pixelGaId)">Enregistrer</button>
            </div>
          </div>
        </div>

        <!-- Google Ads -->
        <div class="bg-surface border border-border-light rounded-xl overflow-hidden transition-colors" :class="pixelGads ? 'border-orange-primary' : ''">
          <div class="flex items-center gap-3.5 px-5 py-4 max-sm:flex-col max-sm:gap-2.5">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" class="shrink-0"><rect width="40" height="40" rx="8" fill="#4285F4"/><circle cx="14" cy="26" r="4" fill="#FBBC04"/><path d="M14 14l12 12" stroke="#34A853" stroke-width="4" stroke-linecap="round"/><path d="M14 14l12-0" stroke="#EA4335" stroke-width="4" stroke-linecap="round"/></svg>
            <div class="flex-1">
              <div class="text-sm font-bold mb-0.5">Google Ads Conversion</div>
              <div class="text-xs text-text-secondary leading-relaxed">Suivez les conversions de vos campagnes Google Ads</div>
            </div>
            <UiBaseToggle :model-value="pixelGads" @update:model-value="pixelGads = $event" />
          </div>
          <div v-if="pixelGads" class="px-5 pb-5 border-t border-border-light">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-4">
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1.5">Conversion ID</label>
                <input v-model="pixelGadsId" placeholder="Ex: AW-XXXXXXXXX" class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-surface text-text-primary text-sm focus:outline-none focus:border-orange-primary transition" />
              </div>
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1.5">Conversion Label</label>
                <input v-model="pixelGadsLabel" placeholder="Ex: XXXXXXXXXXXXXXXXXXXX" class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-surface text-text-primary text-sm focus:outline-none focus:border-orange-primary transition" />
              </div>
            </div>
            <div class="mt-4 flex justify-end">
              <button class="px-6 py-2.5 rounded-lg text-sm font-medium bg-orange-primary text-white hover:bg-orange-light transition-colors cursor-pointer" @click="savePixelGads">Enregistrer</button>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-orange-dim border border-border-light rounded-xl px-5 py-4 text-sm text-text-secondary leading-relaxed mt-4 flex items-start gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
        <span>Les pixels sont automatiquement installés sur toutes vos pages événement. Les données de conversion sont envoyées dès qu'un billet est acheté.</span>
      </div>
    </div>
  </div>
</template>
