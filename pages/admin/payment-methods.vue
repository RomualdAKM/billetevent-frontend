<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const api = useAdminApi()
const { success, error: notifyError } = useNotification()

const loading = ref(true)
const toggling = ref<number | null>(null)
const showConfirmModal = ref(false)
const pendingToggle = ref<any>(null)

const methods = ref<any[]>([])

const handleToggle = (method: any) => {
  if (method.active) {
    pendingToggle.value = method
    showConfirmModal.value = true
  } else {
    doToggle(method)
  }
}

const doToggle = async (method: any) => {
  toggling.value = method.id
  try {
    await api.togglePaymentMethod(method.id)
    method.active = !method.active
    success(method.operator + (method.active ? ' activ\u00e9' : ' d\u00e9sactiv\u00e9'))
  } catch (err: any) {
    notifyError(err?.message || err?.data?.message || 'Erreur lors du changement de statut')
  } finally {
    toggling.value = null
  }
}

const confirmDisable = async () => {
  if (pendingToggle.value) {
    await doToggle(pendingToggle.value)
  }
  showConfirmModal.value = false
  pendingToggle.value = null
}

const cancelDisable = () => {
  showConfirmModal.value = false
  pendingToggle.value = null
}

const methodsTableColumns = [
  { key: 'operator', label: 'Opérateur' },
  { key: 'country', label: 'Pays', hideOnMobile: true },
  { key: 'gateway', label: 'Gateway', hideOnMobile: true },
  { key: 'status', label: 'Statut', class: 'text-center' },
]

const loadMethods = async () => {
  loading.value = true
  try {
    const response = await api.getPaymentMethods()
    const data = response?.data || response
    const items = Array.isArray(data) ? data : (data?.items || data?.methods || [])
    methods.value = items.map((m: any) => ({
      ...m,
      operator: m.operator || m.operator_name || m.name || '',
      country: m.country || m.country_code || '',
      gateway: m.gateway || '',
      active: m.active ?? m.is_enabled ?? m.is_active ?? true,
    }))
  } catch (err: any) {
    notifyError(err?.message || err?.data?.message || 'Erreur lors du chargement')
  } finally {
    loading.value = false
  }
}

onMounted(loadMethods)
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="font-serif text-2xl text-text-primary mb-1">Méthodes de paiement</h2>
      <p class="text-sm text-text-secondary">Activez ou désactivez les méthodes de paiement disponibles</p>
    </div>

    <UiDataTable
      :columns="methodsTableColumns"
      :rows="methods"
      :loading="loading"
      empty-title="Aucune méthode de paiement"
      empty-description="Il n'y a aucune méthode de paiement configurée."
    >
      <template #cell-operator="{ row }">
        <span class="text-sm font-medium text-text-primary">{{ row.operator }}</span>
      </template>
      <template #cell-country="{ row }">
        <span class="text-sm text-text-secondary">{{ row.country }}</span>
      </template>
      <template #cell-gateway="{ row }">
        <span class="text-sm text-text-secondary">{{ row.gateway }}</span>
      </template>
      <template #cell-status="{ row }">
        <div class="text-center">
          <button
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer border-none"
            :class="row.active ? 'bg-green-dark' : 'bg-border-medium'"
            @click="handleToggle(row)"
          >
            <span
              class="inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200"
              :class="row.active ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>
      </template>
    </UiDataTable>

    <UiConfirmModal
      :is-open="showConfirmModal"
      title="Désactiver la méthode"
      :message="'Êtes-vous sûr de vouloir désactiver ' + (pendingToggle?.operator || '') + ' ?'"
      confirm-text="Désactiver"
      cancel-text="Annuler"
      variant="warning"
      @confirm="confirmDisable"
      @cancel="cancelDisable"
    />
  </div>
</template>
