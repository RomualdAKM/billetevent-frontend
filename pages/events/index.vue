<script setup lang="ts">
definePageMeta({ layout: 'default' })

useSeoMeta({
  title: 'Événements | BilletEvent',
  ogTitle: 'Événements | BilletEvent',
  description: 'Découvrez les meilleurs événements près de chez vous. Concerts, conférences, festivals et plus encore.',
  ogDescription: 'Découvrez les meilleurs événements près de chez vous.',
  ogImage: '/logo.png',
  ogType: 'website',
})

const { getEvents, toggleFavorite: apiFavorite, getFavorites } = useEventsApi()
const { error: notifyError } = useNotification()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// URL state : filtres persistés dans l'URL (?cat=musique&q=afro&page=2&date=weekend&city=Dakar&verified=1)
// Permet : partage URL filtrée, survie F5, navigation back/forward propre, SEO.
const search = ref<string>((route.query.q as string) || '')
const activeCategory = ref<string>((route.query.cat as string) || 'Tous')
const sortBy = ref<string>((route.query.sort as string) || 'recommended')
const verifiedOnly = ref<boolean>(route.query.verified === '1')
const currentPage = ref<number>(Math.max(1, parseInt(route.query.page as string) || 1))
const datePreset = ref<string>((route.query.date as string) || '')
const cityFilter = ref<string>((route.query.city as string) || '')
const itemsPerPage = 9
const favorites = ref<Set<number | string>>(new Set())

// Presets date : ce week-end / cette semaine / ce mois
function computeDateRange(preset: string): { from?: string; to?: string } {
  if (!preset) return {}
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const toIso = (d: Date) => d.toISOString().split('T')[0]
  if (preset === 'weekend') {
    // Du vendredi 18h au dimanche 23h59
    const day = today.getDay() // 0=dim, 6=sam
    const daysUntilFri = (5 - day + 7) % 7
    const from = new Date(today); from.setDate(from.getDate() + daysUntilFri)
    const to = new Date(from); to.setDate(to.getDate() + (day === 0 ? 0 : 2))
    return { from: toIso(from), to: toIso(to) }
  }
  if (preset === 'week') {
    const to = new Date(today); to.setDate(to.getDate() + 7)
    return { from: toIso(today), to: toIso(to) }
  }
  if (preset === 'month') {
    const to = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
    return { from: toIso(today), to: toIso(to) }
  }
  return {}
}

const datePresets = [
  { value: '', label: 'Toutes les dates' },
  { value: 'weekend', label: 'Ce week-end' },
  { value: 'week', label: 'Cette semaine' },
  { value: 'month', label: 'Ce mois' },
]

// Categories must mirror App\Enums\EventCategory (backend stores lowercase slugs:
// musique/business/art/sport/formation/tech/gastronomie/autre). The frontend
// displays the human label but sends the slug to the backend filter — otherwise
// `?category=Food` never matches `category='gastronomie'` and the filter is a no-op.
const categoryDefs = [
  { label: 'Tous', slug: '' },
  { label: 'Musique', slug: 'musique' },
  { label: 'Business', slug: 'business' },
  { label: 'Art', slug: 'art' },
  { label: 'Sport', slug: 'sport' },
  { label: 'Formation', slug: 'formation' },
  { label: 'Tech', slug: 'tech' },
  { label: 'Gastronomie', slug: 'gastronomie' },
  { label: 'Autre', slug: 'autre' },
] as const

const categories = categoryDefs.map(c => c.label)
const categorySlugFor = (label: string) => categoryDefs.find(c => c.label === label)?.slug ?? ''

const sortOptions = [
  { value: 'recommended', label: 'Recommandés' },
  { value: 'price-asc', label: 'Prix : croissant' },
  { value: 'price-desc', label: 'Prix : décroissant' },
  { value: 'date', label: 'Date la plus proche' },
  { value: 'popular', label: 'Les plus populaires' },
]

// Backend accepted sorts. "recommended" maps to popularity by default
// (events à venir triés par ventes décroissantes), pour que l'option par défaut
// ne soit pas un no-op silencieux côté serveur.
const sortMap: Record<string, string> = {
  'recommended': 'popularity',
  'price-asc': 'price_asc',
  'price-desc': 'price_desc',
  'date': 'date',
  'popular': 'popularity',
}

