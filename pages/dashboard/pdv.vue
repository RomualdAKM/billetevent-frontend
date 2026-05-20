<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const api = useOrganizerApi()
const { success, error, warning } = useNotification()

const loading = ref(false)
const actionLoading = ref(false)
const activeFilter = ref('all')
const showAddPdv = ref(false)
const showEditPdv = ref(false)
const showSales = ref(false)
const showConfirmDeactivate = ref(false)
const selectedPdv = ref<any>(null)

const filters = [
  { key: 'all', label: 'Tous' },
]

const events = ref<any[]>([])

const pdvForm = ref({
  name: '',
  address: '',
  city: '',
  type: 'boutique',
  hours: '',
  phone: '',
  instructions: '',
  events: [] as number[],
  quota: 100,
})

const pdvTypes = [
  { value: 'boutique', label: 'Boutique' },
  { value: 'kiosque', label: 'Kiosque' },
  { value: 'mobile', label: 'Stand mobile' },
  { value: 'partenaire', label: 'Partenaire' },
  { value: 'autre', label: 'Autre' },
]

function resetForm() {
  pdvForm.value = {
    name: '',
    address: '',
    city: '',
    type: 'boutique',
    hours: '',
    phone: '',
    instructions: '',
    events: [],
    quota: 100,
  }
}

function openAdd() {
  resetForm()
  showAddPdv.value = true
}

function buildPdvPayload() {
  return {
    name: pdvForm.value.name,
    address: pdvForm.value.address,
    city: pdvForm.value.city || null,
    type: pdvForm.value.type,
    phone: pdvForm.value.phone || null,
    hours: pdvForm.value.hours || null,
    instructions: pdvForm.value.instructions || null,
    quota: pdvForm.value.quota,
    events: pdvForm.value.events,
  }
}

async function createPdvAction() {
  actionLoading.value = true
  try {
    await api.createPdv(buildPdvPayload())
    showAddPdv.value = false
    success('Point de vente créé avec succès')
    await loadPdvs()
  } catch (err: any) {
    error(err?.message || err?.data?.message || 'Erreur lors de la création')
  } finally {
    actionLoading.value = false
  }
}

function openEdit(pdv: any) {
  // `pdv.events` from the API is an array of {id, title} objects;
  // we want the [id] array so the chip selector stays in sync.
  const eventIds = Array.isArray(pdv.events)
    ? pdv.events.map((e: any) => (typeof e === 'object' ? e.id : e)).filter((id: any) => id != null)
    : []
  pdvForm.value = {
    name: pdv.name,
    address: pdv.address || pdv.rawAddress || '',
    city: pdv.city || '',
    type: pdv.type || 'boutique',
    hours: pdv.hours || '',
    phone: pdv.phone || '',
    instructions: pdv.instructions || '',
    events: eventIds,
    quota: pdv.quotaTotal || pdv.quota || 100,
  }
  selectedPdv.value = pdv
  showEditPdv.value = true
}

async function saveEdit() {
  actionLoading.value = true
  try {
    await api.updatePdv(selectedPdv.value.id, buildPdvPayload())
    showEditPdv.value = false
    success('Point de vente modifié avec succès')
    await loadPdvs()
  } catch (err: any) {
    error(err?.message || err?.data?.message || 'Erreur lors de la modification')
  } finally {
    actionLoading.value = false
  }
}

