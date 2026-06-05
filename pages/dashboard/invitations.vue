<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const api = useOrganizerApi()
const { success, error: notifyError } = useNotification()

const loading = ref(false)
const submitting = ref(false)
const activeEvt = ref('')
const newInvModalOpen = ref(false)
const cancelModalOpen = ref(false)
const selectedInv = ref<any>(null)
const events = ref<any[]>([])
const passes = ref<any[]>([])
const modalPasses = ref<any[]>([])
const invitations = ref<any[]>([])

const tableColumns = [
  { key: 'name', label: 'Invité' },
  { key: 'type', label: 'Type' },
  { key: 'event', label: 'Événement', hideOnMobile: true },
  { key: 'sent', label: 'Envoyé', hideOnMobile: true },
  { key: 'status', label: 'Statut' },
]

// Must mirror App\Enums\InvitationType exactly (vip/press/partner/staff/sponsor/artist).
// Tokens validated against assets/css/main.css — no pink-* tokens exist, so
// artist uses the red-dim variant for visual distinction from the others.
const typeClassMap: Record<string, string> = {
  vip: 'bg-gold-dim text-gold',
  press: 'bg-blue-dim text-blue-main',
  partner: 'bg-purple-dim text-purple',
  staff: 'bg-orange-dim text-orange-primary',
  sponsor: 'bg-green-dim text-green-dark',
  artist: 'bg-red-dim text-red-error',
}

const typeLabelMap: Record<string, string> = {
  vip: 'VIP',
  press: 'Presse',
  partner: 'Partenaire',
  staff: 'Staff',
  sponsor: 'Sponsor',
  artist: 'Artiste',
}

const typeVariantMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  VIP: 'warning',
  Presse: 'info',
  Partenaire: 'neutral',
  Staff: 'warning',
  Sponsor: 'success',
  Artiste: 'info',
}

const statusClassMap: Record<string, string> = {
  pending: 'bg-orange-dim text-orange-primary',
  sent: 'bg-blue-dim text-blue-main',
  accepted: 'bg-green-dim text-green-dark',
  scanned: 'bg-green-dim text-green-dark',
  cancelled: 'bg-red-dim text-red-error',
  expired: 'bg-surface-2 text-text-tertiary'
}

const statusLabelMap: Record<string, string> = {
  pending: 'En attente',
  sent: 'Envoyée',
  accepted: 'Acceptée',
  scanned: 'Scannée',
  cancelled: 'Annulée',
  expired: 'Expirée'
}

const statusVariantMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  'En attente': 'warning',
  'Envoyée': 'info',
  'Acceptée': 'success',
  'Scannée': 'success',
  'Annulée': 'error',
  'Expirée': 'neutral',
}

const newInv = ref({
  event_id: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  type: '',
  pass_id: '',
  message: ''
})

const headers = ['Invité', 'Type', 'Événement', 'Envoyé', 'Statut', 'Actions']

function mapInvitation(inv: any) {
  const evt = events.value.find((e: any) => e.id === inv.event_id)
  return {
    ...inv,
    name: `${inv.first_name || ''} ${inv.last_name || ''}`.trim() || inv.email,
    type: typeLabelMap[inv.type] || inv.type,
    typeClass: typeClassMap[inv.type] || 'bg-surface-2 text-text-secondary',
    event: evt?.title || evt?.name || '',
    sent: inv.created_at ? new Date(inv.created_at).toLocaleDateString('fr-FR') : '',
    status: statusLabelMap[inv.status] || inv.status,
    statusClass: statusClassMap[inv.status] || 'bg-surface-2 text-text-secondary',
    canCancel: inv.status === 'pending'
  }
}

const filteredInvitations = computed(() => invitations.value.map(mapInvitation))

const maxInvitations = computed(() => {
  if (!activeEvt.value) return null
  const evt = events.value.find((e: any) => e.id === activeEvt.value || e.id === Number(activeEvt.value))
  return evt?.max_invitations || null
})

async function loadEvents() {
  try {
    const res = await api.getEvents()
    const data = (res as any).data ?? res
    events.value = Array.isArray(data) ? data : ((data as any).data ?? [])
  } catch (err) {
    console.error('Erreur chargement événements:', err)
  }
}

