<script setup lang="ts">
definePageMeta({ layout: 'account', middleware: 'auth' })

const api = useAccountApi()
const { error: showError } = useNotification()

const loading = ref(true)
const errorState = ref(false)
const favorites = ref<any[]>([])
const removing = ref<number | string | null>(null)
const page = ref(1)
const lastPage = ref(1)

const loadFavorites = async () => {
  loading.value = true
  errorState.value = false
  try {
    const res = await api.getFavorites({ page: page.value })
    const data = res.data ?? res
    favorites.value = data.data ?? data
    lastPage.value = data.last_page ?? 1
  } catch {
    errorState.value = true
    showError('Impossible de charger vos favoris')
  } finally {
    loading.value = false
  }
}

watch(page, loadFavorites)
onMounted(loadFavorites)

const removeFavorite = async (eventId: number | string) => {
  removing.value = eventId
  try {
    await api.toggleFavorite(eventId)
    favorites.value = favorites.value.filter((e: any) => e.id !== eventId)
  } catch {
    showError('Impossible de retirer ce favori')
  } finally {
    removing.value = null
  }
}

const formatPrice = (event: any) => {
  if (event.is_free) return 'Gratuit'
  if (event.min_price != null && event.min_price > 0) {
    return 'À partir de ' + new Intl.NumberFormat('fr-FR').format(event.min_price) + ' F CFA'
  }
  return 'Gratuit'
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

const getLocation = (event: any) => {
  return [event.venue ?? event.location, event.city, event.country].filter(Boolean).join(', ')
}

const getEventBadge = (event: any) => {
  if (event.status === 'cancelled') return { label: 'Annulé', class: 'bg-red-50 text-red-700' }
  if (!event.date_start) return null
  const now = new Date()
  const start = new Date(event.date_start)
  if (start > now) return { label: 'À venir', class: 'bg-green-50 text-green-700' }
  return { label: 'Passé', class: 'bg-gray-100 text-gray-500' }
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <h1 class="font-serif text-2xl text-text-primary">Mes favoris</h1>
      <p class="text-text-secondary mt-1">Les événements que vous avez mis en favoris</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div v-for="i in 4" :key="i" class="bg-surface rounded-xl overflow-hidden animate-pulse">
        <div class="h-40 bg-surface-2" />
        <div class="p-4 space-y-3">
          <div class="h-4 bg-surface-2 rounded w-3/4" />
          <div class="h-3 bg-surface-2 rounded w-1/2" />
          <div class="h-3 bg-surface-2 rounded w-2/3" />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="errorState" class="flex flex-col items-center justify-center py-16 text-center">
      <svg width="48" height="48" viewBox="0 0 24 24" class="text-red-300 mb-4" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <p class="text-sm text-text-secondary mb-4">Impossible de charger vos favoris</p>
      <button
        type="button"
        class="px-6 py-2.5 rounded-lg text-sm font-medium bg-orange-primary text-white hover:bg-orange-light transition-colors"
        @click="loadFavorites"
      >
        Réessayer
      </button>
    </div>

    <!-- Favorites grid -->
    <div v-else-if="favorites.length" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          v-for="event in favorites"
          :key="event.id"
          class="bg-surface rounded-xl overflow-hidden group transition-all hover:border-border-medium"
        >
          <NuxtLink :to="`/events/${event.slug || event.id}`" class="block no-underline">
            <!-- Cover image -->
            <div class="relative h-40 bg-surface-2 overflow-hidden">
              <NuxtImg
                v-if="event.flyer_url"
                :src="event.flyer_url"
                :alt="event.title"
                class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                :placeholder="[20, 20]"
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-dim to-surface-2">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-tertiary/30">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>

              <!-- Badge -->
              <span
                v-if="getEventBadge(event)"
                :class="['absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold', getEventBadge(event)!.class]"
              >
                {{ getEventBadge(event)!.label }}
              </span>
            </div>

            <!-- Content -->
            <div class="p-4">
              <h3 class="font-semibold text-text-primary truncate mb-2 group-hover:text-orange-primary transition-colors">
                {{ event.title }}
              </h3>

              <div class="space-y-1.5 text-xs text-text-tertiary">
                <div v-if="event.date_start" class="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  {{ formatDate(event.date_start) }}
                </div>
                <div v-if="getLocation(event)" class="flex items-center gap-1.5">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  <span class="truncate">{{ getLocation(event) }}</span>
                </div>
              </div>

              <div class="flex items-center justify-between mt-3 pt-3 border-t border-border-light">
                <span class="text-sm font-semibold text-text-primary">{{ formatPrice(event) }}</span>
              </div>
            </div>
          </NuxtLink>

          <!-- Remove button (outside NuxtLink) -->
          <div class="px-4 pb-4 -mt-1">
            <button
              type="button"
              class="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors disabled:opacity-50"
              :disabled="removing === event.id"
              @click="removeFavorite(event.id)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {{ removing === event.id ? 'Suppression...' : 'Retirer des favoris' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="lastPage > 1" class="flex items-center justify-center gap-2 pt-2">
        <button
          v-for="p in lastPage"
          :key="p"
          type="button"
          class="w-8 h-8 rounded-lg text-xs font-medium transition-colors"
          :class="p === page ? 'bg-orange-primary text-white' : 'bg-surface-2 text-text-secondary hover:bg-surface-3'"
          @click="page = p"
        >
          {{ p }}
        </button>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else class="flex flex-col items-center justify-center py-16 text-center">
      <svg width="48" height="48" viewBox="0 0 24 24" class="text-text-tertiary/20 mb-4" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      <p class="text-sm text-text-secondary mb-4">Vous n'avez pas encore d'événements favoris</p>
      <NuxtLink
        to="/events"
        class="px-6 py-2.5 rounded-lg text-sm font-medium bg-orange-primary text-white hover:bg-orange-light transition-colors no-underline"
      >
        Découvrir des événements
      </NuxtLink>
    </div>
  </div>
</template>
