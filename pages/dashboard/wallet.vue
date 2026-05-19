<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const api = useOrganizerApi()
const { success, error } = useNotification()
const authStore = useAuthStore()
const { countries, fetchOperators, getOperatorsForCountry, getCountryInfo } = usePaymentOperators()

const loading = ref(false)
const txLoading = ref(false)
const balanceVisible = ref(true)
const showWithdrawModal = ref(false)
const withdrawLoading = ref(false)

const totalBalance = ref(0)
const availableBalance = ref(0)
const pendingBalance = ref(0)

const kycValidated = computed(() => authStore.user?.kyc_status === 'validated')

// ── Withdrawal form validation & breakdown ───────────────────
const WITHDRAW_MIN = 5000

const withdrawAmountError = computed(() => {
  const raw = withdrawAmount.value
  if (raw === '' || raw === null || raw === undefined) return ''
  const amount = Number(raw)
  if (!Number.isFinite(amount) || amount <= 0) return 'Veuillez saisir un montant valide'
  if (amount < WITHDRAW_MIN) return `Le montant minimum est de ${new Intl.NumberFormat('fr-FR').format(WITHDRAW_MIN)} F CFA`
  if (amount > availableBalance.value) return `Solde insuffisant (disponible : ${new Intl.NumberFormat('fr-FR').format(availableBalance.value)} F CFA)`
  return ''
})

const isWithdrawValid = computed(() => {
  const amount = Number(withdrawAmount.value)
  if (!Number.isFinite(amount) || amount < WITHDRAW_MIN || amount > availableBalance.value) return false
  if (withdrawMethod.value === 'mobile') {
    return !!selectedCountry.value && !!selectedOperator.value && mobileNumber.value.trim().length >= 7
  }
  if (withdrawMethod.value === 'bank') {
    return !!bankName.value.trim() && !!iban.value.trim() && !!accountHolder.value.trim()
  }
  return false
})

// Operator fees are settled with the gateway before payout; the buyer's
// requested amount is what they receive. We surface the breakdown for clarity
// even when the fee is zero — transparency builds trust.
const withdrawFee = computed(() => 0)
const withdrawNet = computed(() => {
  const amount = Number(withdrawAmount.value)
  return Number.isFinite(amount) && amount > 0 ? Math.max(0, amount - withdrawFee.value) : 0
})
const withdrawDelay = computed(() =>
  withdrawMethod.value === 'mobile'
    ? '24 à 72 heures'
    : withdrawMethod.value === 'bank' ? '2 à 5 jours ouvrés' : ''
)

const formatPrice = (price: number) => new Intl.NumberFormat('fr-FR').format(price) + ' F CFA'

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const withdrawAmount = ref('')
const withdrawMethod = ref('')
const selectedCountry = ref('')
const selectedOperator = ref('')
const mobileNumber = ref('')
const bankName = ref('')
const iban = ref('')
const accountHolder = ref('')

const activeCountry = computed(() => getCountryInfo(selectedCountry.value))
const countryOperators = computed(() => getOperatorsForCountry(selectedCountry.value))
const countryDialCode = computed(() => activeCountry.value?.prefix ?? '')

watch(selectedCountry, () => {
  selectedOperator.value = ''
  mobileNumber.value = ''
})

watch(withdrawMethod, () => {
  selectedCountry.value = ''
  selectedOperator.value = ''
  mobileNumber.value = ''
  bankName.value = ''
  iban.value = ''
  accountHolder.value = ''
})

const resetWithdrawForm = () => {
  withdrawAmount.value = ''
  withdrawMethod.value = ''
  selectedCountry.value = ''
  selectedOperator.value = ''
  mobileNumber.value = ''
  bankName.value = ''
  iban.value = ''
  accountHolder.value = ''
}

const handleWithdraw = async () => {
  withdrawLoading.value = true
  try {
    await api.requestWithdrawal({
      amount: Number(withdrawAmount.value),
      method: withdrawMethod.value === 'mobile' ? 'mobile_money' : 'bank_transfer',
      country_code: selectedCountry.value,
      operator: selectedOperator.value,
      phone_number: mobileNumber.value,
      bank_name: bankName.value,
      iban: iban.value,
      account_holder: accountHolder.value,
    })
    showWithdrawModal.value = false
    success('Demande de retrait envoyée')
    resetWithdrawForm()
    await loadBalance()
  } catch (err: any) {
    error(err?.message || err?.data?.message || 'Erreur lors du retrait')
  } finally {
    withdrawLoading.value = false
  }
}

