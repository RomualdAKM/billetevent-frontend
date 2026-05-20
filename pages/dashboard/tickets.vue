<template>
  <div class="flex flex-col gap-6">
    <UiPageHeader title="Billets & Ventes" subtitle="Consultez et gérez toutes vos ventes de billets" />

    <!-- Filtres : événement + statut -->
    <div class="flex items-center gap-3 flex-wrap">
      <div class="relative shrink-0">
        <select
          v-model="selectedEvt"
          class="appearance-none pr-9 pl-3.5 py-2.5 rounded-lg border border-border-light bg-surface text-sm font-semibold text-text-primary font-sans cursor-pointer outline-none transition-[border-color] duration-150 focus:border-orange-primary"
        >
          <option v-for="opt in evtOptions" :key="opt.key" :value="opt.key">{{ opt.label }}</option>
        </select>
        <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
    </div>

    <!-- Stat Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
      <DashboardStatCard :value="currentStats.total" label="Total transactions" color="orange" :trend="{ direction: 'up', value: '12%' }">
        <template #icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="9" y1="9" x2="9" y2="15"/></svg></template>
      </DashboardStatCard>
      <DashboardStatCard :value="currentStats.confirmed" :label="currentStats.confirmedLabel" color="blue">
        <template #icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></template>
      </DashboardStatCard>
      <DashboardStatCard :value="currentStats.confirmed" :label="currentStats.netLabel">
        <template #icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></template>
      </DashboardStatCard>
      <DashboardStatCard :value="currentStats.pending" label="En attente">
        <template #icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></template>
      </DashboardStatCard>
      <DashboardStatCard :value="currentStats.refunded" label="Remboursés">
        <template #icon><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg></template>
      </DashboardStatCard>
    </div>

    <!-- Tabs avec compteurs -->
    <div class="flex gap-2 flex-wrap">
      <button
        v-for="tab in tabDefs"
        :key="tab.key"
        class="flex items-center gap-2 py-2.5 px-4 rounded-lg text-xs font-semibold border cursor-pointer transition-all duration-150"
        :class="activeTab === tab.key
          ? 'bg-orange-dim border-orange-primary text-orange-primary'
          : 'bg-surface border-border-light text-text-secondary hover:border-border-medium hover:text-text-primary'"
        @click="activeTab = tab.key"
      >
        <span v-if="tab.iconHtml" v-html="tab.iconHtml" />
        {{ tab.label }}
        <span class="inline-flex items-center justify-center rounded-full px-2 py-px text-xs font-bold" :class="activeTab === tab.key ? 'bg-orange-primary/15 text-orange-primary' : tab.countClass">{{ getTabCount(tab.key) }}</span>
      </button>
    </div>

    <!-- Table principale -->
    <div class="bg-surface border border-border-light rounded-xl overflow-hidden">
      <div class="flex items-center justify-between px-5 py-4 border-b border-border-light">
        <div class="text-sm font-semibold" :class="currentTabDef.titleClass">{{ currentTabDef.panelTitle }}</div>
        <div v-if="currentTabDef.headerRight" class="text-xs text-text-secondary max-w-xs text-right">{{ currentTabDef.headerRight }}</div>
        <button
          v-else
          class="text-xs text-orange-primary font-semibold cursor-pointer hover:opacity-75 transition-opacity duration-150 flex items-center gap-1.5 bg-transparent border-none"
          @click="exportCSV"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export CSV
        </button>
      </div>

      <div v-if="currentTabDef.alert" class="mx-5 mt-4 p-3 rounded-lg text-sm leading-relaxed" :class="currentTabDef.alertClass" v-html="currentTabDef.alert" />

      <UiDataTable
        :columns="tableColumns"
        :rows="filteredRows"
        :loading="loading"
        empty-title="Aucune transaction"
        empty-description="Aucune transaction ne correspond aux filtres sélectionnés."
      >
        <template #cell-orderId="{ value }">
          <span class="text-xs text-text-secondary font-mono">{{ value }}</span>
        </template>
        <template #cell-buyer="{ value }">
          <span class="text-sm font-semibold text-text-primary">{{ value }}</span>
        </template>
        <template #cell-pass="{ row }">
          <UiStatusBadge variant="info" :label="row.pass" :dot="false" size="sm" />
        </template>
        <template #cell-amount="{ value }">
          <span class="text-sm font-bold text-text-primary">{{ value }}</span>
        </template>
        <template #cell-fees="{ value }">
          <span class="text-xs text-text-secondary">{{ value }}</span>
        </template>
        <template #cell-net="{ value }">
          <span class="text-sm font-bold text-text-primary">{{ value }}</span>
        </template>
        <template #cell-date="{ value }">
          <span class="text-xs text-text-secondary">{{ value }}</span>
        </template>
        <template #cell-statusLabel="{ row }">
          <UiStatusBadge
            :variant="statusBadgeVariant(row.status)"
            :label="row.statusLabel"
            size="sm"
          />
        </template>
        <template #cell-reason="{ row }">
          <span class="text-xs" :class="row.status === 'failed' ? 'text-red-error' : 'text-text-secondary'">{{ row.reason || '—' }}</span>
        </template>
        <template #cell-operator="{ row }">
          <span class="text-xs text-text-secondary">{{ row.operator || '—' }}</span>
        </template>
        <template #actions="{ row }">
          <div class="flex gap-1.5 justify-end">
            <button
              class="w-9 h-9 rounded-lg bg-surface-2 border border-border-light flex items-center justify-center cursor-pointer transition-all duration-150 text-text-secondary hover:bg-surface-3 hover:text-text-primary hover:border-border-medium"
              title="Voir détails"
              @click="openDetail(row)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
            <button
              v-if="row.canRefund"
              class="w-9 h-9 rounded-lg bg-surface-2 border border-border-light flex items-center justify-center cursor-pointer transition-all duration-150 text-text-secondary hover:bg-red-dim hover:text-red-error hover:border-red-error"
              title="Rembourser"
              @click="openRefund(row)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
            </button>
            <button
              v-if="row.canResend"
              class="w-9 h-9 rounded-lg bg-surface-2 border border-border-light flex items-center justify-center cursor-pointer transition-all duration-150 text-text-secondary hover:bg-orange-dim hover:text-orange-primary hover:border-orange-primary"
              title="Relancer"
              @click="resendPayment(row)"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </template>
      </UiDataTable>
    </div>

    <!-- Modal détails -->
    <UiBaseModal
      :is-open="detailModalOpen"
      title="Détails du billet"
      size="md"
      @close="detailModalOpen = false"
    >
      <div v-if="selectedRow" class="space-y-6">
        <!-- Section : Informations billet -->
        <div>
          <h4 class="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3">Informations billet</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-xs text-text-tertiary mb-0.5">Commande</div>
              <div class="text-sm font-semibold text-text-primary">{{ selectedRow.orderId }}</div>
            </div>
            <div>
              <div class="text-xs text-text-tertiary mb-0.5">Événement</div>
              <div class="text-sm text-text-primary">{{ selectedRow.event }}</div>
            </div>
            <div>
              <div class="text-xs text-text-tertiary mb-0.5">Pass</div>
              <div class="text-sm text-text-primary">{{ selectedRow.pass }}</div>
            </div>
            <div>
              <div class="text-xs text-text-tertiary mb-0.5">Date</div>
              <div class="text-sm text-text-primary">{{ selectedRow.date }}</div>
            </div>
          </div>
        </div>

        <div class="h-px bg-border-light" />

        <!-- Section : Informations acheteur -->
        <div>
          <h4 class="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3">Informations acheteur</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-xs text-text-tertiary mb-0.5">Acheteur</div>
              <div class="text-sm font-semibold text-text-primary">{{ selectedRow.buyer }}</div>
            </div>
            <div>
              <div class="text-xs text-text-tertiary mb-0.5">Email</div>
              <div class="text-sm text-text-primary">{{ selectedRow.buyerEmail || '—' }}</div>
            </div>
            <div>
              <div class="text-xs text-text-tertiary mb-0.5">Téléphone</div>
              <div class="text-sm text-text-primary">{{ selectedRow.buyerPhone || '—' }}</div>
            </div>
          </div>
        </div>

        <div class="h-px bg-border-light" />

        <!-- Section : Paiement -->
        <div>
          <h4 class="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-3">Paiement</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <div class="text-xs text-text-tertiary mb-0.5">Montant</div>
              <div class="text-sm font-bold font-serif text-text-primary">{{ selectedRow.amount }}</div>
            </div>
            <div>
              <div class="text-xs text-text-tertiary mb-0.5">Frais</div>
              <div class="text-sm text-text-secondary">{{ selectedRow.fees }}</div>
            </div>
            <div>
              <div class="text-xs text-text-tertiary mb-0.5">Montant net</div>
              <div class="text-sm font-bold text-text-primary">{{ selectedRow.net }}</div>
            </div>
            <div>
              <div class="text-xs text-text-tertiary mb-0.5">Statut</div>
              <UiStatusBadge
                :variant="statusBadgeVariant(selectedRow.status)"
                :label="selectedRow.statusLabel"
                size="sm"
              />
            </div>
            <div>
              <div class="text-xs text-text-tertiary mb-0.5">Méthode</div>
              <div class="text-sm text-text-primary">{{ selectedRow.operator || '—' }}</div>
            </div>
          </div>
        </div>

        <!-- QR code -->
        <div class="flex items-center justify-center py-6 bg-surface-2 rounded-xl">
          <div class="text-center">
            <template v-if="selectedRow.qrData">
              <img v-if="qrImageUrl" :src="qrImageUrl" alt="QR Code" width="200" height="200" class="mx-auto mb-2 rounded-lg" />
              <div v-else class="w-[200px] h-[200px] flex items-center justify-center mx-auto mb-2">
                <div class="w-5 h-5 border-2 border-text-tertiary border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div class="text-xs text-text-tertiary">Scannez pour vérifier</div>
            </template>
            <template v-else>
              <div class="w-[200px] h-[200px] bg-surface-3 rounded-lg flex items-center justify-center mx-auto mb-2 border border-border-light">
                <span class="text-xs text-text-tertiary">QR code non disponible</span>
              </div>
            </template>
          </div>
        </div>
      </div>
    </UiBaseModal>

    <UiConfirmModal
      :is-open="refundModalOpen"
      title="Rembourser le billet"
      :message="'Rembourser le billet ' + (selectedRow?.orderId || '') + ' de ' + (selectedRow?.amount || '') + ' à ' + (selectedRow?.buyer || '') + ' ?'"
      confirm-text="Rembourser"
      cancel-text="Annuler"
      variant="warning"
      @confirm="confirmRefund"
      @cancel="refundModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode'

definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const api = useOrganizerApi()
const { success, info, error: notifyError } = useNotification()

const loading = ref(true)
const selectedEvt = ref('all')
const activeTab = ref('tous')
const detailModalOpen = ref(false)
const refundModalOpen = ref(false)
const selectedRow = ref<any>(null)
const qrImageUrl = ref('')
const evtOptions = ref<{ key: string; label: string }[]>([{ key: 'all', label: 'Tous les événements' }])

const allTransactions = ref<any[]>([])

const evtFilteredTransactions = computed(() => {
  if (selectedEvt.value === 'all') return allTransactions.value
  return allTransactions.value.filter(t => t.evtKey === selectedEvt.value)
})

const tabStatusMap: Record<string, string | null> = { tous: null, confirmes: 'confirmed', attente: 'pending', echoues: 'failed', rembourses: 'refunded' }

const filteredRows = computed(() => {
  const statusFilter = tabStatusMap[activeTab.value]
  if (!statusFilter) return evtFilteredTransactions.value
  return evtFilteredTransactions.value.filter(t => t.status === statusFilter)
})

const getTabCount = (key: string) => {
  const statusFilter = tabStatusMap[key]
  if (!statusFilter) return evtFilteredTransactions.value.length
  return evtFilteredTransactions.value.filter(t => t.status === statusFilter).length
}