const formatPrice = (price: number) => {
  if (price === 0) return 'Gratuit'
  return new Intl.NumberFormat('fr-FR').format(price) + ' F CFA'
}

const formatDate = (iso: string) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const getInitials = (name: string) => {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const apiParams = computed(() => {
  const params: Record<string, any> = {
    page: currentPage.value,
    per_page: itemsPerPage,
  }
  if (activeCategory.value !== 'Tous') {
    const slug = categorySlugFor(activeCategory.value)
    if (slug) params.category = slug
  }
  if (search.value.trim()) params.search = search.value.trim()
  if (sortMap[sortBy.value]) params.sort = sortMap[sortBy.value]
  // Push verified filter to the API so pagination + count are coherent.
  if (verifiedOnly.value) params.verified = 1
  if (cityFilter.value.trim()) params.city = cityFilter.value.trim()
  const dateRange = computeDateRange(datePreset.value)
  if (dateRange.from) params.date_from = dateRange.from
  if (dateRange.to) params.date_to = dateRange.to
  return params
})

// Sync URL ↔ filtres : à chaque changement de filtre, on met à jour la query
// de l'URL pour permettre le partage + survie F5 + back/forward.
watchEffect(() => {
  if (!import.meta.client) return
  const q: Record<string, string> = {}
  if (search.value.trim()) q.q = search.value.trim()
  if (activeCategory.value !== 'Tous') q.cat = activeCategory.value
  if (sortBy.value !== 'recommended') q.sort = sortBy.value
  if (verifiedOnly.value) q.verified = '1'
  if (currentPage.value > 1) q.page = String(currentPage.value)
  if (datePreset.value) q.date = datePreset.value
  if (cityFilter.value.trim()) q.city = cityFilter.value.trim()
  router.replace({ query: q })
})

const { data: apiResponse, status, refresh } = await useLazyAsyncData(
  'events-listing',
  () => getEvents(apiParams.value),
  { watch: [apiParams] }
)

const loading = computed(() => status.value === 'pending')

// Verified filter is now applied server-side (cf. apiParams) — pas de filtre
// client supplémentaire qui casserait le count/pagination.
const paginatedEvents = computed(() => apiResponse.value?.data ?? [])

const meta = computed(() => apiResponse.value?.meta ?? { total: 0, last_page: 1 })
const resultCount = computed(() => meta.value.total ?? 0)
const totalPages = computed(() => meta.value.last_page ?? 1)

let searchTimeout: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    currentPage.value = 1
    refresh()
  }, 300)
})

watch([activeCategory, sortBy, verifiedOnly, datePreset, cityFilter], () => {
  currentPage.value = 1
})

