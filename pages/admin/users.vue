<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'admin'] })

const api = useAdminApi()
const { success, error: notifyError } = useNotification()

const loading = ref(true)
const filterRole = ref('')
const filterStatus = ref('')
const searchQuery = ref('')
const currentPage = ref(1)
const perPage = 8
const showBlockConfirm = ref(false)
const pendingUser = ref<any>(null)
const togglingId = ref<number | null>(null)

const users = ref<any[]>([])

const filteredUsers = computed(() => {
  return users.value.filter((u: any) => {
    if (filterRole.value && u.role !== filterRole.value) return false
    if (filterStatus.value && u.status !== filterStatus.value) return false
    if (searchQuery.value) {
      const q = searchQuery.value.toLowerCase()
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false
    }
    return true
  })
})

const paginatedUsers = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return filteredUsers.value.slice(start, start + perPage)
})

const totalPages = computed(() => Math.ceil(filteredUsers.value.length / perPage))

watch([filterRole, filterStatus, searchQuery], () => { currentPage.value = 1 })

const roleLabel = (r: string) => r === 'organizer' ? 'Organisateur' : 'Acheteur'
const roleClass = (r: string) => r === 'organizer' ? 'bg-blue-main/10 text-blue-main' : 'bg-orange-primary/10 text-orange-primary'
const statusLabel = (s: string) => s === 'active' ? 'Actif' : 'Bloqu\u00e9'
const statusClass = (s: string) => s === 'active' ? 'text-green-dark' : 'text-red-error'

const usersTableColumns = [
  { key: 'name', label: 'Nom' },
  { key: 'email', label: 'Email', hideOnMobile: true },
  { key: 'role', label: 'R\u00f4le' },
  { key: 'registeredAt', label: 'Inscrit le', hideOnMobile: true },
  { key: 'events', label: '\u00c9v\u00e9nements', class: 'text-right', hideOnMobile: true },
  { key: 'orders', label: 'Commandes', class: 'text-right', hideOnMobile: true },
  { key: 'status', label: 'Statut' },
]

const roleOptions = [
  { label: 'Tous les r\u00f4les', value: '' },
  { label: 'Acheteur', value: 'buyer' },
  { label: 'Organisateur', value: 'organizer' },
]

const statusOptions = [
  { label: 'Tous les statuts', value: '' },
  { label: 'Actif', value: 'active' },
  { label: 'Bloqu\u00e9', value: 'blocked' },
]

const formatDate = (dateStr: string) => {
  if (!dateStr) return '\u2014'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}

const openBlockToggle = (user: any) => {
  pendingUser.value = user
  showBlockConfirm.value = true
}

const confirmBlockToggle = async () => {
  if (!pendingUser.value) return
  togglingId.value = pendingUser.value.id
  try {
    await api.toggleBlockUser(pendingUser.value.id)
    const newStatus = pendingUser.value.status === 'active' ? 'blocked' : 'active'
    pendingUser.value.status = newStatus
    success(pendingUser.value.name + (newStatus === 'blocked' ? ' bloqu\u00e9' : ' d\u00e9bloqu\u00e9'))
  } catch (err: any) {
    notifyError(err?.message || err?.data?.message || 'Erreur lors du changement de statut')
  } finally {
    showBlockConfirm.value = false
    pendingUser.value = null
    togglingId.value = null
  }
}

const loadUsers = async () => {
  loading.value = true
  try {
    const response = await api.getUsers({
      search: searchQuery.value || undefined,
      role: filterRole.value || undefined,
      page: currentPage.value,
    })
    const data = response?.data || response
    const items = Array.isArray(data) ? data : (data?.items || data?.users || data?.data || [])
    users.value = items.map((u: any) => ({
      ...u,
      name: u.name || ((u.first_name || '') + ' ' + (u.last_name || '')).trim(),
      email: u.email || '',
      role: u.role || 'buyer',
      registeredAt: u.registeredAt || u.registered_at || u.created_at || '',
      events: u.events || u.events_count || 0,
      orders: u.orders || u.orders_count || 0,
      status: u.status || (u.is_blocked ? 'blocked' : 'active'),
    }))
  } catch (err: any) {
    notifyError(err?.message || err?.data?.message || 'Erreur lors du chargement des utilisateurs')
  } finally {
    loading.value = false
  }
}

