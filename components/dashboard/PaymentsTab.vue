<script setup lang="ts">
const api = useOrganizerApi()
const { success, error } = useNotification()
const { countries, fetchOperators } = usePaymentOperators()

interface PayoutMethod {
  id: number
  type: 'mobile' | 'bank'
  operator?: string
  phone?: string
  country_code?: string
  holder?: string
  bank_name?: string
  bank_iban?: string
  is_default: boolean
}

const loading = ref(false)
const saving = ref(false)
const showForm = ref(false)
const confirmDeleteId = ref<number | null>(null)

const methods = ref<PayoutMethod[]>([])

// Form state
const formType = ref<'mobile' | 'bank'>('mobile')
const selectedCountry = ref('')
const selectedOperator = ref('')
const mobileNumber = ref('')
const mobileTitulaire = ref('')
const bankName = ref('')
const bankIban = ref('')
const bankTitulaire = ref('')

const activeCountry = computed(() => countries.value.find(c => c.code === selectedCountry.value))
const countryOperators = computed(() => activeCountry.value?.operators ?? [])
const countryPrefix = computed(() => activeCountry.value?.prefix ?? '')

const countryOptions = computed(() =>
  countries.value.map(c => ({ label: `${c.flag} ${c.name} (${c.prefix})`, value: c.code }))
)
const operatorOptions = computed(() =>
  countryOperators.value.map(op => ({ label: op.name, value: op.key }))
)

watch(selectedCountry, () => {
  selectedOperator.value = ''
  mobileNumber.value = ''
})

watch(formType, () => {
  selectedCountry.value = countries.value[0]?.code ?? ''
  selectedOperator.value = ''
  mobileNumber.value = ''
  mobileTitulaire.value = ''
  bankName.value = ''
  bankIban.value = ''
  bankTitulaire.value = ''
})

function resetForm() {
  formType.value = 'mobile'
  selectedCountry.value = countries.value[0]?.code ?? ''
  selectedOperator.value = ''
  mobileNumber.value = ''
  mobileTitulaire.value = ''
  bankName.value = ''
  bankIban.value = ''
  bankTitulaire.value = ''
  showForm.value = false
}

function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return phone || ''
  return phone.slice(0, 4) + ' •••• ' + phone.slice(-3)
}

function maskIban(iban: string): string {
  if (!iban || iban.length < 8) return iban || ''
  return '•••• •••• •••• ' + iban.slice(-4)
}

async function loadData() {
  loading.value = true
  try {
    const [methodsRes] = await Promise.all([
      api.getPayoutMethods(),
      fetchOperators(),
    ])
    const mData = (methodsRes as any).data ?? methodsRes
    methods.value = mData.payout_methods ?? mData ?? []
    if (countries.value.length && !selectedCountry.value) {
      selectedCountry.value = countries.value[0]?.code ?? ''
    }
  } catch {
    error('Impossible de charger les informations de paiement')
  } finally {
    loading.value = false
  }
}

async function addMethod() {
  if (formType.value === 'mobile') {
    if (!selectedCountry.value) { error('Veuillez sélectionner un pays'); return }
    if (!selectedOperator.value) { error('Veuillez sélectionner un opérateur'); return }
    if (!mobileNumber.value.trim()) { error('Le numéro est requis'); return }
    if (!mobileTitulaire.value.trim()) { error('Le nom du titulaire est requis'); return }
  } else {
    if (!bankName.value.trim()) { error('Le nom de la banque est requis'); return }
    if (!bankIban.value.trim()) { error('Le code IBAN/RIB est requis'); return }
    if (!bankTitulaire.value.trim()) { error('Le nom du titulaire est requis'); return }
  }

  saving.value = true
  try {
    const payload: Record<string, unknown> = { type: formType.value }
    if (formType.value === 'mobile') {
      payload.operator = selectedOperator.value
      payload.phone = mobileNumber.value
      payload.country_code = selectedCountry.value
      payload.holder = mobileTitulaire.value
    } else {
      payload.bank_name = bankName.value
      payload.bank_iban = bankIban.value
      payload.holder = bankTitulaire.value
    }
    await api.addPayoutMethod(payload)
    success('Moyen de paiement ajouté')
    resetForm()
    await loadData()
  } catch (err: any) {
    error(err?.message || err?.data?.message || "Erreur lors de l'ajout")
  } finally {
    saving.value = false
  }
}

async function deleteMethod(id: number) {
  try {
    await api.deletePayoutMethod(id)
    success('Moyen de paiement supprimé')
    confirmDeleteId.value = null
    await loadData()
  } catch (err: any) {
    error(err?.message || err?.data?.message || 'Erreur lors de la suppression')
  }
}

async function setDefault(id: number) {
  try {
    await api.setDefaultPayoutMethod(id)
    success('Moyen de paiement par défaut mis à jour')
    await loadData()
  } catch (err: any) {
    error(err?.message || err?.data?.message || 'Erreur')
  }
}