async function loadInvitations() {
  if (!activeEvt.value) { invitations.value = []; return }
  loading.value = true
  try {
    const res = await api.getInvitations(activeEvt.value)
    const data = (res as any).data ?? res
    invitations.value = Array.isArray(data) ? data : ((data as any).data ?? [])
  } catch (err: any) {
    const msg = err?.data?.message || err?.message || 'Impossible de charger les invitations'
    notifyError(msg)
  } finally {
    loading.value = false
  }
}

async function loadPasses() {
  if (!activeEvt.value) { passes.value = []; return }
  try {
    const res = await api.getPasses(activeEvt.value)
    const data = (res as any).data ?? res
    passes.value = Array.isArray(data) ? data : ((data as any).data ?? [])
  } catch (err) {
    console.error('Erreur chargement passes:', err)
  }
}

watch(activeEvt, () => {
  loadInvitations()
  loadPasses()
})

async function loadModalPasses(eventId: any) {
  if (!eventId) { modalPasses.value = []; return }
  try {
    const res = await api.getPasses(eventId)
    const data = (res as any).data ?? res
    modalPasses.value = Array.isArray(data) ? data : ((data as any).data ?? [])
  } catch (err) {
    console.error('Erreur chargement passes modal:', err)
    modalPasses.value = []
  }
}

watch(() => newInv.value.event_id, (newEvtId) => {
  newInv.value.pass_id = ''
  loadModalPasses(newEvtId)
})

const openNewInvitation = () => {
  const preselectedEvent = activeEvt.value || ''
  newInv.value = { event_id: preselectedEvent, first_name: '', last_name: '', email: '', phone: '', type: '', pass_id: '', message: '' }
  if (preselectedEvent) {
    loadModalPasses(preselectedEvent)
  } else {
    modalPasses.value = []
  }
  newInvModalOpen.value = true
}

const submitNewInvitation = async () => {
  const inv = newInv.value
  if (!inv.email || !inv.event_id || !inv.type || !inv.pass_id || !inv.first_name || !inv.last_name) {
    notifyError('Veuillez remplir tous les champs obligatoires')
    return
  }
  submitting.value = true
  try {
    await api.createInvitation(inv.event_id, {
      type: inv.type,
      first_name: inv.first_name,
      last_name: inv.last_name,
      email: inv.email,
      phone: inv.phone,
      pass_id: inv.pass_id,
      message: inv.message || undefined
    })
    newInvModalOpen.value = false
    success(`Invitation envoyée à ${inv.email}`)
    if (activeEvt.value && String(activeEvt.value) === String(inv.event_id)) {
      await loadInvitations()
    }
  } catch (err: any) {
    const msg = err?.message || err?.data?.message || 'Erreur lors de l\'envoi'
    notifyError(msg)
  } finally {
    submitting.value = false
  }
}

const resendInvitation = async (inv: any) => {
  try {
    await api.resendInvitation(activeEvt.value, inv.id)
    success(`Invitation renvoyée à ${inv.email}`)
  } catch (err: any) {
    const msg = err?.message || err?.data?.message || 'Erreur lors du renvoi'
    notifyError(msg)
  }
}

const openCancelInvitation = (inv: any) => {
  selectedInv.value = inv
  cancelModalOpen.value = true
}

const confirmCancelInvitation = async () => {
  if (!selectedInv.value) return
  try {
    await api.cancelInvitation(activeEvt.value, selectedInv.value.id)
    success(`Invitation à ${selectedInv.value.name} annulée`)
    await loadInvitations()
  } catch (err: any) {
    const msg = err?.message || err?.data?.message || 'Erreur lors de l\'annulation'
    notifyError(msg)
  } finally {
    cancelModalOpen.value = false
  }
}

onMounted(() => {
  loadEvents()
})
</script>

