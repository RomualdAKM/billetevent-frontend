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

const { getEvents, toggleFavorite: apiFavorite } = useEventsApi()
const { error: notifyError } = useNotification()

const search = ref('')
const activeCategory = ref('Tous')
const sortBy = ref('recommended')
const verifiedOnly = ref(false)
const currentPage = ref(1)
const itemsPerPage = 9
const favorites = ref<Set<number | string>>(new Set())

const categories = ['Tous', 'Musique', 'Business', 'Art', 'Sport', 'Formation', 'Tech', 'Food']

const sortOptions = [
  { value: 'recommended', label: 'Recommandés' },
  { value: 'price-asc', label: 'Prix : croissant' },
  { value: 'price-desc', label: 'Prix : décroissant' },
  { value: 'date', label: 'Date la plus proche' },
  { value: 'popular', label: 'Les plus populaires' },
]

const sortMap: Record<string, string> = {
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
  if (activeCategory.value !== 'Tous') params.category = activeCategory.value
  if (search.value.trim()) params.search = search.value.trim()
  if (sortMap[sortBy.value]) params.sort = sortMap[sortBy.value]
  return params
})

const { data: apiResponse, status, refresh } = await useLazyAsyncData(
  'events-listing',
  () => getEvents(apiParams.value),
  { watch: [apiParams] }
)

const loading = computed(() => status.value === 'pending')

const paginatedEvents = computed(() => {
  const items = apiResponse.value?.data ?? []
  if (!verifiedOnly.value) return items
  return items.filter((e: any) => e.is_verified)
})

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

watch([activeCategory, sortBy, verifiedOnly], () => {
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

const resetFilters = () => {
  search.value = ''
  activeCategory.value = 'Tous'
  sortBy.value = 'recommended'
  verifiedOnly.value = false
  currentPage.value = 1
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

      <div class="flex gap-2 flex-wrap mb-6">
        <button
          v-for="cat in categories"
          :key="cat"
          class="px-4 py-2 rounded-full text-xs font-semibold border transition-colors cursor-pointer"
          :class="activeCategory === cat ? 'bg-orange-primary text-white border-orange-primary' : 'bg-surface border-border-light text-text-secondary hover:border-orange-primary hover:text-orange-primary'"
          @click="activeCategory = cat"
        >
          {{ cat }}
        </button>
      </div>

      <div class="flex flex-wrap items-center gap-3 mb-8">
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
