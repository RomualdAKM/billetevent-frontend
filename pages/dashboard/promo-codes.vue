<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const api = useOrganizerApi()
const { success, error } = useNotification()

const loading = ref(false)
const actionLoading = ref(false)
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const selectedCode = ref<any>(null)
const codeCopied = ref<string | null>(null)

const newCode = ref({ code: '', type: 'percentage', value: '', event: '', limit: '', expiresAt: '', minOrderAmount: '', maxPerUser: '' })

// Min date d'expiration = demain (un code qui expire aujourd'hui n'a aucun sens)
const minExpiresAt = computed(() => {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000)
  return d.toISOString().slice(0, 10)
})

const promoCodes = ref<any[]>([])
const events = ref<any[]>([])

const tableColumns = [
  { key: 'code', label: 'Code' },
  { key: 'reduction', label: 'Réduction' },
  { key: 'event_name', label: 'Événement', hideOnMobile: true },
  { key: 'usage', label: 'Utilisations' },
  { key: 'status', label: 'Statut' },
  { key: 'expires_at', label: 'Expire le', hideOnMobile: true },
]

const statusVariantMap: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  active: 'success',
  expired: 'neutral',
  disabled: 'error',
}

const statusLabelMap: Record<string, string> = {
  active: 'Actif',
  expired: 'Expiré',
  disabled: 'Désactivé',
}

const tableRows = computed(() => promoCodes.value.map((promo: any) => ({
  ...promo,
  reduction: promo.type === 'percentage' ? promo.value + '%' : new Intl.NumberFormat('fr-FR').format(promo.value) + ' F CFA',
  event_name: promo.event?.title || promo.event_name || '—',
  usage: `${promo.usage_count ?? 0} / ${promo.usage_limit ?? '∞'}`,
  usagePercent: promo.usage_limit ? Math.min(100, ((promo.usage_count ?? 0) / promo.usage_limit) * 100) : null,
})))

async function loadPromoCodes() {
  loading.value = true
  try {
    const res = await api.getPromoCodes()
    const data = (res as any).data ?? res
    promoCodes.value = Array.isArray(data) ? data : ((data as any).data ?? [])
  } catch {
    useNotification().error('Impossible de charger les codes promo')
  } finally {
    loading.value = false
  }
}

async function loadEvents() {
  try {
    const res = await api.getEvents()
    const data = (res as any).data ?? res
    events.value = Array.isArray(data) ? data : ((data as any).data ?? [])
  } catch {
    useNotification().error('Impossible de charger les événements')
  }
}

const copyCode = (code: string) => {
  navigator.clipboard.writeText(code)
  codeCopied.value = code
  success('Code copié dans le presse-papier')
  setTimeout(() => { codeCopied.value = null }, 2000)
}

const toggleStatus = async (promo: any) => {
  try {
    await api.togglePromoCode(promo.id)
    promo.status = promo.status === 'active' ? 'expired' : 'active'
    success(promo.status === 'active' ? 'Code réactivé' : 'Code désactivé')
  } catch (err: any) {
    error(err?.message || err?.data?.message || 'Erreur')
  }
}

const openDelete = (promo: any) => {
  selectedCode.value = promo
  showDeleteModal.value = true
}

const confirmDelete = async () => {
  actionLoading.value = true
  try {
    await api.deletePromoCode(selectedCode.value.id)
    const idx = promoCodes.value.findIndex((c: any) => c.id === selectedCode.value.id)
    if (idx !== -1) promoCodes.value.splice(idx, 1)
    showDeleteModal.value = false
    success('Code promo supprimé')
  } catch (err: any) {
    error(err?.message || err?.data?.message || 'Erreur lors de la suppression')
  } finally {
    actionLoading.value = false
  }
}

