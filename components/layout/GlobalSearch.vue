<script setup lang="ts">
/**
 * Recherche globale — palette Cmd+K style, accessible depuis la Navbar.
 *
 * Sans endpoint dédié /search, on requête /api/events?search=... (déjà existant).
 * Évolution future possible : ajouter organisateurs, villes, catégories.
 */
const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{ close: [] }>()

const { getEvents } = useEventsApi()

const query = ref('')
const loading = ref(false)
const results = ref<any[]>([])
const inputRef = ref<HTMLInputElement | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

// Focus auto à l'ouverture (UX cmd+K standard)
watch(() => props.open, async (val) => {
  if (val) {
    await nextTick()
    inputRef.value?.focus()
  } else {
    query.value = ''
    results.value = []
  }
})

watch(query, () => {
  if (debounceTimer) clearTimeout(debounceTimer)
  if (!query.value.trim() || query.value.trim().length < 2) {
    results.value = []
    loading.value = false
    return
  }
  loading.value = true
  debounceTimer = setTimeout(runSearch, 250)
})

async function runSearch() {
  const q = query.value.trim()
  if (!q) {
    results.value = []
    loading.value = false
    return
  }
  try {
    const res: any = await getEvents({ search: q, per_page: 8, sort: 'popularity' })
    results.value = (res?.data ?? []).slice(0, 8)
  } catch {
    results.value = []
  } finally {
    loading.value = false
  }
}

function handleClose() {
  emit('close')
}

function goTo(item: any) {
  navigateTo(`/events/${item.slug || item.id}`)
  handleClose()
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') handleClose()
  if (e.key === 'Enter' && results.value.length > 0) {
    goTo(results.value[0])
  }
}

const formatPrice = (price: number | null | undefined) => {
  if (price === 0) return 'Gratuit'
  if (!price) return ''
  return new Intl.NumberFormat('fr-FR').format(price) + ' F CFA'
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-150"
      leave-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="open"
        class="fixed inset-0 z-[600] bg-black/50 flex items-start justify-center pt-[10vh] sm:pt-[15vh] px-4"
        @click.self="handleClose"
        @keydown="onKeydown"
      >
        <div class="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden" @keydown="onKeydown">
          <!-- Input -->
          <div class="flex items-center gap-3 px-4 py-3 border-b border-border-light">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-text-tertiary shrink-0">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="Rechercher un événement, un artiste, une ville…"
              autocomplete="off"
              spellcheck="false"
              class="flex-1 bg-transparent outline-none text-base text-text-primary placeholder:text-text-tertiary"
            />
            <kbd class="hidden sm:inline-block text-[10px] text-text-tertiary border border-border-light rounded px-1.5 py-0.5">ESC</kbd>
          </div>

          <!-- Résultats -->
          <div class="max-h-[60vh] overflow-y-auto">
            <div v-if="loading" class="px-4 py-8 text-center text-sm text-text-tertiary">
              Recherche…
            </div>

            <div v-else-if="!query.trim()" class="px-4 py-8 text-center">
              <p class="text-sm text-text-tertiary mb-3">Que cherchez-vous aujourd'hui ?</p>
              <div class="flex flex-wrap gap-2 justify-center">
                <NuxtLink to="/events?date=weekend" class="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-2 text-text-primary hover:bg-orange-dim hover:text-orange-primary transition-colors" @click="handleClose">Ce week-end</NuxtLink>
                <NuxtLink to="/events?cat=Musique" class="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-2 text-text-primary hover:bg-orange-dim hover:text-orange-primary transition-colors" @click="handleClose">Concerts</NuxtLink>
                <NuxtLink to="/events?cat=Formation" class="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-2 text-text-primary hover:bg-orange-dim hover:text-orange-primary transition-colors" @click="handleClose">Formations</NuxtLink>
                <NuxtLink to="/events?cat=Sport" class="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface-2 text-text-primary hover:bg-orange-dim hover:text-orange-primary transition-colors" @click="handleClose">Sport</NuxtLink>
              </div>
            </div>

            <div v-else-if="query.trim().length < 2" class="px-4 py-8 text-center text-sm text-text-tertiary">
              Tapez au moins 2 caractères.
            </div>

            <div v-else-if="results.length === 0" class="px-4 py-8 text-center">
              <p class="text-sm text-text-secondary mb-1">Aucun résultat pour « {{ query }} »</p>
              <NuxtLink
                :to="`/events?q=${encodeURIComponent(query)}`"
                class="text-xs text-orange-primary font-semibold hover:underline"
                @click="handleClose"
              >Voir la recherche complète →</NuxtLink>
            </div>

            <ul v-else class="divide-y divide-border-light">
              <li v-for="item in results" :key="item.id">
                <button
                  type="button"
                  class="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-2 transition-colors text-left"
                  @click="goTo(item)"
                >
                  <div class="w-12 h-12 rounded-lg overflow-hidden bg-surface-2 shrink-0">
                    <img v-if="item.flyer_url" :src="item.flyer_url" :alt="item.title" class="w-full h-full object-cover" loading="lazy" />
                    <div v-else class="w-full h-full bg-gradient-to-br from-orange-primary to-orange-light" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="text-sm font-semibold text-text-primary line-clamp-1">{{ item.title }}</div>
                    <div class="text-xs text-text-tertiary line-clamp-1">
                      <span v-if="item.date_start">{{ new Date(item.date_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
                      <span v-if="item.city"> · {{ item.city }}</span>
                    </div>
                  </div>
                  <div v-if="item.min_price !== null && item.min_price !== undefined" class="text-xs font-bold text-orange-primary shrink-0">{{ formatPrice(item.min_price) }}</div>
                </button>
              </li>
              <li>
                <NuxtLink
                  :to="`/events?q=${encodeURIComponent(query)}`"
                  class="block px-4 py-3 text-center text-xs text-orange-primary font-semibold hover:bg-orange-dim transition-colors"
                  @click="handleClose"
                >Voir tous les résultats →</NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