const currentStats = computed(() => {
  const txs = evtFilteredTransactions.value
  const confirmed = txs.filter(t => t.status === 'confirmed')
  const totalAmount = confirmed.reduce((sum: number, t: any) => {
    const n = parseInt(String(t.rawAmount || 0))
    return sum + (isNaN(n) ? 0 : n)
  }, 0)
  const totalNet = confirmed.reduce((sum: number, t: any) => {
    const n = parseInt(String(t.rawNet || 0))
    return sum + (isNaN(n) ? 0 : n)
  }, 0)
  const fmtAmount = totalAmount >= 1000000 ? (totalAmount / 1000000).toFixed(1) + 'M' : totalAmount >= 1000 ? Math.round(totalAmount / 1000) + 'K' : String(totalAmount)
  const fmtNet = totalNet >= 1000000 ? (totalNet / 1000000).toFixed(1) + 'M' : totalNet >= 1000 ? Math.round(totalNet / 1000) + 'K' : String(totalNet)
  return {
    total: String(txs.length),
    confirmed: String(confirmed.length),
    confirmedLabel: `Confirmés — ${fmtAmount} FCFA`,
    netLabel: `Revenus nets — ${fmtNet} FCFA`,
    pending: String(txs.filter(t => t.status === 'pending').length),
    refunded: String(txs.filter(t => t.status === 'refunded').length)
  }
})