const showInfoTooltip = ref(false)

const activeTab = ref('Tous')
const tabs = ['Tous', 'Ventes', 'Retraits', 'Retraits rejetés', 'Frais', 'Remboursements']

const transactions = ref<any[]>([])
const currentPage = ref(1)
const lastPage = ref(1)

const tabApiMap: Record<string, Record<string, string>> = {
  'Tous': {},
  'Ventes': { type: 'sale' },
  'Retraits': { type: 'withdrawal' },
  'Retraits rejetés': { type: 'withdrawal', status: 'rejected' },
  'Frais': { type: 'fee' },
  'Remboursements': { type: 'refund' },
}

const filteredTransactions = computed(() => transactions.value)

async function loadTransactions() {
  txLoading.value = true
  try {
    const params = { ...tabApiMap[activeTab.value], page: currentPage.value }
    const res = await api.getTransactions(params)
    const data = (res as any).data ?? res
    transactions.value = Array.isArray(data) ? data : (data.data ?? [])
    lastPage.value = data.last_page ?? data.meta?.last_page ?? 1
  } catch {
    useNotification().error('Impossible de charger les transactions')
  } finally {
    txLoading.value = false
  }
}

watch(activeTab, () => {
  currentPage.value = 1
  loadTransactions()
})

async function loadBalance() {
  loading.value = true
  try {
    const res = await api.getBalance()
    const data = (res as any).data ?? res
    totalBalance.value = data.total_balance ?? data.totalBalance ?? 0
    availableBalance.value = data.available_balance ?? data.availableBalance ?? 0
    pendingBalance.value = data.pending_balance ?? data.pendingBalance ?? 0
  } catch {
    useNotification().error('Impossible de charger le solde')
  } finally {
    loading.value = false
  }
}

const typeLabel = (t: string) => {
  const map: Record<string, string> = {
    sale: 'Vente',
    withdrawal: 'Retrait',
    fee: 'Frais',
    refund: 'Remboursement',
    payout: 'Versement',
    adjustment: 'Ajustement',
  }
  return map[t] || t
}

const statusLabel = (s: string) => {
  if (s === 'completed') return 'Effectué'
  if (s === 'pending') return 'En attente'
  if (s === 'rejected') return 'Rejeté'
  return s
}

const statusBadgeVariant = (s: string): 'success' | 'warning' | 'error' | 'info' | 'neutral' => {
  if (s === 'completed') return 'success'
  if (s === 'pending') return 'warning'
  if (s === 'rejected') return 'error'
  return 'neutral'
}

const txTableColumns = [
  { key: 'created_at', label: 'Date' },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description', hideOnMobile: true },
  { key: 'amount', label: 'Montant', class: 'text-right' },
  { key: 'status', label: 'Statut', class: 'text-right' },
]

