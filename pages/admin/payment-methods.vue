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

    <div class="bg-surface border border-border-light rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-border-light">
              <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Opérateur</th>
              <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Pays</th>
              <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Gateway</th>
              <th class="text-center text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="m in methods" :key="m.id" class="border-b border-border-light last:border-b-0">
              <td class="px-4 py-3 text-sm font-medium text-text-primary">{{ m.operator }}</td>
              <td class="px-4 py-3 text-sm text-text-secondary">{{ m.country }}</td>
              <td class="px-4 py-3 text-sm text-text-secondary">{{ m.gateway }}</td>
              <td class="px-4 py-3 text-center">
                <button
                  class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 cursor-pointer border-none"
                  :class="m.active ? 'bg-green-dark' : 'bg-border-medium'"
                  @click="handleToggle(m)"
                >
                  <span
                    class="inline-block h-4 w-4 rounded-full bg-white transition-transform duration-200"
                    :class="m.active ? 'translate-x-6' : 'translate-x-1'"
                  />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

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