const onPageChange = (page: number) => {
  currentPage.value = page
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

const toggleFavorite = async (id: number | string) => {
  try {
    await apiFavorite(id)
    if (favorites.value.has(id)) favorites.value.delete(id)
    else favorites.value.add(id)
  } catch {
    notifyError('Impossible de mettre à jour le favori')
  }
}

const isFavorite = (id: number | string) => favorites.value.has(id)

onMounted(async () => {
  // Hydrate favorites only when authenticated — otherwise /favorites returns 401
  if (!authStore.isLoggedIn) return
  try {
    const res: any = await getFavorites()
    const items = res?.data ?? res ?? []
    favorites.value = new Set(items.map((e: any) => e.id))
  } catch {
    // Silent — favorites are nice-to-have
  }
})

const resetFilters = () => {
  search.value = ''
  activeCategory.value = 'Tous'
  sortBy.value = 'recommended'
  verifiedOnly.value = false
  currentPage.value = 1
  datePreset.value = ''
  cityFilter.value = ''
}
</script>

<template>
  <div>
    <section class="px-5 md:px-10 pt-10 pb-6 max-w-[1200px] mx-auto">
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl leading-tight text-text-primary mb-2">Tous les événements</h1>
          <p class="text-sm text-text-tertiary">Découvrez et réservez vos billets en quelques clics.</p>
        </div>
        <div class="relative w-full md:w-[320px]">
          <svg class="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input v-model="search" type="text" placeholder="Rechercher un événement..." class="w-full pl-10 pr-4 py-2.5 border-[1.5px] border-border-light rounded-full font-sans text-sm text-text-primary bg-surface outline-none placeholder:text-text-tertiary focus:border-orange-primary transition-colors" />
        </div>
      </div>

      <!-- Chips date (critère n°1 en ticketing : quand) -->
      <div class="flex gap-2 flex-wrap mb-3">
        <button
          v-for="preset in datePresets"
          :key="preset.value || 'all'"
          type="button"
          class="px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer"
          :class="datePreset === preset.value ? 'bg-text-primary text-white border-text-primary' : 'bg-surface border-border-light text-text-secondary hover:border-text-primary hover:text-text-primary'"
          @click="datePreset = preset.value"
        >
          {{ preset.label }}
        </button>
      </div>

      <!-- Chips catégorie -->
      <div class="flex gap-2 flex-wrap mb-3">
        <button
          v-for="cat in categories"
          :key="cat"
          type="button"
          class="px-4 py-2 rounded-full text-xs font-semibold border transition-colors cursor-pointer"
          :class="activeCategory === cat ? 'bg-orange-primary text-white border-orange-primary' : 'bg-surface border-border-light text-text-secondary hover:border-orange-primary hover:text-orange-primary'"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-3 mb-8">
        <!-- Input ville (filtre lieu, critère n°2 en ticketing) -->
        <div class="relative">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          <input
            v-model="cityFilter"
            type="text"
            autocomplete="address-level2"
            placeholder="Ville"
            class="bg-surface border border-border-light rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary outline-none focus:border-orange-primary transition-colors w-32 md:w-44"
          />
        </div>

        <div class="relative">
          <select
            v-model="sortBy"
            class="appearance-none bg-surface border border-border-light rounded-lg px-4 py-2 pr-9 text-sm text-text-primary outline-none focus:border-orange-primary transition-colors cursor-pointer"
          >
            <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <svg class="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>

        <label class="flex items-center gap-2 cursor-pointer select-none">
          <input
            v-model="verifiedOnly"
            type="checkbox"
            class="w-4 h-4 rounded border-border-light text-orange-primary accent-orange-primary cursor-pointer"
          />
          <span class="text-sm text-text-secondary">Vérifiés uniquement</span>
        </label>

        <button
          type="button"
          class="px-4 py-2 rounded-lg text-sm font-medium text-text-tertiary hover:text-orange-primary border border-border-light hover:border-orange-primary transition-colors cursor-pointer"
          @click="resetFilters"
        >
          Réinitialiser
        </button>
      </div>

      <p class="text-sm text-text-tertiary mb-5">{{ resultCount }} événement{{ resultCount > 1 ? 's' : '' }} trouvé{{ resultCount > 1 ? 's' : '' }}</p>

      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-6">
        <div v-for="n in 6" :key="n" class="bg-surface border border-border-light rounded-xl overflow-hidden animate-pulse">
          <div class="h-44 bg-gray-200" />
          <div class="p-5 space-y-3">
            <div class="h-4 bg-gray-200 rounded w-3/4" />
            <div class="h-3 bg-gray-200 rounded w-1/2" />
            <div class="h-3 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>

      <div v-else-if="paginatedEvents.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-6">
        <NuxtLink v-for="evt in paginatedEvents" :key="evt.id" :to="`/events/${evt.slug || evt.id}`" class="no-underline">
          <EventCard
            :title="evt.title"
            :date="formatDate(evt.date_start)"
            :location="evt.location"
            :price="formatPrice(evt.min_price ?? 0)"
            :category="evt.category"
            :image="evt.flyer_url"
            :gradient="evt.gradient || 'from-orange-primary to-orange-light'"
            :event="{ ...evt, isVerified: evt.is_verified, isFavorite: isFavorite(evt.id), organizer: evt.organizer ? { ...evt.organizer, initials: getInitials(evt.organizer.display_name || evt.organizer.name) } : null }"
            @toggle-favorite="toggleFavorite"
          />
        </NuxtLink>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="text-text-tertiary"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <div class="font-serif text-xl text-text-primary mb-1.5">Aucun événement trouvé</div>
        <p class="text-sm text-text-tertiary">Essayez d'ajuster votre recherche ou vos filtres.</p>
      </div>

      <div v-if="totalPages > 1" class="flex justify-center pt-8 pb-16">
        <UiPagination
          :total-pages="totalPages"
          :current-page="currentPage"
          @page-change="onPageChange"
        />
      </div>
    </section>
  </div>
</template>
