<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const api = useAdminApi()
const { success, error: notifyError } = useNotification()

const loading = ref(true)
const activeTab = ref('pending')
const showRejectModal = ref(false)
const rejectingId = ref<number | null>(null)
const rejectReason = ref('')
const showApproveConfirm = ref(false)
const approvingId = ref<number | null>(null)
const processingId = ref<number | null>(null)

const formatPrice = (v: number) => new Intl.NumberFormat('fr-FR').format(v) + ' F CFA'

const formatDate = (dateStr: string) => {
  if (!dateStr) return '\u2014'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const withdrawals = ref<any[]>([])

const pendingList = computed(() => withdrawals.value.filter((w: any) => w.status === 'pending'))
const displayList = computed(() => activeTab.value === 'pending' ? pendingList.value : withdrawals.value)

const getDetails = (w: any) => {
  if (w.method === 'Mobile Money') return w.operator + ' \u00b7 ' + w.number
  return (w.bank || '') + ' \u00b7 ' + (w.iban || '')
}

const openApprove = (id: number) => {
  approvingId.value = id
  showApproveConfirm.value = true
}

const confirmApprove = async () => {
  if (!approvingId.value) return
  processingId.value = approvingId.value
  try {
    await api.processWithdrawal(approvingId.value, { decision: 'approved' })
    const idx = withdrawals.value.findIndex((w: any) => w.id === approvingId.value)
    if (idx !== -1) {
      withdrawals.value[idx].status = 'approved'
      success('Retrait approuv\u00e9 pour ' + withdrawals.value[idx].organizer)
    }
  } catch (err: any) {
    notifyError(err?.message || err?.data?.message || 'Erreur lors de l\'approbation')
  } finally {
    showApproveConfirm.value = false
    approvingId.value = null
    processingId.value = null
  }
}

const openReject = (id: number) => {
  rejectingId.value = id
  rejectReason.value = ''
  showRejectModal.value = true
}

const confirmReject = async () => {
  if (!rejectReason.value.trim() || !rejectingId.value) return
  processingId.value = rejectingId.value
  try {
    await api.processWithdrawal(rejectingId.value, { decision: 'rejected', rejection_reason: rejectReason.value })
    const idx = withdrawals.value.findIndex((w: any) => w.id === rejectingId.value)
    if (idx !== -1) {
      withdrawals.value[idx].status = 'rejected'
      withdrawals.value[idx].rejectReason = rejectReason.value
      success('Retrait rejet\u00e9 pour ' + withdrawals.value[idx].organizer)
    }
    showRejectModal.value = false
    rejectingId.value = null
    rejectReason.value = ''
  } catch (err: any) {
    notifyError(err?.message || err?.data?.message || 'Erreur lors du rejet')
  } finally {
    processingId.value = null
  }
}

const statusLabel = (s: string) => {
  if (s === 'pending') return 'En attente'
  if (s === 'approved') return 'Approuv\u00e9'
  if (s === 'rejected') return 'Rejet\u00e9'
  return s
}

const statusClass = (s: string) => {
  if (s === 'pending') return 'bg-gold/10 text-gold'
  if (s === 'approved') return 'bg-green-dark/10 text-green-dark'
  if (s === 'rejected') return 'bg-red-error/10 text-red-error'
  return ''
}

const loadWithdrawals = async () => {
  loading.value = true
  try {
    const response = await api.getAllWithdrawals()
    const data = response?.data || response
    const items = Array.isArray(data) ? data : (data?.items || data?.withdrawals || [])
    withdrawals.value = items.map((w: any) => ({
      ...w,
      organizer: w.organizer || w.organizer_name || w.wallet?.organizer?.org_name || w.wallet?.organizer?.name || '',
      email: w.email || w.organizer_email || w.wallet?.organizer?.email || '',
      amount: w.amount || 0,
      method: w.method || w.withdrawal_method || '',
      operator: w.operator || '',
      number: w.number || w.phone || w.account_holder || '',
      bank: w.bank || '',
      iban: w.iban || '',
      date: w.date || w.created_at || '',
      status: w.status || 'pending',
      rejectReason: w.rejection_reason || w.rejectReason || w.reject_reason || '',
    }))
  } catch (err: any) {
    notifyError(err?.message || err?.data?.message || 'Erreur lors du chargement des retraits')
  } finally {
    loading.value = false
  }
}

onMounted(loadWithdrawals)
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="font-serif text-2xl text-text-primary mb-1">Demandes de retrait</h2>
      <p class="text-sm text-text-secondary">Gérez les demandes de retrait des organisateurs</p>
    </div>

    <div class="flex gap-2 mb-5">
      <button
        class="px-4 py-1.5 rounded-full text-sm font-semibold cursor-pointer border-none transition-colors"
        :class="activeTab === 'pending' ? 'bg-orange-primary text-white' : 'bg-surface-2 text-text-secondary'"
        @click="activeTab = 'pending'"
      >En attente ({{ pendingList.length }})</button>
      <button
        class="px-4 py-1.5 rounded-full text-sm font-semibold cursor-pointer border-none transition-colors"
        :class="activeTab === 'all' ? 'bg-orange-primary text-white' : 'bg-surface-2 text-text-secondary'"
        @click="activeTab = 'all'"
      >Tous ({{ withdrawals.length }})</button>
    </div>

    <div class="bg-surface border border-border-light rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full hidden md:table">
          <thead>
            <tr class="border-b border-border-light">
              <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Organisateur</th>
              <th class="text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Montant</th>
              <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Méthode</th>
              <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Détails</th>
              <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Date</th>
              <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Statut</th>
              <th v-if="activeTab === 'pending'" class="text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="w in displayList" :key="w.id" class="border-b border-border-light last:border-b-0">
              <td class="px-4 py-3">
                <div class="text-sm font-medium text-text-primary">{{ w.organizer }}</div>
                <div class="text-xs text-text-tertiary">{{ w.email }}</div>
              </td>
              <td class="px-4 py-3 text-sm text-text-primary text-right font-semibold">{{ formatPrice(w.amount) }}</td>
              <td class="px-4 py-3 text-sm text-text-secondary">{{ w.method }}</td>
              <td class="px-4 py-3 text-sm text-text-secondary max-w-[200px] truncate">{{ getDetails(w) }}</td>
              <td class="px-4 py-3 text-sm text-text-secondary">{{ formatDate(w.date) }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" :class="statusClass(w.status)">{{ statusLabel(w.status) }}</span>
              </td>
              <td v-if="activeTab === 'pending'" class="px-4 py-3 text-right">
                <div v-if="w.status === 'pending'" class="flex items-center justify-end gap-2">
                  <button
                    class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-dark text-white border-none cursor-pointer transition-opacity hover:opacity-90"
                    @click="openApprove(w.id)"
                  >Approuver</button>
                  <button
                    class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-error text-white border-none cursor-pointer transition-opacity hover:opacity-90"
                    @click="openReject(w.id)"
                  >Rejeter</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-col md:hidden">
        <div v-for="w in displayList" :key="w.id" class="border-b border-border-light last:border-b-0 p-4">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium text-text-primary">{{ w.organizer }}</span>
            <span class="text-sm font-semibold text-text-primary">{{ formatPrice(w.amount) }}</span>
          </div>
          <div class="text-xs text-text-secondary mb-1">{{ w.method }} · {{ getDetails(w) }}</div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-text-tertiary">{{ formatDate(w.date) }}</span>
            <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" :class="statusClass(w.status)">{{ statusLabel(w.status) }}</span>
          </div>
          <div v-if="w.status === 'pending'" class="flex items-center gap-2 mt-3">
            <button class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-dark text-white border-none cursor-pointer" @click="openApprove(w.id)">Approuver</button>
            <button class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-error text-white border-none cursor-pointer" @click="openReject(w.id)">Rejeter</button>
          </div>
        </div>
      </div>
    </div>

    <UiConfirmModal
      :is-open="showApproveConfirm"
      title="Approuver le retrait"
      message="Confirmez-vous l'approbation de cette demande de retrait ?"
      confirm-text="Approuver"
      cancel-text="Annuler"
      variant="info"
      @confirm="confirmApprove"
      @cancel="showApproveConfirm = false"
    />

    <UiBaseModal :is-open="showRejectModal" title="Rejeter le retrait" size="md" @close="showRejectModal = false">
      <div class="flex flex-col gap-4">
        <p class="text-sm text-text-secondary">Indiquez la raison du rejet. L'organisateur sera notifié.</p>
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1.5">Raison du rejet</label>
          <textarea
            v-model="rejectReason"
            rows="4"
            placeholder="Ex: Solde insuffisant, informations bancaires incorrectes..."
            class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-orange-primary/30 focus:border-orange-primary transition resize-none"
          />
        </div>
        <button
          class="bg-red-error text-white w-full py-2.5 rounded-lg font-semibold border-none cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!rejectReason.trim()"
          @click="confirmReject"
        >Confirmer le rejet</button>
      </div>
    </UiBaseModal>
  </div>
</template>