onMounted(async () => {
  await fetchOperators()
  loadBalance()
  loadTransactions()
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <UiPageHeader title="Mon portefeuille" subtitle="Gérez vos revenus et demandes de retrait" />

    <DashboardKycBanner pending-message="Complétez votre vérification d'identité pour activer les retraits." />

    <!-- Balance Card — Premium -->
    <div class="bg-surface border border-border-light rounded-xl p-8">
      <div class="flex items-center gap-3 mb-6">
        <div>
          <div class="text-sm text-text-secondary mb-1.5">Solde total</div>
          <div class="text-4xl font-bold text-text-primary font-serif leading-none">
            {{ balanceVisible ? formatPrice(totalBalance) : '••••••' }}
          </div>
        </div>
        <button
          class="ml-2 text-text-secondary cursor-pointer bg-transparent border-none p-1.5 hover:text-text-primary transition-colors"
          @click="balanceVisible = !balanceVisible"
        >
          <svg v-if="balanceVisible" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          <svg v-else width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="bg-surface-2 rounded-xl p-4">
          <div class="text-xs text-text-tertiary uppercase tracking-wider mb-1">Total cumulé</div>
          <div class="text-lg font-semibold font-serif text-text-primary">
            {{ balanceVisible ? formatPrice(totalBalance) : '••••••' }}
          </div>
        </div>
        <div class="bg-green-dim rounded-xl p-4">
          <div class="text-xs text-green-dark uppercase tracking-wider mb-1">Disponible</div>
          <div class="text-lg font-semibold font-serif text-green-dark">
            {{ balanceVisible ? formatPrice(availableBalance) : '••••••' }}
          </div>
        </div>
        <div class="bg-orange-dim rounded-xl p-4">
          <div class="text-xs text-orange-primary uppercase tracking-wider mb-1 flex items-center gap-1.5">
            En attente
            <span class="relative" @mouseenter="showInfoTooltip = true" @mouseleave="showInfoTooltip = false">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="cursor-help"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <Transition name="fade">
                <div v-if="showInfoTooltip" class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-text-primary text-white text-xs rounded-lg px-3 py-2 w-56 text-center z-10">
                  Montant en cours de traitement, disponible sous 48-72h
                </div>
              </Transition>
            </span>
          </div>
          <div class="text-lg font-semibold font-serif text-orange-primary">
            {{ balanceVisible ? formatPrice(pendingBalance) : '••••••' }}
          </div>
        </div>
      </div>

      <div class="flex justify-center">
        <button
          class="rounded-xl px-8 py-3 font-semibold text-sm transition-all duration-150"
          :class="!kycValidated
            ? 'border border-border-medium text-text-tertiary opacity-50 cursor-not-allowed bg-transparent'
            : 'bg-orange-primary text-white hover:bg-orange-light cursor-pointer border-none'"
          :disabled="!kycValidated"
          @click="showWithdrawModal = true"
        >
          Demander un retrait
        </button>
      </div>
    </div>

    <!-- Modal retrait -->
    <UiBaseModal :is-open="showWithdrawModal" title="Demande de retrait" size="lg" @close="showWithdrawModal = false; resetWithdrawForm()">
      <div class="flex flex-col gap-6">
        <div class="text-sm text-text-secondary">
          Solde disponible : <span class="font-semibold text-green-dark">{{ formatPrice(availableBalance) }}</span>
        </div>

        <div>
          <label class="text-sm font-semibold text-text-secondary mb-2 block">Montant à retirer</label>
          <input
            v-model="withdrawAmount"
            type="number"
            inputmode="numeric"
            min="5000"
            :max="availableBalance"
            placeholder="Ex: 500000"
            class="border rounded-lg px-4 py-3 w-full text-base bg-white focus:outline-none transition-[border-color] duration-150"
            :class="withdrawAmountError ? 'border-red-error focus:border-red-error' : 'border-border-light focus:border-orange-primary'"
          />
          <div v-if="withdrawAmountError" class="text-xs text-red-error mt-1.5">{{ withdrawAmountError }}</div>
          <div v-else class="text-xs text-text-tertiary mt-1.5">Minimum : 5 000 F CFA</div>
        </div>

        <!-- Live breakdown — shown once the buyer has chosen a method -->
        <div
          v-if="withdrawMethod && withdrawNet > 0 && !withdrawAmountError"
          class="rounded-lg border border-border-light bg-bg-primary px-4 py-3.5"
        >
          <div class="flex justify-between text-sm text-text-secondary mb-1.5">
            <span>Montant demandé</span>
            <span class="text-text-primary font-medium">{{ formatPrice(Number(withdrawAmount) || 0) }}</span>
          </div>
          <div class="flex justify-between text-sm text-text-secondary mb-1.5">
            <span>Frais de retrait</span>
            <span class="text-text-primary font-medium">{{ withdrawFee === 0 ? 'Aucun' : formatPrice(withdrawFee) }}</span>
          </div>
          <div class="h-px bg-border-light my-2"></div>
          <div class="flex justify-between text-sm">
            <span class="font-semibold text-text-primary">Vous recevrez</span>
            <span class="font-bold text-green-dark">{{ formatPrice(withdrawNet) }}</span>
          </div>
          <div v-if="withdrawDelay" class="text-xs text-text-tertiary mt-2">
            Délai estimé : {{ withdrawDelay }}
          </div>
        </div>

        <div>
          <label class="text-sm font-semibold text-text-secondary mb-3 block">Méthode de retrait</label>
          <div class="grid grid-cols-2 gap-3">
            <button
              class="border rounded-xl p-4 cursor-pointer transition-all duration-150 text-left flex items-center gap-3"
              :class="withdrawMethod === 'mobile' ? 'border-orange-primary bg-orange-dim' : 'border-border-light hover:border-border-medium'"
              @click="withdrawMethod = 'mobile'"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                  <span class="text-sm font-semibold text-text-primary">Mobile Money</span>
                </div>
              </div>
              <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" :class="withdrawMethod === 'mobile' ? 'border-orange-primary' : 'border-border-medium'">
                <div v-if="withdrawMethod === 'mobile'" class="w-2.5 h-2.5 rounded-full bg-orange-primary"></div>
              </div>
            </button>
            <button
              class="border rounded-xl p-4 cursor-pointer transition-all duration-150 text-left flex items-center gap-3"
              :class="withdrawMethod === 'bank' ? 'border-orange-primary bg-orange-dim' : 'border-border-light hover:border-border-medium'"
              @click="withdrawMethod = 'bank'"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                  <span class="text-sm font-semibold text-text-primary">Virement bancaire</span>
                </div>
              </div>
              <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" :class="withdrawMethod === 'bank' ? 'border-orange-primary' : 'border-border-medium'">
                <div v-if="withdrawMethod === 'bank'" class="w-2.5 h-2.5 rounded-full bg-orange-primary"></div>
              </div>
            </button>
          </div>
        </div>

        <Transition name="fade-slide">
          <div v-if="withdrawMethod === 'mobile'" class="flex flex-col gap-4">
            <div>
              <label class="text-sm font-semibold text-text-secondary mb-2 block">Sélectionnez votre pays</label>
              <select v-model="selectedCountry" class="border border-border-light rounded-lg px-4 py-3 w-full text-base bg-white focus:border-orange-primary focus:outline-none appearance-none transition-[border-color] duration-150">
                <option value="" disabled>Sélectionnez votre pays</option>
                <option v-for="c in countries" :key="c.code" :value="c.code">{{ c.flag }} {{ c.name }}</option>
              </select>
            </div>

            <Transition name="fade-slide">
              <div v-if="selectedCountry && countryOperators.length" class="flex flex-col gap-2">
                <label class="text-sm font-semibold text-text-secondary mb-1 block">Choisissez votre opérateur</label>
                <button v-for="op in countryOperators" :key="op.key" class="border rounded-lg p-3.5 cursor-pointer flex items-center gap-3 transition-all duration-150" :class="selectedOperator === op.key ? 'border-orange-primary bg-orange-dim' : 'border-border-light hover:border-border-medium'" @click="selectedOperator = op.key">
                  <span class="text-base font-medium text-text-primary flex-1">{{ op.name }}</span>
                  <div class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0" :class="selectedOperator === op.key ? 'border-orange-primary' : 'border-border-medium'">
                    <div v-if="selectedOperator === op.key" class="w-2.5 h-2.5 rounded-full bg-orange-primary"></div>
                  </div>
                </button>
              </div>
            </Transition>

            <Transition name="fade-slide">
              <div v-if="selectedOperator">
                <label class="text-sm font-semibold text-text-secondary mb-2 block">Numéro de téléphone</label>
                <div class="flex">
                  <span class="inline-flex items-center px-4 py-3 border border-r-0 border-border-light rounded-l-lg bg-surface-2 text-base text-text-secondary">{{ countryDialCode }}</span>
                  <input v-model="mobileNumber" type="tel" placeholder="77 123 45 67" class="border border-border-light rounded-r-lg px-4 py-3 w-full text-base focus:border-orange-primary focus:outline-none transition-[border-color] duration-150" />
                </div>
              </div>
            </Transition>
          </div>
        </Transition>

        <Transition name="fade-slide">
          <div v-if="withdrawMethod === 'bank'" class="flex flex-col gap-4">
            <div>
              <label class="text-sm font-semibold text-text-secondary mb-2 block">Nom de la banque</label>
              <input v-model="bankName" type="text" placeholder="Ex: SGBS, BICIS..." class="border border-border-light rounded-lg px-4 py-3 w-full text-base bg-white focus:border-orange-primary focus:outline-none transition-[border-color] duration-150" />
            </div>
            <div>
              <label class="text-sm font-semibold text-text-secondary mb-2 block">IBAN / RIB</label>
              <input v-model="iban" type="text" placeholder="Ex: SN08 SN00 0100 1520 0000 2365" class="border border-border-light rounded-lg px-4 py-3 w-full text-base bg-white focus:border-orange-primary focus:outline-none transition-[border-color] duration-150" />
            </div>
            <div>
              <label class="text-sm font-semibold text-text-secondary mb-2 block">Nom du titulaire du compte</label>
              <input v-model="accountHolder" type="text" placeholder="Ex: Moussa Diop" class="border border-border-light rounded-lg px-4 py-3 w-full text-base bg-white focus:border-orange-primary focus:outline-none transition-[border-color] duration-150" />
            </div>
          </div>
        </Transition>

        <button
          class="bg-orange-primary text-white w-full py-3.5 rounded-xl font-semibold border-none cursor-pointer transition-opacity hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed text-sm"
          :disabled="withdrawLoading || !isWithdrawValid"
          @click="handleWithdraw"
        >
          <svg v-if="withdrawLoading" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
          <template v-if="!withdrawLoading">Confirmer le retrait</template>
          <template v-else>Traitement...</template>
        </button>
      </div>
    </UiBaseModal>

    <!-- Transactions -->
    <div>
      <h2 class="font-serif text-xl text-text-primary mb-4">Historique des transactions</h2>

      <div class="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        <button
          v-for="tab in tabs"
          :key="tab"
          class="whitespace-nowrap cursor-pointer border transition-all duration-150 shrink-0 rounded-lg px-4 py-2 text-sm font-semibold"
          :class="activeTab === tab
            ? 'bg-orange-dim border-orange-primary text-orange-primary'
            : 'bg-surface border-border-light text-text-secondary hover:border-border-medium hover:text-text-primary'"
          @click="activeTab = tab"
        >
          {{ tab }}
        </button>
      </div>

      <UiDataTable
        :columns="txTableColumns"
        :rows="filteredTransactions"
        :loading="txLoading"
        empty-title="Aucune transaction"
        empty-description="Aucune transaction pour cette période."
      >
        <template #cell-created_at="{ row }">
          <span class="text-sm text-text-secondary">{{ formatDate(row.created_at) }}</span>
        </template>
        <template #cell-type="{ row }">
          <span class="text-sm font-medium text-text-primary">{{ typeLabel(row.type) }}</span>
        </template>
        <template #cell-description="{ row }">
          <span class="text-sm text-text-secondary">{{ row.description }}</span>
        </template>
        <template #cell-amount="{ row }">
          <div class="text-right">
            <span class="text-sm font-bold font-serif" :class="row.amount >= 0 ? 'text-green-dark' : 'text-red-error'">
              {{ row.amount >= 0 ? '+' : '-' }}{{ formatPrice(Math.abs(row.amount)) }}
            </span>
            <div v-if="row.gross_amount && row.total_fees" class="text-xs text-text-tertiary mt-0.5">
              Brut {{ formatPrice(row.gross_amount) }} · Frais {{ formatPrice(row.total_fees) }}
            </div>
          </div>
        </template>
        <template #cell-status="{ row }">
          <div class="text-right">
            <UiStatusBadge
              :variant="statusBadgeVariant(row.status)"
              :label="statusLabel(row.status)"
              size="sm"
            />
          </div>
        </template>
      </UiDataTable>

      <!-- Pagination -->
      <div v-if="lastPage > 1" class="flex items-center justify-center gap-2 mt-4">
        <button
          class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"
          :class="currentPage <= 1 ? 'border-border-light text-text-tertiary cursor-not-allowed' : 'border-border-light text-text-secondary hover:border-border-medium cursor-pointer'"
          :disabled="currentPage <= 1"
          @click="currentPage--; loadTransactions()"
        >
          ← Précédent
        </button>
        <span class="text-sm text-text-secondary">{{ currentPage }} / {{ lastPage }}</span>
        <button
          class="px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors"
          :class="currentPage >= lastPage ? 'border-border-light text-text-tertiary cursor-not-allowed' : 'border-border-light text-text-secondary hover:border-border-medium cursor-pointer'"
          :disabled="currentPage >= lastPage"
          @click="currentPage++; loadTransactions()"
        >
          Suivant →
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