onMounted(loadUsers)
</script>

<template>
  <div>
    <div class="mb-6">
      <h2 class="font-serif text-2xl text-text-primary mb-1">Utilisateurs</h2>
      <p class="text-sm text-text-secondary">Gérez les utilisateurs de la plateforme</p>
    </div>

    <div class="flex flex-wrap items-center gap-3 mb-5">
      <div class="w-full max-w-[280px]">
        <UiBaseInput
          v-model="searchQuery"
          type="search"
          placeholder="Rechercher par nom ou email..."
        />
      </div>
      <div class="w-full max-w-[180px]">
        <UiBaseSelect
          v-model="filterRole"
          :options="roleOptions"
        />
      </div>
      <div class="w-full max-w-[180px]">
        <UiBaseSelect
          v-model="filterStatus"
          :options="statusOptions"
        />
      </div>
    </div>

    <UiDataTable
      :columns="usersTableColumns"
      :rows="paginatedUsers"
      :loading="loading"
      empty-title="Aucun utilisateur"
      empty-description="Aucun utilisateur ne correspond à vos critères."
    >
      <template #cell-name="{ row }">
        <span class="text-sm font-medium text-text-primary">{{ row.name }}</span>
      </template>
      <template #cell-email="{ row }">
        <span class="text-sm text-text-secondary">{{ row.email }}</span>
      </template>
      <template #cell-role="{ row }">
        <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" :class="roleClass(row.role)">{{ roleLabel(row.role) }}</span>
      </template>
      <template #cell-registeredAt="{ row }">
        <span class="text-sm text-text-secondary">{{ formatDate(row.registeredAt) }}</span>
      </template>
      <template #cell-events="{ row }">
        <span class="text-sm text-text-secondary">{{ row.role === 'organizer' ? row.events : '—' }}</span>
      </template>
      <template #cell-orders="{ row }">
        <span class="text-sm text-text-secondary">{{ row.role === 'buyer' ? row.orders : '—' }}</span>
      </template>
      <template #cell-status="{ row }">
        <span class="text-sm font-medium" :class="statusClass(row.status)">{{ statusLabel(row.status) }}</span>
      </template>
      <template #actions="{ row }">
        <button
          class="text-sm font-medium cursor-pointer hover:underline"
          :class="row.status === 'active' ? 'text-red-error' : 'text-green-dark'"
          @click="openBlockToggle(row)"
        >{{ row.status === 'active' ? 'Bloquer' : 'Débloquer' }}</button>
      </template>
    </UiDataTable>

    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-5">
      <UiPagination
        :total-pages="totalPages"
        :current-page="currentPage"
        @page-change="currentPage = $event"
      />
    </div>

    <UiConfirmModal
      :is-open="showBlockConfirm"
      :title="pendingUser?.status === 'active' ? 'Bloquer l\'utilisateur' : 'Débloquer l\'utilisateur'"
      :message="pendingUser?.status === 'active' ? 'Êtes-vous sûr de vouloir bloquer ' + (pendingUser?.name || '') + ' ? Il ne pourra plus accéder à la plateforme.' : 'Êtes-vous sûr de vouloir débloquer ' + (pendingUser?.name || '') + ' ?'"
      :confirm-text="pendingUser?.status === 'active' ? 'Bloquer' : 'Débloquer'"
      cancel-text="Annuler"
      :variant="pendingUser?.status === 'active' ? 'danger' : 'info'"
      @confirm="confirmBlockToggle"
      @cancel="showBlockConfirm = false"
    />
  </div>
</template>