const statusClassMap: Record<string, string> = {
  confirmed: 'text-green-dark',
  pending: 'text-orange-primary',
  failed: 'text-red-error',
  refunded: 'text-text-secondary',
}

const statusLabelMap: Record<string, string> = {
  confirmed: 'Confirmé',
  pending: 'En attente',
  failed: 'Échoué',
  refunded: 'Remboursé',
}

const statusBadgeVariant = (status: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
  const map: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
    confirmed: 'success',
    pending: 'warning',
    failed: 'error',
    refunded: 'neutral',
  }
  return map[status] || 'neutral'
}

const paymentMethodLabel = (method: string | undefined | null): string => {
  if (!method) return '—'
  const map: Record<string, string> = {
    mobile_money: 'Mobile Money',
    wave: 'Wave',
    card: 'Carte bancaire',
    free: 'Gratuit',
    orange_money: 'Orange Money',
    mtn_money: 'MTN Money',
    moov_money: 'Moov Money',
  }
  return map[method.toLowerCase()] || method
}

const baseColumns = [
  { key: 'orderId', label: '#Commande' },
  { key: 'buyer', label: 'Acheteur' },
  { key: 'event', label: 'Événement', hideOnMobile: true },
  { key: 'pass', label: 'Pass' },
  { key: 'amount', label: 'Montant' },
  { key: 'fees', label: 'Frais', hideOnMobile: true },
  { key: 'net', label: 'Net' },
  { key: 'date', label: 'Date', hideOnMobile: true },
]

const tableColumns = computed(() => {
  const tab = currentTabDef.value
  const cols = [...baseColumns]
  if (tab.hasStatusCol) cols.push({ key: 'statusLabel', label: 'Statut' })
  if (tab.hasReasonCol) cols.push({ key: 'reason', label: 'Raison', hideOnMobile: true })
  if (tab.hasOperatorCol) cols.push({ key: 'operator', label: 'Opérateur', hideOnMobile: true })
  return cols
})

