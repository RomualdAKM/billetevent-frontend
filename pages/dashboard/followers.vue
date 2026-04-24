<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const api = useOrganizerApi()
const { error: notifyError } = useNotification()

const loading = ref(true)
const searchQuery = ref('')
const currentPage = ref(1)
const totalPages = ref(1)
const followers = ref<any[]>([])
const stats = ref({ total: 0, new_this_month: 0, new_this_week: 0 })

const avatarColors = [
  'var(--color-orange-primary)',
  'var(--color-blue-main)',
  'var(--color-green-dark)',
  'var(--color-gold)',
  'var(--color-ink2)',
]

const getInitials = (firstName: string, lastName: string) => {
  const f = (firstName || '').charAt(0).toUpperCase()
  const l = (lastName || '').charAt(0).toUpperCase()
  return (f + l) || '?'
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

const filteredFollowers = computed(() => {
  if (!searchQuery.value.trim()) return followers.value
  const q = searchQuery.value.toLowerCase().trim()
  return followers.value.filter(
    (f) =>
      f.name.toLowerCase().includes(q) ||
      f.email.toLowerCase().includes(q),
  )
})

const loadFollowers = async () => {
  loading.value = true
  try {
    const params: Record<string, unknown> = { page: currentPage.value, per_page: 30 }
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()

    const [followersRes, statsRes] = await Promise.allSettled([
      api.getFollowers(params),
      api.getFollowersStats(),
    ])

    if (statsRes.status === 'fulfilled') {
      const d = (statsRes.value as any)?.data ?? statsRes.value
      stats.value = {
        total: d?.total ?? 0,
        new_this_month: d?.new_this_month ?? 0,
        new_this_week: d?.new_this_week ?? 0,
      }
    }

    if (followersRes.status === 'fulfilled') {
      const paginator = followersRes.value as any
      const items = Array.isArray(paginator) ? paginator : (paginator?.data || [])
      totalPages.value = Array.isArray(paginator) ? 1 : (paginator?.last_page || paginator?.meta?.last_page || 1)
      followers.value = items.map((f: any, i: number) => ({
        id: f.id,
        name: [f.first_name, f.last_name].filter(Boolean).join(' ') || 'Utilisateur',
        initials: getInitials(f.first_name, f.last_name),
        email: f.email || '',
        avatar: f.avatar || null,
        since: f.pivot?.created_at || f.created_at || null,
        avatarColor: avatarColors[i % avatarColors.length],
      }))
    }
  } catch {
    notifyError('Impossible de charger les abonnés')
  } finally {
    loading.value = false
  }
}

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  loadFollowers()
}

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(searchQuery, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    loadFollowers()
  }, 400)
})

onMounted(() => loadFollowers())
</script>

<template>
  <div class="flex flex-col gap-6">
    <UiPageHeader title="Mes abonnés" subtitle="Les utilisateurs qui suivent votre profil" />

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <!-- Total abonnés -->
      <div class="bg-surface border border-border-light rounded-xl p-5 flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-orange-dim flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <div>
          <div class="text-2xl font-bold font-serif text-text-primary">{{ stats.total }}</div>
          <div class="text-xs text-text-tertiary mt-0.5">Total abonnés</div>
        </div>
      </div>

      <!-- Nouveaux ce mois -->
      <div class="bg-surface border border-border-light rounded-xl p-5 flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-green-dim flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-green-dark)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
        </div>
        <div>
          <div class="text-2xl font-bold font-serif text-text-primary">{{ stats.new_this_month }}</div>
          <div class="text-xs text-text-tertiary mt-0.5">Nouveaux ce mois</div>
        </div>
      </div>

      <!-- Nouveaux cette semaine -->
      <div class="bg-surface border border-border-light rounded-xl p-5 flex items-center gap-4">
        <div class="w-10 h-10 rounded-lg bg-blue-dim flex items-center justify-center shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue-main)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
        </div>
        <div>
          <div class="text-2xl font-bold font-serif text-text-primary">{{ stats.new_this_week }}</div>
          <div class="text-xs text-text-tertiary mt-0.5">Nouveaux cette semaine</div>
        </div>
      </div>
    </div>

    <!-- Search bar -->
    <div class="flex items-center gap-2.5 bg-surface border border-border-light rounded-lg px-4 py-2.5 transition-[border-color] duration-200 focus-within:border-orange-primary">
      <span class="text-text-tertiary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </span>
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Rechercher un abonné par nom, email…"
        class="bg-transparent border-none outline-none font-sans text-sm text-text-primary flex-1 placeholder:text-text-tertiary"
      />
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex flex-col gap-3">
      <div v-for="n in 5" :key="n" class="bg-surface border border-border-light rounded-xl p-4 animate-pulse">
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-full bg-surface-2" />
          <div class="flex-1 space-y-2">
            <div class="h-4 bg-surface-2 rounded w-1/3" />
            <div class="h-3 bg-surface-2 rounded w-1/4" />
          </div>
        </div>
      </div>
    </div>

    <!-- Followers list -->
    <div v-else-if="filteredFollowers.length" class="flex flex-col gap-2">
      <div
        v-for="follower in filteredFollowers"
        :key="follower.id"
        class="bg-surface border border-border-light rounded-xl p-4 flex items-center gap-4 transition-colors duration-150 hover:bg-surface-2/50 hover:border-border-medium"
      >
        <!-- Avatar -->
        <div v-if="follower.avatar" class="w-10 h-10 rounded-full overflow-hidden shrink-0">
          <img :src="follower.avatar" :alt="follower.name" class="w-full h-full object-cover" />
        </div>
        <div
          v-else
          class="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          :style="{ background: follower.avatarColor }"
        >
          {{ follower.initials }}
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="text-sm font-semibold text-text-primary truncate">{{ follower.name }}</div>
          <div class="text-xs text-text-secondary truncate">{{ follower.email }}</div>
        </div>

        <!-- Date -->
        <div class="text-xs text-text-tertiary shrink-0 hidden sm:block">
          <template v-if="follower.since">Abonné depuis le {{ formatDate(follower.since) }}</template>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="bg-surface border border-border-light rounded-xl py-16 flex flex-col items-center justify-center text-center">
      <div class="w-14 h-14 rounded-full bg-surface-2 flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
      <div class="text-sm font-semibold text-text-secondary mb-1">Vous n'avez pas encore d'abonnés</div>
      <div class="text-xs text-text-tertiary max-w-xs">Partagez vos événements pour attirer des abonnés à votre profil organisateur.</div>
    </div>

    <!-- Pagination -->
    <div v-if="!loading && totalPages > 1" class="flex items-center justify-center gap-2 pt-2">
      <button
        class="px-3 py-1.5 rounded-lg text-xs font-medium border border-border-light bg-surface text-text-secondary cursor-pointer transition-colors duration-150 hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="currentPage <= 1"
        @click="goToPage(currentPage - 1)"
      >
        ← Précédent
      </button>
      <span class="text-xs text-text-tertiary px-2">
        Page {{ currentPage }} sur {{ totalPages }}
      </span>
      <button
        class="px-3 py-1.5 rounded-lg text-xs font-medium border border-border-light bg-surface text-text-secondary cursor-pointer transition-colors duration-150 hover:bg-surface-2 disabled:opacity-40 disabled:cursor-not-allowed"
        :disabled="currentPage >= totalPages"
        @click="goToPage(currentPage + 1)"
      >
        Suivant →
      </button>
    </div>
  </div>
</template>
