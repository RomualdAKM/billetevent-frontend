<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const api = useAdminApi()
const { success, error: notifyError } = useNotification()

const loading = ref(true)
const saving = ref(false)
const filterCountry = ref('')
const filterDirection = ref('')

const showEditModal = ref(false)
const editingFee = ref<any>(null)
const editForm = reactive({
  gatewayFeeType: 'percentage',
  gatewayFeeValue: 0,
  platformFeeType: 'percentage',
  platformFeeValue: 0,
})

const fees = ref<any[]>([])

const countries = computed(() => [...new Set(fees.value.map((f: any) => f.country))])

const filteredFees = computed(() => {
  return fees.value.filter((f: any) => {
    if (filterCountry.value && f.country !== filterCountry.value) return false
    if (filterDirection.value && f.direction !== filterDirection.value) return false
    return true
  })
})

const formatFee = (type: string, value: number) => {
  return type === 'percentage' ? value + '%' : new Intl.NumberFormat('fr-FR').format(value) + ' F'
}

const openEdit = (fee: any) => {
  editingFee.value = fee
  editForm.gatewayFeeType = fee.gatewayFeeType || fee.gateway_fee_type || 'percentage'
  editForm.gatewayFeeValue = fee.gatewayFeeValue ?? fee.gateway_fee_value ?? 0
  editForm.platformFeeType = fee.platformFeeType || fee.platform_fee_type || 'percentage'
  editForm.platformFeeValue = fee.platformFeeValue ?? fee.platform_fee_value ?? 0
  showEditModal.value = true
}

const saveEdit = async () => {
  if (!editingFee.value) return
  saving.value = true
  try {
    await api.updateFee(editingFee.value.id, {
      gateway_fee_value: Number(editForm.gatewayFeeValue),
      gateway_fee_type: editForm.gatewayFeeType,
      platform_fee_value: Number(editForm.platformFeeValue),
      platform_fee_type: editForm.platformFeeType,
    })
    const idx = fees.value.findIndex((f: any) => f.id === editingFee.value.id)
    if (idx !== -1) {
      fees.value[idx] = {
        ...fees.value[idx],
        gateway_fee_type: editForm.gatewayFeeType,
        gateway_fee_value: Number(editForm.gatewayFeeValue),
        gatewayFeeType: editForm.gatewayFeeType,
        gatewayFeeValue: Number(editForm.gatewayFeeValue),
        platform_fee_type: editForm.platformFeeType,
        platform_fee_value: Number(editForm.platformFeeValue),
        platformFeeType: editForm.platformFeeType,
        platformFeeValue: Number(editForm.platformFeeValue),
      }
    }
    showEditModal.value = false
    editingFee.value = null
    success('Frais mis \u00e0 jour avec succ\u00e8s')
  } catch (err: any) {
    notifyError(err?.message || err?.data?.message || 'Erreur lors de la mise à jour')
  } finally {
    saving.value = false
  }
}

const loadFees = async () => {
  loading.value = true
  try {
    const response = await api.getFees()
    const data = response?.data || response
    const groups = Array.isArray(data) ? data : (data?.items || data?.fees || [])

    // L'API retourne des groupes { payment_method, payin: [...], payout: [...] }
    // On aplatit en items individuels pour avoir chaque frais avec son id
    const flatFees: any[] = []
    for (const group of groups) {
      // Si l'item est déjà un frais plat (a un id directement), le garder tel quel
      if (group.id && !group.payin && !group.payout) {
        flatFees.push({
          ...group,
          operator: group.operator || group.payment_method?.operator_name || '',
          country: group.country || group.payment_method?.country_code || '',
          gateway: group.gateway || group.payment_method?.gateway || '',
          direction: group.direction || '',
          gatewayFeeType: group.gateway_fee_type || 'percentage',
          gatewayFeeValue: group.gateway_fee_value ?? 0,
          platformFeeType: group.platform_fee_type || 'percentage',
          platformFeeValue: group.platform_fee_value ?? 0,
        })
        continue
      }

      // Structure groupée : extraire chaque fee de payin et payout
      const method = group.payment_method || {}
      const allFeeItems = [...(group.payin || []), ...(group.payout || [])]
      for (const f of allFeeItems) {
        flatFees.push({
          ...f,
          id: f.id,
          operator: method.operator_name || '',
          country: method.country_code || '',
          gateway: method.gateway || '',
          direction: f.direction || '',
          gatewayFeeType: f.gateway_fee_type || 'percentage',
          gatewayFeeValue: f.gateway_fee_value ?? 0,
          platformFeeType: f.platform_fee_type || 'percentage',
          platformFeeValue: f.platform_fee_value ?? 0,
        })
      }
    }
    fees.value = flatFees
  } catch (err: any) {
    notifyError(err?.message || err?.data?.message || 'Erreur lors du chargement des frais')
  } finally {
    loading.value = false
  }
}