const tabDefs = [
  {
    key: 'tous', label: 'Tous', countClass: 'bg-surface-2 text-text-secondary',
    panelTitle: 'Toutes les transactions', titleClass: 'text-text-primary',
    headers: ['#Commande', 'Acheteur', 'Événement', 'Pass', 'Montant', 'Frais', 'Net', 'Date', 'Statut', 'Actions'],
    hasStatusCol: true, hasReasonCol: false, hasOperatorCol: false
  },
  {
    key: 'confirmes', label: 'Confirmés', countClass: 'bg-orange-dim text-orange-primary',
    iconHtml: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    panelTitle: 'Paiements confirmés', titleClass: 'text-text-primary',
    headers: ['#Commande', 'Acheteur', 'Événement', 'Pass', 'Montant', 'Frais', 'Net', 'Date', 'Actions'],
    hasStatusCol: false, hasReasonCol: false, hasOperatorCol: false
  },
  {
    key: 'attente', label: 'En attente', countClass: 'bg-orange-dim text-orange-primary',
    iconHtml: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    panelTitle: 'Paiements en attente', titleClass: 'text-gold',
    headerRight: "Ces paiements sont en cours de traitement par l'opérateur mobile",
    alert: '<strong>Paiements en attente</strong> — Ils seront automatiquement validés sous 15 minutes.',
    alertClass: 'bg-gold-dim text-gold border border-[rgba(217,119,6,0.2)]',
    headers: ['#Commande', 'Acheteur', 'Événement', 'Pass', 'Montant', 'Frais', 'Net', 'Date', 'Opérateur', 'Actions'],
    hasStatusCol: false, hasReasonCol: false, hasOperatorCol: true
  },
  {
    key: 'echoues', label: 'Échoués', countClass: 'bg-blue-dim text-blue-main',
    iconHtml: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    panelTitle: 'Paiements échoués', titleClass: 'text-red-error',
    headerRight: "Ces paiements n'ont pas abouti — aucun billet n'a été émis",
    alert: "<strong>Paiements échoués</strong> détectés. Vous pouvez renvoyer un lien de paiement à chaque acheteur.",
    alertClass: 'bg-red-dim text-red-error border border-[rgba(220,38,38,0.2)]',
    headers: ['#Commande', 'Acheteur', 'Événement', 'Pass', 'Montant', 'Frais', 'Net', 'Date', 'Raison', 'Actions'],
    hasStatusCol: false, hasReasonCol: true, hasOperatorCol: false
  },
  {
    key: 'rembourses', label: 'Remboursés', countClass: 'bg-blue-dim text-blue-main',
    iconHtml: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>',
    panelTitle: 'Paiements remboursés', titleClass: 'text-blue-main',
    headerRight: "Remboursements traités automatiquement via l'opérateur d'origine",
    headers: ['#Commande', 'Acheteur', 'Événement', 'Pass', 'Montant', 'Frais', 'Net', 'Date', 'Raison', 'Actions'],
    hasStatusCol: false, hasReasonCol: true, hasOperatorCol: false
  }
]

const currentTabDef = computed(() => tabDefs.find(t => t.key === activeTab.value) || tabDefs[0])

const openDetail = async (row: any) => {
  selectedRow.value = row
  detailModalOpen.value = true
  qrImageUrl.value = ''
  const data = row.qrData
  if (data) {
    try {
      qrImageUrl.value = await QRCode.toDataURL(data, {
        width: 200,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      })
    } catch {
      qrImageUrl.value = ''
    }
  }
}

const openRefund = (row: any) => {
  selectedRow.value = row
  refundModalOpen.value = true
}

const refundLoading = ref(false)

const confirmRefund = async () => {
  if (!selectedRow.value) { refundModalOpen.value = false; return }
  refundLoading.value = true
  try {
    const orderId = selectedRow.value.orderId?.replace('#', '') || selectedRow.value.id
    await api.refundOrder(orderId)
    selectedRow.value.status = 'refunded'
    selectedRow.value.statusLabel = 'Remboursé'
    selectedRow.value.statusClass = 'text-text-secondary'
    selectedRow.value.canRefund = false
    selectedRow.value.reason = 'Demande organisateur'
    selectedRow.value.reasonClass = 'text-text-secondary'
    success(`Billet ${selectedRow.value.orderId} remboursé avec succès`)
  } catch {
    notifyError('Impossible de rembourser ce billet')
  } finally {
    refundLoading.value = false
    refundModalOpen.value = false
  }
}

const resendPayment = async (row: any) => {
  try {
    await api.resendTicket(row.id || row.orderId?.replace('#', ''))
    info(`Rappel envoyé à ${row.buyer}`)
  } catch {
    notifyError('Impossible d\'envoyer le rappel')
  }
}