<template>
  <div>
    <UiPageHeader title="Invitations" subtitle="Envoyez et suivez vos invitations gratuites">
      <button
        class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-orange-primary text-white hover:bg-orange-light transition-colors cursor-pointer"
        @click="openNewInvitation"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nouvelle invitation
      </button>
    </UiPageHeader>

    <!-- Sélecteur événement -->
    <div class="flex gap-3 mb-5 flex-wrap items-center">
      <span class="text-xs text-text-secondary font-semibold">Événement :</span>
      <select
        v-model="activeEvt"
        class="px-4 py-2 rounded-lg text-sm font-medium bg-surface border border-border-light text-text-primary cursor-pointer transition-colors focus:border-orange-primary outline-none"
      >
        <option value="">-- Sélectionner un événement --</option>
        <option v-for="evt in events" :key="evt.id" :value="evt.id">{{ evt.title || evt.name }}</option>
      </select>
    </div>

    <!-- KPI cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
      <DashboardStatCard :value="String(filteredInvitations.length)" label="Envoyées" color="orange">
        <template #icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></template>
      </DashboardStatCard>
      <DashboardStatCard :value="String(filteredInvitations.filter(i => i.status === 'Acceptée').length)" label="Acceptées" color="blue">
        <template #icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></template>
      </DashboardStatCard>
      <DashboardStatCard :value="String(filteredInvitations.filter(i => i.status === 'En attente').length)" label="En attente" color="orange">
        <template #icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></template>
      </DashboardStatCard>
      <DashboardStatCard :value="String(filteredInvitations.filter(i => i.status === 'Scannée').length)" label="Scannées" color="blue">
        <template #icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg></template>
      </DashboardStatCard>
    </div>

    <!-- Barre de progression invitations -->
    <div v-if="maxInvitations" class="bg-orange-dim border border-orange-primary/20 rounded-xl px-5 py-3.5 mb-5 flex items-center gap-3">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-primary shrink-0"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
      <span class="text-sm text-text-primary font-semibold">{{ filteredInvitations.length }} / {{ maxInvitations }} invitations envoyées</span>
      <div class="flex-1 h-2 bg-border-light rounded-full overflow-hidden ml-2">
        <div class="h-full bg-orange-primary rounded-full transition-all" :style="{ width: Math.min(100, (filteredInvitations.length / maxInvitations) * 100) + '%' }" />
      </div>
    </div>

    <!-- État: pas d'événement sélectionné -->
    <div v-if="!activeEvt && !loading">
      <UiEmptyState
        title="Sélectionnez un événement"
        description="Choisissez un événement ci-dessus pour voir et gérer ses invitations."
      >
        <template #icon>
          <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline stroke-linecap="round" stroke-linejoin="round" points="22,6 12,13 2,6"/>
          </svg>
        </template>
      </UiEmptyState>
    </div>

    <!-- Table des invitations -->
    <UiDataTable
      v-else
      :columns="tableColumns"
      :rows="filteredInvitations"
      :loading="loading"
      empty-title="Aucune invitation"
      empty-description="Aucune invitation n'a été envoyée pour cet événement."
    >
      <template #cell-name="{ row }">
        <div>
          <span class="font-semibold text-text-primary">{{ row.name }}</span>
          <div class="text-xs text-text-tertiary mt-0.5">{{ row.email }}</div>
        </div>
      </template>

      <template #cell-type="{ row }">
        <UiStatusBadge
          :variant="typeVariantMap[row.type] || 'neutral'"
          :label="row.type"
        />
      </template>

      <template #cell-sent="{ row }">
        <span class="text-xs text-text-secondary">{{ row.sent }}</span>
      </template>

      <template #cell-status="{ row }">
        <UiStatusBadge
          :variant="statusVariantMap[row.status] || 'neutral'"
          :label="row.status"
        />
      </template>

      <template #actions="{ row }">
        <div class="flex gap-1.5 justify-end">
          <button
            class="w-9 h-9 rounded-lg bg-surface-2 border border-border-light flex items-center justify-center cursor-pointer transition-colors text-text-secondary hover:bg-surface-3 hover:text-text-primary hover:border-border-medium"
            title="Renvoyer"
            @click.stop="resendInvitation(row)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
          </button>
          <button
            v-if="row.canCancel"
            class="w-9 h-9 rounded-lg bg-surface-2 border border-border-light flex items-center justify-center cursor-pointer transition-colors text-text-secondary hover:bg-red-dim hover:text-red-error hover:border-red-error"
            title="Annuler"
            @click.stop="openCancelInvitation(row)"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </template>
    </UiDataTable>

    <!-- Modal nouvelle invitation -->
    <UiBaseModal
      :is-open="newInvModalOpen"
      title="Nouvelle invitation"
      size="md"
      @close="newInvModalOpen = false"
    >
      <div class="space-y-5">
        <div>
          <label class="block text-xs font-semibold text-text-secondary mb-2">Événement <span class="text-red-error">*</span></label>
          <select
            v-model="newInv.event_id"
            class="w-full px-4 py-3 rounded-lg bg-surface border border-border-light text-sm text-text-primary font-sans outline-none cursor-pointer transition-colors focus:border-orange-primary"
          >
            <option value="">-- Sélectionner un événement --</option>
            <option v-for="evt in events" :key="evt.id" :value="evt.id">{{ evt.title || evt.name }}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-text-secondary mb-2">Prénom <span class="text-red-error">*</span></label>
            <input
              v-model="newInv.first_name"
              type="text"
              placeholder="Ex: Aminata"
              class="w-full px-4 py-3 rounded-lg bg-surface border border-border-light text-sm text-text-primary font-sans outline-none transition-colors focus:border-orange-primary placeholder:text-text-tertiary"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-text-secondary mb-2">Nom <span class="text-red-error">*</span></label>
            <input
              v-model="newInv.last_name"
              type="text"
              placeholder="Ex: Diallo"
              class="w-full px-4 py-3 rounded-lg bg-surface border border-border-light text-sm text-text-primary font-sans outline-none transition-colors focus:border-orange-primary placeholder:text-text-tertiary"
            />
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-text-secondary mb-2">Email <span class="text-red-error">*</span></label>
          <input
            v-model="newInv.email"
            type="email"
            placeholder="email@exemple.com"
            class="w-full px-4 py-3 rounded-lg bg-surface border border-border-light text-sm text-text-primary font-sans outline-none transition-colors focus:border-orange-primary placeholder:text-text-tertiary"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-text-secondary mb-2">Type <span class="text-red-error">*</span></label>
            <select
              v-model="newInv.type"
              class="w-full px-4 py-3 rounded-lg bg-surface border border-border-light text-sm text-text-primary font-sans outline-none cursor-pointer transition-colors focus:border-orange-primary"
            >
              <option value="" disabled>-- Sélectionner un type --</option>
              <option value="vip">VIP</option>
              <option value="press">Presse</option>
              <option value="partner">Partenaire</option>
              <option value="staff">Staff</option>
              <option value="sponsor">Sponsor</option>
              <option value="artist">Artiste</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-semibold text-text-secondary mb-2">Billet (Pass) <span class="text-red-error">*</span></label>
            <select
              v-model="newInv.pass_id"
              :disabled="!newInv.event_id"
              class="w-full px-4 py-3 rounded-lg bg-surface border border-border-light text-sm text-text-primary font-sans outline-none cursor-pointer transition-colors focus:border-orange-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{{ !newInv.event_id ? 'Choisissez d\'abord un événement' : modalPasses.length ? '-- Sélectionner un billet --' : 'Aucun pass disponible' }}</option>
              <option v-for="p in modalPasses" :key="p.id" :value="p.id">{{ p.name }} {{ p.price ? `(${Number(p.price).toLocaleString('fr-FR')} FCFA)` : '(Gratuit)' }}</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-xs font-semibold text-text-secondary mb-2">Message personnalisé (optionnel)</label>
          <textarea
            v-model="newInv.message"
            rows="3"
            placeholder="Un message à inclure dans l'invitation..."
            class="w-full px-4 py-3 rounded-lg bg-surface border border-border-light text-sm text-text-primary font-sans outline-none transition-colors focus:border-orange-primary placeholder:text-text-tertiary resize-none leading-relaxed"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex items-center justify-end gap-3">
          <button
            class="px-5 py-2.5 rounded-lg text-sm font-medium text-text-secondary bg-surface-2 hover:bg-surface-3 transition-colors cursor-pointer"
            @click="newInvModalOpen = false"
          >Annuler</button>
          <button
            class="px-5 py-2.5 rounded-lg text-sm font-medium text-white bg-orange-primary hover:bg-orange-light transition-colors cursor-pointer"
            @click="submitNewInvitation"
          >Envoyer l'invitation</button>
        </div>
      </template>
    </UiBaseModal>

    <UiConfirmModal
      :is-open="cancelModalOpen"
      title="Annuler l'invitation"
      :message="'Annuler l\'invitation envoyée à ' + (selectedInv?.name || '') + ' (' + (selectedInv?.email || '') + ') ? Cette action est irréversible.'"
      confirm-text="Annuler l'invitation"
      cancel-text="Retour"
      variant="danger"
      @confirm="confirmCancelInvitation"
      @cancel="cancelModalOpen = false"
    />
  </div>
</template>