onMounted(loadFees)
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="font-serif text-2xl text-text-primary mb-1">Frais & Commissions</h2>
      <p class="text-sm text-text-secondary">Configuration des frais par méthode de paiement</p>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-5">
      <select
        v-model="filterCountry"
        class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-orange-primary/30 focus:border-orange-primary transition max-w-[200px]"
      >
        <option value="">Tous les pays</option>
        <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
      </select>
      <select
        v-model="filterDirection"
        class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-orange-primary/30 focus:border-orange-primary transition max-w-[200px]"
      >
        <option value="">Toutes les directions</option>
        <option value="payin">Payin</option>
        <option value="payout">Payout</option>
      </select>
    </div>

    <div class="bg-surface border border-border-light rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border-light">
              <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Opérateur</th>
              <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Pays</th>
              <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Gateway</th>
              <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Direction</th>
              <th class="text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Frais Gateway</th>
              <th class="text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Frais Plateforme</th>
              <th class="text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fee in filteredFees" :key="fee.id" class="border-b border-border-light last:border-b-0">
              <td class="px-4 py-3 text-sm font-medium text-text-primary">{{ fee.operator }}</td>
              <td class="px-4 py-3 text-sm text-text-secondary">{{ fee.country }}</td>
              <td class="px-4 py-3 text-sm text-text-secondary">{{ fee.gateway }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold"
                  :class="fee.direction === 'payin' ? 'bg-green-dark/10 text-green-dark' : 'bg-blue-main/10 text-blue-main'"
                >{{ fee.direction === 'payin' ? 'Payin' : 'Payout' }}</span>
              </td>
              <td class="px-4 py-3 text-sm text-text-primary text-right font-medium">{{ formatFee(fee.gatewayFeeType, fee.gatewayFeeValue) }}</td>
              <td class="px-4 py-3 text-sm text-orange-primary text-right font-medium">{{ formatFee(fee.platformFeeType, fee.platformFeeValue) }}</td>
              <td class="px-4 py-3 text-right">
                <button
                  class="text-sm font-medium text-orange-primary hover:underline cursor-pointer"
                  @click="openEdit(fee)"
                >Modifier</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UiBaseModal :is-open="showEditModal" :title="'Modifier les frais — ' + (editingFee?.operator || '')" size="md" @close="showEditModal = false">
      <div class="flex flex-col gap-5">
        <div v-if="editingFee" class="text-sm text-text-secondary">
          {{ editingFee.country }} · {{ editingFee.gateway }} · {{ editingFee.direction === 'payin' ? 'Payin' : 'Payout' }}
        </div>
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1.5">Type frais gateway</label>
          <select v-model="editForm.gatewayFeeType" class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-orange-primary/30 focus:border-orange-primary transition">
            <option value="percentage">Pourcentage</option>
            <option value="fixed">Fixe</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1.5">Valeur frais gateway</label>
          <input v-model="editForm.gatewayFeeValue" type="number" step="0.1" class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-orange-primary/30 focus:border-orange-primary transition" />
        </div>
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1.5">Type frais plateforme</label>
          <select v-model="editForm.platformFeeType" class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-orange-primary/30 focus:border-orange-primary transition">
            <option value="percentage">Pourcentage</option>
            <option value="fixed">Fixe</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1.5">Valeur frais plateforme</label>
          <input v-model="editForm.platformFeeValue" type="number" step="0.1" class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-orange-primary/30 focus:border-orange-primary transition" />
        </div>
        <button
          class="bg-orange-primary text-white w-full py-2.5 rounded-lg font-semibold border-none cursor-pointer transition-opacity hover:opacity-90"
          @click="saveEdit"
        >Enregistrer</button>
      </div>
    </UiBaseModal>
  </div>
</template>
