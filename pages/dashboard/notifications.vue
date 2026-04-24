<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const api = useOrganizerApi()
const { success, error } = useNotification()
const notifStore = useNotificationStore()

const loading = ref(false)
const activeTab = ref('all')
const currentPage = ref(1)
const lastPage = ref(1)

const tabs = [
  { key: 'all', label: 'Toutes' },
  { key: 'unread', label: 'Non lues' },
  { key: 'sale', label: 'Ventes' },
  { key: 'system', label: 'Système' },
]

const notifications = ref<any[]>([])

const filteredNotifications = computed(() => {
  if (activeTab.value === 'all') return notifications.value
  if (activeTab.value === 'unread') return notifications.value.filter(n => !n.read)
  return notifications.value.filter(n => n.type === activeTab.value)
})

const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)

// Group notifications by date
const groupedNotifications = computed(() => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const weekAgo = new Date(today.getTime() - 7 * 86400000)

  const groups: { label: string; items: any[] }[] = [
    { label: "Aujourd'hui", items: [] },
    { label: 'Hier', items: [] },
    { label: 'Cette semaine', items: [] },
    { label: 'Plus ancien', items: [] },
  ]

  for (const notif of filteredNotifications.value) {
    const date = notif.created_at ? new Date(notif.created_at) : null
    if (!date || isNaN(date.getTime())) {
      groups[3].items.push(notif)
    } else if (date >= today) {
      groups[0].items.push(notif)
    } else if (date >= yesterday) {
      groups[1].items.push(notif)
    } else if (date >= weekAgo) {
      groups[2].items.push(notif)
    } else {
      groups[3].items.push(notif)
    }
  }

  return groups.filter(g => g.items.length > 0)
})

async function loadNotifications() {
  loading.value = true
  try {
    const params: any = { page: currentPage.value }
    if (activeTab.value === 'unread') params.is_read = 0
    const res = await api.getNotifications(params)
    const data = res.data ?? res
    notifications.value = Array.isArray(data) ? data : (data.data ?? [])
    notifications.value = notifications.value.map(n => ({
      ...n,
      read: !!n.read_at || !!n.read,
    }))
    lastPage.value = data.last_page ?? data.meta?.last_page ?? 1
  } catch {
    useNotification().error('Impossible de charger les notifications')
  } finally {
    loading.value = false
  }
}

const markAllRead = async () => {
  try {
    await api.markAllAsRead()
    notifications.value.forEach(n => n.read = true)
    notifStore.reset()
    success('Toutes les notifications marquées comme lues')
  } catch (err: any) {
    error(err?.message || err?.data?.message || 'Erreur')
  }
}

const markRead = async (notif: any) => {
  if (notif.read) return
  try {
    await api.markAsRead(notif.id)
    notif.read = true
    notifStore.decrement()
  } catch {
    useNotification().error('Impossible de marquer la notification comme lue')
  }
}

watch(activeTab, () => {
  currentPage.value = 1
  loadNotifications()
})

onMounted(() => { loadNotifications() })
</script>

<template>
  <div>
    <UiPageHeader title="Notifications" subtitle="Restez informé de l'activité de vos événements">
      <button
        v-if="unreadCount > 0"
        class="text-sm font-semibold text-orange-primary bg-transparent border-none cursor-pointer hover:opacity-75 transition-opacity duration-150 flex items-center gap-1.5"
        @click="markAllRead"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        Marquer tout comme lu
      </button>
    </UiPageHeader>

    <!-- Tabs -->
    <div class="flex gap-2 mb-6 flex-wrap">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-all duration-150"
        :class="activeTab === tab.key
          ? 'bg-orange-dim border-orange-primary text-orange-primary'
          : 'bg-surface-2 border-border-light text-text-secondary hover:bg-orange-dim hover:border-orange-primary hover:text-orange-primary'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span v-if="tab.key === 'unread' && unreadCount > 0" class="ml-1 bg-orange-primary text-white text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full">{{ unreadCount }}</span>
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="filteredNotifications.length === 0 && !loading">
      <UiEmptyState
        title="Aucune notification"
        description="Aucune notification dans cette catégorie pour le moment."
      >
        <template #icon>
          <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.2"><path stroke-linecap="round" stroke-linejoin="round" d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path stroke-linecap="round" stroke-linejoin="round" d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
        </template>
      </UiEmptyState>
    </div>

    <!-- Loading -->
    <div v-else-if="loading" class="flex items-center justify-center py-12">
      <div class="w-6 h-6 border-2 border-orange-primary border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- Grouped notifications -->
    <div v-else class="flex flex-col gap-6">
      <div v-for="group in groupedNotifications" :key="group.label">
        <!-- Group header -->
        <div class="flex items-center gap-3 mb-3">
          <span class="text-xs font-bold text-text-tertiary uppercase tracking-wider">{{ group.label }}</span>
          <div class="flex-1 h-px bg-border-light" />
        </div>

        <!-- Notification items -->
        <div class="flex flex-col gap-3">
          <div
            v-for="notif in group.items"
            :key="notif.id"
            class="flex items-start gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-150 hover:bg-surface-2/30"
            :class="!notif.read
              ? 'bg-orange-primary/[0.03] border-l-[3px] border-l-orange-primary border-t-border-light border-r-border-light border-b-border-light'
              : 'bg-surface border-border-light'"
            @click="markRead(notif)"
          >
            <!-- Icon -->
            <div
              class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              :class="notif.type === 'sale' ? 'bg-green-dim text-green-dark' : 'bg-blue-dim text-blue-main'"
            >
              <svg v-if="notif.type === 'sale'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-0.5">
                <span class="text-sm font-semibold text-text-primary">{{ notif.title }}</span>
                <div v-if="!notif.read" class="w-2 h-2 rounded-full bg-orange-primary shrink-0" />
              </div>
              <div class="text-sm text-text-secondary leading-relaxed">{{ notif.message }}</div>
              <div class="text-xs text-text-tertiary mt-1.5">{{ notif.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