const createCode = async () => {
  actionLoading.value = true
  try {
    const payload = {
      code: newCode.value.code.toUpperCase(),
      type: newCode.value.type,
      value: Number(newCode.value.value),
      usage_limit: newCode.value.limit ? parseInt(newCode.value.limit) : null,
      expires_at: newCode.value.expiresAt || null,
      event_id: newCode.value.event || null,
      min_order_amount: newCode.value.minOrderAmount ? Number(newCode.value.minOrderAmount) : null,
      max_per_user: newCode.value.maxPerUser ? parseInt(newCode.value.maxPerUser) : null,
    }
    const res = await api.createPromoCode(payload)
    const created = (res as any).data ?? res
    promoCodes.value.push(created)
    showCreateModal.value = false
    newCode.value = { code: '', type: 'percentage', value: '', event: '', limit: '', expiresAt: '', minOrderAmount: '', maxPerUser: '' }
    success('Code promo créé')
  } catch (err: any) {
    error(err?.message || err?.data?.message || 'Erreur lors de la création')
  } finally {
    actionLoading.value = false
  }
}

onMounted(() => {
  loadPromoCodes()
  loadEvents()
})

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div>
    <UiPageHeader title="Codes promo" subtitle="Créez des codes de réduction pour vos événements">
      <button
        class="bg-orange-primary text-white border-none rounded-lg px-5 py-2.5 text-sm font-bold cursor-pointer transition-all duration-150 hover:bg-orange-light flex items-center gap-2"
        @click="showCreateModal = true"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nouveau code
      </button>
    </UiPageHeader>

    <!-- Table via DataTable -->
    <UiDataTable
      :columns="tableColumns"
      :rows="tableRows"
      :loading="loading"
      empty-title="Aucun code promo"
      empty-description="Créez votre premier code de réduction pour stimuler vos ventes de billets. Vous pouvez fixer un pourcentage, un montant fixe, une date d'expiration et un usage max."
      empty-action-label="Créer mon premier code promo"
      @empty-action="showCreateModal = true"
    >
      <template #cell-code="{ row }">
        <button
          class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-2 border border-border-light font-mono text-sm font-bold text-text-primary tracking-wider cursor-pointer hover:bg-surface-3 transition-colors group"
          @click.stop="copyCode(row.code)"
          :title="'Copier ' + row.code"
        >
          {{ row.code }}
          <svg v-if="codeCopied !== row.code" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-text-tertiary group-hover:text-text-primary transition-colors"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-green-dark"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
      </template>

      <template #cell-reduction="{ row }">
        <span class="font-serif font-semibold text-text-primary">{{ row.reduction }}</span>
      </template>

      <template #cell-event_name="{ row }">
        <span class="text-sm text-text-secondary">{{ row.event_name }}</span>
      </template>

      <template #cell-usage="{ row }">
        <div class="flex flex-col gap-1">
          <span class="text-sm text-text-primary font-medium">{{ row.usage }}</span>
          <div v-if="row.usagePercent !== null" class="w-20 h-1.5 bg-border-light rounded-full overflow-hidden">
            <div
              class="h-full rounded-full transition-all"
              :class="row.usagePercent >= 90 ? 'bg-red-error' : row.usagePercent >= 70 ? 'bg-orange-primary' : 'bg-green-dark'"
              :style="{ width: row.usagePercent + '%' }"
            />
          </div>
        </div>
      </template>

      <template #cell-status="{ row }">
        <UiStatusBadge
          :variant="statusVariantMap[row.status] || 'neutral'"
          :label="statusLabelMap[row.status] || row.status"
        />
      </template>

      <template #cell-expires_at="{ row }">
        <span class="text-xs text-text-tertiary">{{ formatDate(row.expires_at) }}</span>
      </template>

      <template #actions="{ row }">
        <div class="flex items-center justify-end gap-1.5">
          <button
            class="w-9 h-9 rounded-lg border border-border-light bg-surface flex items-center justify-center text-text-secondary cursor-pointer transition-all duration-150 hover:bg-surface-2 hover:text-text-primary hover:border-border-medium"
            title="Copier"
            @click.stop="copyCode(row.code)"
          >
            <svg v-if="codeCopied !== row.code" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="text-green-dark"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
          <button
            class="w-9 h-9 rounded-lg border border-border-light bg-surface flex items-center justify-center text-text-secondary cursor-pointer transition-all duration-150 hover:bg-surface-2 hover:text-text-primary hover:border-border-medium"
            :title="row.status === 'active' ? 'Désactiver' : 'Réactiver'"
            @click.stop="toggleStatus(row)"
          >
            <svg v-if="row.status === 'active'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          </button>
          <button
            class="w-9 h-9 rounded-lg border border-border-light bg-surface flex items-center justify-center text-red-error cursor-pointer transition-all duration-150 hover:bg-red-dim hover:border-red-error"
            title="Supprimer"
            @click.stop="openDelete(row)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
      </template>
    </UiDataTable>

    <!-- Modal création -->
    <UiBaseModal
      :is-open="showCreateModal"
      title="Nouveau code promo"
      @close="showCreateModal = false"
    >
      <div class="flex flex-col gap-5">
        <div>
          <label class="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">Code</label>
          <input
            v-model="newCode.code"
            class="py-3 px-4 rounded-lg border border-border-light bg-surface text-sm text-text-primary outline-none w-full transition-all focus:border-orange-primary uppercase font-mono font-bold tracking-wider"
            placeholder="ex : SUMMER2025"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">Type</label>
            <select
              v-model="newCode.type"
              class="py-3 px-4 rounded-lg border border-border-light bg-surface text-sm text-text-primary outline-none w-full transition-all focus:border-orange-primary"
            >
              <option value="percentage">Pourcentage (%)</option>
              <option value="fixed">Montant fixe (FCFA)</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">Valeur</label>
            <input
              v-model="newCode.value"
              type="number"
              class="py-3 px-4 rounded-lg border border-border-light bg-surface text-sm text-text-primary outline-none w-full transition-all focus:border-orange-primary"
              :placeholder="newCode.type === 'percentage' ? 'ex : 20' : 'ex : 5000'"
            />
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">Événement</label>
          <select
            v-model="newCode.event"
            class="py-3 px-4 rounded-lg border border-border-light bg-surface text-sm text-text-primary outline-none w-full transition-all focus:border-orange-primary"
          >
            <option v-for="evt in events" :key="evt.id ?? evt" :value="evt.id ?? evt">{{ evt.title ?? evt.name ?? evt }}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">Limite d'utilisation</label>
            <input
              v-model="newCode.limit"
              type="number"
              class="py-3 px-4 rounded-lg border border-border-light bg-surface text-sm text-text-primary outline-none w-full transition-all focus:border-orange-primary"
              placeholder="ex : 100"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">Date d'expiration</label>
            <input
              v-model="newCode.expiresAt"
              type="date"
              :min="minExpiresAt"
              class="py-3 px-4 rounded-lg border border-border-light bg-surface text-sm text-text-primary outline-none w-full transition-all focus:border-orange-primary"
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">Montant minimum de commande</label>
            <input
              v-model="newCode.minOrderAmount"
              type="number"
              class="py-3 px-4 rounded-lg border border-border-light bg-surface text-sm text-text-primary outline-none w-full transition-all focus:border-orange-primary"
              placeholder="ex : 5000"
            />
          </div>
          <div>
            <label class="block text-xs font-bold text-text-secondary mb-2 uppercase tracking-wider">Utilisations max par client</label>
            <input
              v-model="newCode.maxPerUser"
              type="number"
              class="py-3 px-4 rounded-lg border border-border-light bg-surface text-sm text-text-primary outline-none w-full transition-all focus:border-orange-primary"
              placeholder="ex : 1"
            />
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex items-center justify-end gap-3">
          <button
            class="px-5 py-2.5 rounded-lg text-sm font-medium text-text-secondary bg-surface-2 hover:bg-surface-3 transition-colors cursor-pointer"
            @click="showCreateModal = false"
          >Annuler</button>
          <button
            class="px-5 py-2.5 rounded-lg bg-orange-primary text-white text-sm font-bold cursor-pointer transition-all duration-150 hover:bg-orange-light"
            @click="createCode"
          >Créer le code promo</button>
        </div>
      </template>
    </UiBaseModal>

    <UiConfirmModal
      :is-open="showDeleteModal"
      title="Supprimer le code promo"
      :message="'Supprimer définitivement le code « ' + (selectedCode?.code || '') + ' » ? Cette action est irréversible.'"
      confirm-text="Supprimer"
      cancel-text="Annuler"
      variant="danger"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>