async function openSales(pdv: any) {
  selectedPdv.value = pdv
  showSales.value = true
  try {
    const res = await api.getPdvStats(pdv.id)
    const data = res.data ?? res
    const sales = (data.sales || []).map((s: any) => ({
      date: s.sold_at ? new Date(s.sold_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—',
      event: s.event_title || '—',
      ticket: s.pass_name || '—',
      qty: s.quantity,
      amount: formatNumber(Number(s.amount) || 0),
    }))
    const totalRevenue = Number(data.total_revenue) || 0
    selectedPdv.value = {
      ...pdv,
      ...data,
      sales,
      tickets: data.total_quantity ?? pdv.tickets,
      revenueNum: totalRevenue,
      revenue: formatNumber(totalRevenue),
    }
    // Patch the list entry so the KPI tile updates with real revenue
    const idx = pdvs.value.findIndex((p: any) => p.id === pdv.id)
    if (idx !== -1) {
      pdvs.value[idx] = { ...pdvs.value[idx], revenueNum: totalRevenue, revenue: formatNumber(totalRevenue) }
    }
  } catch {
    useNotification().error('Impossible de charger les statistiques du point de vente')
  }
}

function openDeactivate(pdv: any) {
  selectedPdv.value = pdv
  showConfirmDeactivate.value = true
}

async function confirmDeactivate() {
  actionLoading.value = true
  try {
    await api.togglePdv(selectedPdv.value.id)
    showConfirmDeactivate.value = false
    warning(`${selectedPdv.value.name} a été désactivé`)
    await loadPdvs()
  } catch (err: any) {
    error(err?.message || err?.data?.message || 'Erreur')
  } finally {
    actionLoading.value = false
  }
}

const pdvs = ref<any[]>([])

const formatNumber = (n: number) => new Intl.NumberFormat('fr-FR').format(n)

const kpis = computed(() => {
  const active = pdvs.value.filter((p: any) => p.is_active !== false).length
  const totalTickets = pdvs.value.reduce((sum: number, p: any) => sum + (p.tickets || 0), 0)
  const totalRevenue = pdvs.value.reduce((sum: number, p: any) => sum + (p.revenueNum || 0), 0)
  const totalQuota = pdvs.value.reduce((sum: number, p: any) => sum + (p.quotaTotal || 0), 0)
  const sharePct = totalQuota > 0 ? Math.round((totalTickets / totalQuota) * 100) : 0
  return [
    { value: String(active), label: 'Points de vente actifs', sublabel: 'Guichets physiques', iconColor: 'text-orange-primary', icon: 'home' },
    { value: formatNumber(totalTickets), label: 'Billets vendus en physique', sublabel: 'Tous PDV confondus', iconColor: 'text-blue-main', icon: 'ticket' },
    { value: formatNumber(totalRevenue), label: 'FCFA en physique', sublabel: 'Chiffre d\'affaires PDV', iconColor: 'text-green-dark', icon: 'dollar' },
    { value: sharePct + '%', label: 'Remplissage moyen', sublabel: 'Billets vendus / quota total', iconColor: 'text-orange-primary', icon: 'chart' },
  ]
})

const filteredPdvs = computed(() => {
  if (activeFilter.value === 'all') return pdvs.value
  return pdvs.value.filter((p: any) => (p.eventKeys || []).includes(activeFilter.value))
})

async function loadPdvs() {
  loading.value = true
  try {
    const res = await api.getPdvs()
    const data = res.data ?? res
    const rawPdvs = Array.isArray(data) ? data : (data.data ?? [])
    pdvs.value = rawPdvs.map((p: any) => {
      const salesCount = p.sales_count ?? 0
      const quotaTotal = p.quota ?? 100
      const quotaPct = quotaTotal > 0 ? Math.round((salesCount / quotaTotal) * 100) : 0
      return {
        ...p,
        tickets: salesCount,
        // Revenue is loaded on-demand via getPdvStats() — list endpoint only
        // returns counts to keep the page snappy with many PDVs.
        revenueNum: 0,
        revenue: '—',
        quotaTotal,
        quotaPct,
        quota: quotaPct + '%',
        quotaColor: quotaPct >= 90 ? 'text-red-error' : quotaPct >= 70 ? 'text-orange-primary' : 'text-green-dark',
        barColor: quotaPct >= 90 ? 'bg-red-error' : quotaPct >= 70 ? 'bg-orange-primary' : 'bg-green-dark',
      }
    })
  } catch {
    useNotification().error('Impossible de charger les points de vente')
  } finally {
    loading.value = false
  }
}

async function loadEvents() {
  try {
    const res = await api.getEvents()
    const data = res.data ?? res
    events.value = Array.isArray(data) ? data : (data.data ?? [])
  } catch {
    useNotification().error('Impossible de charger les événements')
  }
}

function toggleEvent(id: number) {
  const idx = pdvForm.value.events.indexOf(id)
  if (idx === -1) pdvForm.value.events.push(id)
  else pdvForm.value.events.splice(idx, 1)
}

onMounted(() => {
  loadPdvs()
  loadEvents()
})
</script>

<template>
  <div>
    <UiPageHeader title="Points de vente" subtitle="Configurez vos points de vente physiques">
      <button class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-orange-primary text-white hover:bg-orange-light transition-colors border-none cursor-pointer" @click="openAdd">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nouveau PDV
      </button>
    </UiPageHeader>

    <!-- Filters -->
    <div class="flex gap-2 mb-5 flex-wrap items-center">
      <span class="text-xs text-text-secondary font-semibold">Événement :</span>
      <button
        v-for="f in filters"
        :key="f.key"
        class="px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all"
        :class="activeFilter === f.key ? 'bg-orange-dim border-orange-primary text-orange-primary' : 'bg-surface-2 border-border-light text-text-secondary hover:bg-orange-dim hover:border-orange-primary hover:text-orange-primary'"
        @click="activeFilter = f.key"
      >{{ f.label }}</button>
    </div>

    <!-- KPIs -->
    <div class="grid grid-cols-4 gap-4 mb-6 max-lg:grid-cols-2 max-sm:grid-cols-1">
      <div
        v-for="(kpi, i) in kpis"
        :key="i"
        class="bg-surface border border-border-light rounded-xl p-5 hover:border-border-medium transition-colors"
      >
        <div class="flex items-center justify-between mb-3">
          <div :class="kpi.iconColor">
            <svg v-if="kpi.icon === 'home'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <svg v-if="kpi.icon === 'ticket'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>
            <svg v-if="kpi.icon === 'dollar'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            <svg v-if="kpi.icon === 'chart'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </div>
        </div>
        <div class="font-serif text-2xl leading-none mb-1">{{ kpi.value }}</div>
        <div class="text-xs font-medium text-text-primary">{{ kpi.label }}</div>
        <div class="text-[11px] text-text-tertiary mt-0.5">{{ kpi.sublabel }}</div>
      </div>
    </div>

    <!-- PDV cards or empty state -->
    <div v-if="filteredPdvs.length === 0 && !loading" class="mb-6">
      <UiEmptyState
        title="Aucun point de vente"
        description="Créez votre premier point de vente physique pour vendre des billets en personne."
        action-label="Ajouter un PDV"
        @action="openAdd"
      >
        <template #icon>
          <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline stroke-linecap="round" stroke-linejoin="round" points="9 22 9 12 15 12 15 22"/></svg>
        </template>
      </UiEmptyState>
    </div>

    <div v-else class="grid grid-cols-2 gap-5 mb-6 max-lg:grid-cols-1">
      <div
        v-for="(pdv, i) in filteredPdvs"
        :key="i"
        class="bg-surface border border-border-light rounded-xl overflow-hidden hover:border-border-medium transition-colors"
      >
        <div class="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <div class="text-sm font-semibold text-text-primary">{{ pdv.name }}</div>
          <UiStatusBadge
            :variant="pdv.is_active !== false ? 'success' : 'error'"
            :label="pdv.is_active !== false ? 'Actif' : 'Inactif'"
            size="sm"
          />
        </div>
        <div class="flex flex-col gap-3 p-5">
          <div class="text-sm text-text-secondary">
            {{ pdv.address }}<template v-if="pdv.city">, {{ pdv.city }}</template>
          </div>
          <div v-if="pdv.type" class="flex items-center gap-2 -mt-1">
            <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-orange-dim text-orange-primary">{{ pdvTypes.find(t => t.value === pdv.type)?.label || pdv.type }}</span>
          </div>
          <div class="flex justify-between items-center p-3 bg-surface-2/50 rounded-xl">
            <div class="text-center">
              <div class="font-serif text-xl text-text-primary">{{ pdv.tickets }}</div>
              <div class="text-[11px] text-text-tertiary">billets vendus</div>
            </div>
            <div class="w-px h-8 bg-border-light" />
            <div class="text-center">
              <div class="font-serif text-xl text-text-primary">{{ pdv.revenue }}</div>
              <div class="text-[11px] text-text-tertiary">FCFA</div>
            </div>
            <div class="w-px h-8 bg-border-light" />
            <div class="text-center">
              <div class="font-serif text-xl" :class="pdv.quotaColor">{{ pdv.quota }}</div>
              <div class="text-[11px] text-text-tertiary">du quota</div>
            </div>
          </div>
          <!-- Progress bar -->
          <div>
            <div class="flex items-center justify-between text-[11px] text-text-tertiary mb-1.5">
              <span>{{ pdv.tickets }} / {{ pdv.quotaTotal }} billets</span>
              <span :class="pdv.quotaColor" class="font-semibold">{{ pdv.quota }}</span>
            </div>
            <div class="h-1.5 rounded-full bg-surface-2 overflow-hidden">
              <div class="h-full rounded-full transition-all duration-500" :class="pdv.barColor" :style="{ width: pdv.quota }" />
            </div>
          </div>
          <!-- Actions -->
          <div class="flex gap-2 mt-1">
            <button class="w-9 h-9 rounded-lg border border-border-light bg-surface-2 text-text-secondary hover:border-orange-primary hover:text-orange-primary transition-colors cursor-pointer flex items-center justify-center shrink-0" title="Modifier" @click="openEdit(pdv)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button class="w-9 h-9 rounded-lg border border-border-light bg-surface-2 text-text-secondary hover:border-orange-primary hover:text-orange-primary transition-colors cursor-pointer flex items-center justify-center shrink-0" title="Voir les ventes" @click="openSales(pdv)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            </button>
            <button class="w-9 h-9 rounded-lg border border-border-light bg-surface-2 text-text-secondary hover:border-red-error hover:text-red-error transition-colors cursor-pointer flex items-center justify-center shrink-0" title="Désactiver" @click="openDeactivate(pdv)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add PDV Modal -->
    <UiBaseModal :is-open="showAddPdv" title="Ajouter un point de vente" size="md" @close="showAddPdv = false">
      <div class="flex flex-col gap-5">
        <div>
          <label class="text-xs font-bold text-text-secondary block mb-1.5">Nom du PDV <span class="text-orange-primary">*</span></label>
          <input v-model="pdvForm.name" placeholder="Ex: Guichet principal" class="w-full px-3 py-2.5 rounded-lg border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-colors focus:border-orange-primary focus:ring-1 focus:ring-orange-primary/40" />
        </div>
        <div class="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <div>
            <label class="text-xs font-bold text-text-secondary block mb-1.5">Type</label>
            <select v-model="pdvForm.type" class="w-full px-3 py-2.5 rounded-lg border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-colors cursor-pointer focus:border-orange-primary">
              <option v-for="t in pdvTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-text-secondary block mb-1.5">Ville</label>
            <input v-model="pdvForm.city" placeholder="Ex: Cotonou" class="w-full px-3 py-2.5 rounded-lg border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-colors focus:border-orange-primary focus:ring-1 focus:ring-orange-primary/40" />
          </div>
        </div>
        <div>
          <label class="text-xs font-bold text-text-secondary block mb-1.5">Adresse <span class="text-orange-primary">*</span></label>
          <input v-model="pdvForm.address" placeholder="Ex: Avenue Cheikh Anta Diop, Dakar" class="w-full px-3 py-2.5 rounded-lg border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-colors focus:border-orange-primary focus:ring-1 focus:ring-orange-primary/40" />
        </div>
        <div class="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <div>
            <label class="text-xs font-bold text-text-secondary block mb-1.5">Horaires d'ouverture</label>
            <input v-model="pdvForm.hours" placeholder="Ex: Lun-Sam 9h-18h" class="w-full px-3 py-2.5 rounded-lg border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-colors focus:border-orange-primary focus:ring-1 focus:ring-orange-primary/40" />
          </div>
          <div>
            <label class="text-xs font-bold text-text-secondary block mb-1.5">Téléphone contact</label>
            <input v-model="pdvForm.phone" placeholder="Ex: +221 77 000 00 00" class="w-full px-3 py-2.5 rounded-lg border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-colors focus:border-orange-primary focus:ring-1 focus:ring-orange-primary/40" />
          </div>
        </div>
        <div>
          <label class="text-xs font-bold text-text-secondary block mb-1.5">Instructions / Repères</label>
          <textarea v-model="pdvForm.instructions" rows="3" placeholder="Ex: À côté de la pharmacie centrale, demander Marie à l'accueil" class="w-full px-3 py-2.5 rounded-lg border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-colors resize-y focus:border-orange-primary focus:ring-1 focus:ring-orange-primary/40" />
        </div>
        <div>
          <label class="text-xs font-bold text-text-secondary block mb-1.5">Événements assignés</label>
          <div v-if="events.length" class="flex flex-wrap gap-2">
            <button
              v-for="ev in events"
              :key="ev.id"
              type="button"
              class="px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors"
              :class="pdvForm.events.includes(ev.id) ? 'border-orange-primary text-orange-primary bg-orange-dim' : 'border-border-light text-text-secondary bg-surface-2 hover:border-border-medium'"
              @click="toggleEvent(ev.id)"
            >{{ ev.title }}</button>
          </div>
          <p v-else class="text-xs text-text-tertiary italic">Aucun événement disponible</p>
        </div>
        <div>
          <label class="text-xs font-bold text-text-secondary block mb-1.5">Quota de billets</label>
          <input v-model.number="pdvForm.quota" type="number" min="1" class="w-full px-3 py-2.5 rounded-lg border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-colors focus:border-orange-primary focus:ring-1 focus:ring-orange-primary/40" />
        </div>
      </div>
      <template #footer>
        <div class="flex items-center justify-end gap-2.5">
          <button :disabled="actionLoading" class="px-4 py-2.5 rounded-lg text-sm font-semibold text-text-secondary bg-surface-2 hover:bg-surface-3 transition-colors cursor-pointer border-none disabled:opacity-60" @click="showAddPdv = false">Annuler</button>
          <button :disabled="actionLoading" class="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-orange-primary hover:bg-orange-light transition-colors cursor-pointer border-none disabled:opacity-60" @click="createPdvAction">{{ actionLoading ? 'Création…' : 'Créer le PDV' }}</button>
        </div>
      </template>
    </UiBaseModal>

    <!-- Edit PDV Modal -->
    <UiBaseModal :is-open="showEditPdv" title="Modifier le point de vente" size="md" @close="showEditPdv = false">
      <div class="flex flex-col gap-5">
        <div>
          <label class="text-xs font-bold text-text-secondary block mb-1.5">Nom du PDV <span class="text-orange-primary">*</span></label>
          <input v-model="pdvForm.name" class="w-full px-3 py-2.5 rounded-lg border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-colors focus:border-orange-primary focus:ring-1 focus:ring-orange-primary/40" />
        </div>
        <div class="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <div>
            <label class="text-xs font-bold text-text-secondary block mb-1.5">Type</label>
            <select v-model="pdvForm.type" class="w-full px-3 py-2.5 rounded-lg border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-colors cursor-pointer focus:border-orange-primary">
              <option v-for="t in pdvTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold text-text-secondary block mb-1.5">Ville</label>
            <input v-model="pdvForm.city" class="w-full px-3 py-2.5 rounded-lg border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-colors focus:border-orange-primary focus:ring-1 focus:ring-orange-primary/40" />
          </div>
        </div>
        <div>
          <label class="text-xs font-bold text-text-secondary block mb-1.5">Adresse</label>
          <input v-model="pdvForm.address" class="w-full px-3 py-2.5 rounded-lg border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-colors focus:border-orange-primary focus:ring-1 focus:ring-orange-primary/40" />
        </div>
        <div class="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
          <div>
            <label class="text-xs font-bold text-text-secondary block mb-1.5">Horaires d'ouverture</label>
            <input v-model="pdvForm.hours" class="w-full px-3 py-2.5 rounded-lg border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-colors focus:border-orange-primary focus:ring-1 focus:ring-orange-primary/40" />
          </div>
          <div>
            <label class="text-xs font-bold text-text-secondary block mb-1.5">Téléphone contact</label>
            <input v-model="pdvForm.phone" class="w-full px-3 py-2.5 rounded-lg border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-colors focus:border-orange-primary focus:ring-1 focus:ring-orange-primary/40" />
          </div>
        </div>
        <div>
          <label class="text-xs font-bold text-text-secondary block mb-1.5">Instructions / Repères</label>
          <textarea v-model="pdvForm.instructions" rows="3" class="w-full px-3 py-2.5 rounded-lg border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-colors resize-y focus:border-orange-primary focus:ring-1 focus:ring-orange-primary/40" />
        </div>
        <div>
          <label class="text-xs font-bold text-text-secondary block mb-1.5">Événements assignés</label>
          <div v-if="events.length" class="flex flex-wrap gap-2">
            <button
              v-for="ev in events"
              :key="ev.id"
              type="button"
              class="px-3 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors"
              :class="pdvForm.events.includes(ev.id) ? 'border-orange-primary text-orange-primary bg-orange-dim' : 'border-border-light text-text-secondary bg-surface-2 hover:border-border-medium'"
              @click="toggleEvent(ev.id)"
            >{{ ev.title }}</button>
          </div>
          <p v-else class="text-xs text-text-tertiary italic">Aucun événement disponible</p>
        </div>
        <div>
          <label class="text-xs font-bold text-text-secondary block mb-1.5">Quota de billets</label>
          <input v-model.number="pdvForm.quota" type="number" min="1" class="w-full px-3 py-2.5 rounded-lg border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-colors focus:border-orange-primary focus:ring-1 focus:ring-orange-primary/40" />
        </div>
      </div>
      <template #footer>
        <div class="flex items-center justify-end gap-2.5">
          <button :disabled="actionLoading" class="px-4 py-2.5 rounded-lg text-sm font-semibold text-text-secondary bg-surface-2 hover:bg-surface-3 transition-colors cursor-pointer border-none disabled:opacity-60" @click="showEditPdv = false">Annuler</button>
          <button :disabled="actionLoading" class="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-orange-primary hover:bg-orange-light transition-colors cursor-pointer border-none disabled:opacity-60" @click="saveEdit">{{ actionLoading ? 'Enregistrement…' : 'Enregistrer' }}</button>
        </div>
      </template>
    </UiBaseModal>

    <!-- Sales Modal -->
    <UiBaseModal :is-open="showSales" :title="'Ventes — ' + (selectedPdv?.name || '')" size="lg" @close="showSales = false">
      <template v-if="selectedPdv">
        <div class="grid grid-cols-3 gap-4 mb-6 max-sm:grid-cols-1">
          <div class="bg-surface-2/50 rounded-xl p-4 text-center">
            <div class="font-serif text-xl text-text-primary">{{ selectedPdv.tickets }}</div>
            <div class="text-xs text-text-tertiary">Billets vendus</div>
          </div>
          <div class="bg-surface-2/50 rounded-xl p-4 text-center">
            <div class="font-serif text-xl text-text-primary">{{ selectedPdv.revenue }}</div>
            <div class="text-xs text-text-tertiary">FCFA</div>
          </div>
          <div class="bg-surface-2/50 rounded-xl p-4 text-center">
            <div class="font-serif text-xl" :class="selectedPdv.quotaColor">{{ selectedPdv.quota }}</div>
            <div class="text-xs text-text-tertiary">Du quota</div>
          </div>
        </div>
        <div v-if="(selectedPdv.sales || []).length === 0" class="bg-surface-2/40 border border-border-light rounded-xl p-8 text-center text-sm text-text-tertiary">
          Aucune vente enregistrée pour ce point de vente.
        </div>
        <div v-else class="border border-border-light rounded-xl overflow-hidden">
          <table class="w-full text-sm">
            <thead>
              <tr class="bg-surface-2/50 border-b border-border-light">
                <th class="text-left px-4 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Date</th>
                <th class="text-left px-4 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Événement</th>
                <th class="text-left px-4 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Pass</th>
                <th class="text-center px-4 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Qté</th>
                <th class="text-right px-4 py-3 text-[11px] font-bold text-text-tertiary uppercase tracking-wider">Montant</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(sale, si) in selectedPdv.sales" :key="si" class="border-b border-border-light/60 last:border-0">
                <td class="px-4 py-4 text-text-secondary">{{ sale.date }}</td>
                <td class="px-4 py-4 text-text-primary">{{ sale.event }}</td>
                <td class="px-4 py-4 text-text-primary font-medium">{{ sale.ticket }}</td>
                <td class="px-4 py-4 text-center text-text-primary">{{ sale.qty }}</td>
                <td class="px-4 py-4 text-right font-semibold text-text-primary">{{ sale.amount }} FCFA</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </UiBaseModal>

    <!-- Deactivate confirm -->
    <UiConfirmModal
      :is-open="showConfirmDeactivate"
      title="Désactiver le point de vente"
      :message="'Êtes-vous sûr de vouloir désactiver « ' + (selectedPdv?.name || '') + ' » ? Les ventes seront suspendues.'"
      confirm-text="Désactiver"
      cancel-text="Annuler"
      variant="warning"
      @confirm="confirmDeactivate"
      @cancel="showConfirmDeactivate = false"
    />
  </div>
</template>
