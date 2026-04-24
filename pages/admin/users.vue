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
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Rechercher par nom ou email..."
        class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-orange-primary/30 focus:border-orange-primary transition max-w-[280px]"
      />
      <select
        v-model="filterRole"
        class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-orange-primary/30 focus:border-orange-primary transition max-w-[180px]"
      >
        <option value="">Tous les rôles</option>
        <option value="buyer">Acheteur</option>
        <option value="organizer">Organisateur</option>
      </select>
      <select
        v-model="filterStatus"
        class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-orange-primary/30 focus:border-orange-primary transition max-w-[180px]"
      >
        <option value="">Tous les statuts</option>
        <option value="active">Actif</option>
        <option value="blocked">Bloqué</option>
      </select>
    </div>

    <div class="bg-surface border border-border-light rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full hidden md:table">
          <thead>
            <tr class="border-b border-border-light">
              <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Nom</th>
              <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Email</th>
              <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Rôle</th>
              <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Inscrit le</th>
              <th class="text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Événements</th>
              <th class="text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Commandes</th>
              <th class="text-left text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Statut</th>
              <th class="text-right text-xs font-semibold text-text-tertiary uppercase tracking-wide px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in paginatedUsers" :key="u.id" class="border-b border-border-light last:border-b-0">
              <td class="px-4 py-3 text-sm font-medium text-text-primary">{{ u.name }}</td>
              <td class="px-4 py-3 text-sm text-text-secondary">{{ u.email }}</td>
              <td class="px-4 py-3">
                <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" :class="roleClass(u.role)">{{ roleLabel(u.role) }}</span>
              </td>
              <td class="px-4 py-3 text-sm text-text-secondary">{{ formatDate(u.registeredAt) }}</td>
              <td class="px-4 py-3 text-sm text-text-secondary text-right">{{ u.role === 'organizer' ? u.events : '—' }}</td>
              <td class="px-4 py-3 text-sm text-text-secondary text-right">{{ u.role === 'buyer' ? u.orders : '—' }}</td>
              <td class="px-4 py-3 text-sm font-medium" :class="statusClass(u.status)">{{ statusLabel(u.status) }}</td>
              <td class="px-4 py-3 text-right">
                <button
                  class="text-sm font-medium cursor-pointer hover:underline"
                  :class="u.status === 'active' ? 'text-red-error' : 'text-green-dark'"
                  @click="openBlockToggle(u)"
                >{{ u.status === 'active' ? 'Bloquer' : 'Débloquer' }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-col md:hidden">
        <div v-for="u in paginatedUsers" :key="u.id" class="border-b border-border-light last:border-b-0 p-4">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium text-text-primary">{{ u.name }}</span>
            <span class="inline-flex px-2 py-0.5 rounded-full text-xs font-semibold" :class="roleClass(u.role)">{{ roleLabel(u.role) }}</span>
          </div>
          <div class="text-xs text-text-secondary mb-1">{{ u.email }}</div>
          <div class="flex items-center justify-between">
            <span class="text-xs text-text-tertiary">{{ formatDate(u.registeredAt) }}</span>
            <span class="text-xs font-medium" :class="statusClass(u.status)">{{ statusLabel(u.status) }}</span>
          </div>
          <button
            class="mt-2 text-sm font-medium cursor-pointer hover:underline"
            :class="u.status === 'active' ? 'text-red-error' : 'text-green-dark'"
            @click="openBlockToggle(u)"
          >{{ u.status === 'active' ? 'Bloquer' : 'Débloquer' }}</button>
        </div>
      </div>
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-5">
      <button
        class="px-3 py-1.5 rounded-lg text-sm font-medium border border-border-light bg-surface text-text-secondary cursor-pointer transition-colors hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="currentPage === 1"
        @click="currentPage--"
      >Précédent</button>
      <button
        v-for="page in totalPages"
        :key="page"
        class="w-8 h-8 rounded-lg text-sm font-medium border cursor-pointer transition-colors"
        :class="page === currentPage ? 'bg-orange-primary text-white border-orange-primary' : 'border-border-light bg-surface text-text-secondary hover:bg-surface-2'"
        @click="currentPage = page"
      >{{ page }}</button>
      <button
        class="px-3 py-1.5 rounded-lg text-sm font-medium border border-border-light bg-surface text-text-secondary cursor-pointer transition-colors hover:bg-surface-2 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >Suivant</button>
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