onMounted(() => { loadData() })
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="text-xl font-semibold text-text-primary">Moyens de paiement</h2>
      <p class="text-sm text-text-tertiary mt-1">Gérez vos méthodes de réception des paiements.</p>
    </div>

    <div v-if="loading" class="py-12 text-center text-sm text-text-tertiary">Chargement…</div>

    <UiEmptyState
      v-else-if="methods.length === 0 && !showForm"
      title="Aucun moyen de paiement"
      description="Ajoutez un moyen de paiement pour recevoir vos revenus."
      action-label="+ Ajouter une méthode"
      @action="showForm = true"
    />

    <template v-else>
      <div class="flex flex-col gap-3 mb-5">
        <div v-for="m in methods" :key="m.id" class="flex items-center gap-4 bg-white rounded-lg p-4">
          <span class="shrink-0 text-orange-primary">
            <svg v-if="m.type === 'mobile'" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M3 10h18"/><path d="M12 3l9 7H3l9-7z"/><path d="M5 10v11"/><path d="M19 10v11"/><path d="M9 10v11"/><path d="M14 10v11"/></svg>
          </span>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-sm font-medium text-text-primary truncate">
                {{ m.type === 'mobile' ? (m.operator || 'Mobile Money') : (m.bank_name || 'Virement bancaire') }}
              </span>
              <UiStatusBadge v-if="m.is_default" variant="warning" label="Par défaut" :dot="false" size="sm" />
            </div>
            <p class="text-xs text-text-tertiary mt-0.5 truncate">
              {{ m.type === 'mobile' ? maskPhone(m.phone || '') : maskIban(m.bank_iban || '') }}
              <span v-if="m.holder"> · {{ m.holder }}</span>
            </p>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <UiBaseButton v-if="!m.is_default" variant="ghost" size="sm" @click="setDefault(m.id)">Définir par défaut</UiBaseButton>
            <UiBaseButton variant="danger" size="sm" @click="confirmDeleteId = m.id">Supprimer</UiBaseButton>
          </div>
        </div>
      </div>
    </template>

    <div v-if="!showForm && methods.length > 0" class="mb-5">
      <UiBaseButton variant="secondary" @click="showForm = true">+ Ajouter une méthode</UiBaseButton>
    </div>

    <div v-if="showForm" class="bg-white rounded-xl p-5">
      <h3 class="text-base font-semibold text-text-primary mb-5">Nouvelle méthode</h3>

      <div class="flex gap-3 mb-5">
        <button
          type="button"
          class="rounded-lg py-2.5 px-4 text-sm font-medium border transition-colors cursor-pointer flex items-center gap-2"
          :class="formType === 'mobile' ? 'bg-orange-dim text-orange-primary border-orange-primary/20' : 'bg-white text-text-secondary border-border-light hover:bg-surface-2'"
          @click="formType = 'mobile'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
          Mobile Money
        </button>
        <button
          type="button"
          class="rounded-lg py-2.5 px-4 text-sm font-medium border transition-colors cursor-pointer flex items-center gap-2"
          :class="formType === 'bank' ? 'bg-orange-dim text-orange-primary border-orange-primary/20' : 'bg-white text-text-secondary border-border-light hover:bg-surface-2'"
          @click="formType = 'bank'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M3 10h18"/><path d="M12 3l9 7H3l9-7z"/><path d="M5 10v11"/><path d="M19 10v11"/><path d="M9 10v11"/><path d="M14 10v11"/></svg>
          Virement bancaire
        </button>
      </div>

      <div v-if="formType === 'mobile'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UiBaseSelect :model-value="selectedCountry" label="Pays" placeholder="Sélectionnez un pays" :options="countryOptions" @update:model-value="selectedCountry = String($event)" />
        <UiBaseSelect :model-value="selectedOperator" label="Opérateur" placeholder="Sélectionnez un opérateur" :options="operatorOptions" @update:model-value="selectedOperator = String($event)" />
        <UiBaseInput v-model="mobileNumber" label="Numéro" :prefix="countryPrefix" type="tel" placeholder="77 123 45 67" />
        <UiBaseInput v-model="mobileTitulaire" label="Titulaire" placeholder="Prénom Nom" />
      </div>

      <div v-if="formType === 'bank'" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UiBaseInput v-model="bankName" label="Banque" placeholder="Ex : SGBS, BICIS…" />
        <UiBaseInput v-model="bankIban" label="Code IBAN / RIB" placeholder="Ex : SN08 SN00 0100 1520 0000 2365" />
        <UiBaseInput v-model="bankTitulaire" label="Titulaire du compte" placeholder="Prénom Nom" />
      </div>

      <div class="mt-6 flex items-center gap-3">
        <UiBaseButton variant="primary" :loading="saving" @click="addMethod">Enregistrer</UiBaseButton>
        <UiBaseButton variant="ghost" @click="resetForm">Annuler</UiBaseButton>
      </div>
    </div>

    <UiConfirmModal
      :is-open="confirmDeleteId !== null"
      title="Supprimer ce moyen de paiement"
      message="Cette action est irréversible. Voulez-vous vraiment supprimer ce moyen de paiement ?"
      confirm-text="Supprimer"
      cancel-text="Annuler"
      variant="danger"
      @confirm="confirmDeleteId && deleteMethod(confirmDeleteId)"
      @cancel="confirmDeleteId = null"
    />
  </div>
</template>