const exportCSV = async () => {
  const evtKey = selectedEvt.value
  if (evtKey !== 'all') {
    try {
      const res = await api.exportTickets(evtKey) as any
      if (res instanceof Blob) {
        const url = URL.createObjectURL(res)
        const link = document.createElement('a')
        link.href = url
        link.download = `billets-${evtKey}-${Date.now()}.csv`
        link.click()
        URL.revokeObjectURL(url)
        success('Export CSV téléchargé')
        return
      }
    } catch { /* fallback local export */ }
  }
  const headers = (currentTabDef.value as any).headers.filter((h: string) => h !== 'Actions')
  const rows = filteredRows.value.map((r: any) => {
    const base = [r.orderId, r.buyer, r.event, r.pass, r.amount, r.fees, r.net, r.date]
    if ((currentTabDef.value as any).hasStatusCol) base.push(r.statusLabel)
    if ((currentTabDef.value as any).hasReasonCol) base.push(r.reason || '')
    if ((currentTabDef.value as any).hasOperatorCol) base.push(r.operator || '')
    return base
  })
  const csvContent = [headers.join(';'), ...rows.map((r: string[]) => r.join(';'))].join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `billets-${activeTab.value}-${Date.now()}.csv`
  link.click()
  URL.revokeObjectURL(url)
  success('Export CSV téléchargé')
}

const loadTickets = async () => {
  loading.value = true
  try {
    const [eventsRes, participantsRes] = await Promise.allSettled([
      api.getEvents(),
      api.getParticipants({ per_page: 200 }),
    ])

    if (eventsRes.status === 'fulfilled') {
      const data = (eventsRes.value as any)?.data ?? eventsRes.value
      const evts = Array.isArray(data) ? data : []
      evtOptions.value = [
        { key: 'all', label: 'Tous les événements' },
        ...evts.map((e: any) => ({ key: String(e.id), label: e.title }))
      ]
    }

    if (participantsRes.status === 'fulfilled') {
      const data = (participantsRes.value as any)?.data ?? participantsRes.value
      const items = Array.isArray(data) ? data : (data?.data || [])
      allTransactions.value = items.map((t: any) => {
        const status = t.order_status || 'confirmed'
        const amount = t.amount ?? 0
        const fmtAmount = new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA'
        const feesTotal = t.fees_total ?? ((t.fees_gateway ?? 0) + (t.fees_platform ?? 0))
        const netAmount = t.organizer_net ?? (amount - feesTotal)
        const fmtFees = new Intl.NumberFormat('fr-FR').format(feesTotal) + ' FCFA'
        const fmtNet = new Intl.NumberFormat('fr-FR').format(netAmount) + ' FCFA'
        return {
          id: t.id,
          orderId: t.order_reference || `#${t.id}`,
          buyer: t.user?.name || '',
          buyerEmail: t.user?.email || t.buyer_email || '',
          buyerPhone: t.user?.phone || t.buyer_phone || t.guest_phone || '',
          event: t.event_title || '',
          evtKey: String(t.event_id || ''),
          pass: t.pass_type || '',
          passClass: 'text-orange-primary',
          amount: fmtAmount,
          rawAmount: amount,
          fees: fmtFees,
          rawFees: feesTotal,
          net: fmtNet,
          rawNet: netAmount,
          date: t.order_date || '',
          status,
          statusLabel: statusLabelMap[status] || status,
          statusClass: statusClassMap[status] || 'text-text-secondary',
          canRefund: status === 'confirmed',
          canResend: status === 'pending',
          operatorRaw: t.payment_method || '',
          operator: paymentMethodLabel(t.payment_method),
          reason: t.reason || '',
          reasonClass: status === 'failed' ? 'text-red-error' : 'text-text-secondary',
          qrData: t.qr_data || null,
        }
      })
    }
  } catch {
    notifyError('Impossible de charger les transactions')
  } finally {
    loading.value = false
  }
}

onMounted(() => loadTickets())
</script>
