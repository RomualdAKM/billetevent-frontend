<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <div class="text-center mb-10">
      <h1 class="font-serif text-3xl md:text-4xl text-text-primary mb-3">Points de vente physiques</h1>
      <p class="text-base text-text-secondary">Trouvez nos distributeurs agréés près de chez vous</p>
    </div>

    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
      <select
        v-model="selectedCountry"
        class="px-4 py-2.5 rounded-xl border border-border-light bg-bg-surface text-sm text-text-primary outline-none transition-[border-color] duration-200 focus:border-orange-primary font-sans appearance-none cursor-pointer min-w-[180px]"
      >
        <option value="">Tous les pays</option>
        <option v-for="c in countries" :key="c" :value="c">{{ c }}</option>
      </select>
      <div class="relative flex-1">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un point de vente..."
          class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-light bg-bg-surface text-sm text-text-primary outline-none transition-[border-color] duration-200 focus:border-orange-primary font-sans"
        />
      </div>
      <div class="flex bg-bg-surface-2 rounded-xl p-1 gap-1 shrink-0">
        <button
          class="px-3 py-2 rounded-lg border-none text-sm font-semibold cursor-pointer transition-all duration-200 font-sans"
          :class="viewMode === 'list' ? 'bg-bg-surface text-text-primary' : 'bg-transparent text-text-tertiary'"
          @click="viewMode = 'list'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
        </button>
        <button
          class="px-3 py-2 rounded-lg border-none text-sm font-semibold cursor-pointer transition-all duration-200 font-sans"
          :class="viewMode === 'map' ? 'bg-bg-surface text-text-primary' : 'bg-transparent text-text-tertiary'"
          @click="viewMode = 'map'"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
        </button>
      </div>
    </div>

    <div v-if="loading" class="flex items-center justify-center py-16">
      <div class="w-6 h-6 border-2 border-orange-primary border-t-transparent rounded-full animate-spin" />
    </div>
    <div v-else-if="viewMode === 'list'">
      <div v-if="filteredData.length === 0" class="text-center py-16">
        <p class="text-text-tertiary text-base">Aucun point de vente trouvé pour cette recherche.</p>
      </div>
      <div v-for="country in filteredData" :key="country.name" class="mb-8">
        <h2 class="font-serif text-xl text-text-primary mb-4 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-orange-primary"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
          {{ country.name }}
        </h2>
        <div v-for="zone in country.zones" :key="zone.name" class="mb-4">
          <button
            class="w-full flex items-center justify-between py-3 px-4 bg-bg-surface-2 rounded-xl cursor-pointer border-none font-sans transition-all duration-200 hover:bg-bg-surface"
            @click="toggleZone(country.name + '-' + zone.name)"
          >
            <div class="flex items-center gap-2">
              <span class="font-semibold text-base text-text-primary">{{ zone.name }}</span>
              <span class="text-xs text-text-tertiary">{{ zone.points.length }} point{{ zone.points.length > 1 ? 's' : '' }}</span>
            </div>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              class="text-text-tertiary transition-transform duration-200"
              :class="openZones.has(country.name + '-' + zone.name) ? 'rotate-180' : ''"
            ><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div v-if="openZones.has(country.name + '-' + zone.name)" class="flex flex-col gap-3 mt-3 pl-2">
            <div
              v-for="point in zone.points"
              :key="point.name"
              class="bg-bg-surface rounded-xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3"
            >
              <div>
                <div class="font-semibold text-sm text-text-primary">{{ point.name }}</div>
                <div class="text-text-secondary text-sm">{{ point.address }}</div>
                <div class="text-text-tertiary text-xs">{{ point.hours }}</div>
              </div>
              <a
                :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(point.address + ' ' + zone.name)}`"
                target="_blank"
                rel="noopener"
                class="flex items-center gap-1.5 text-orange-primary text-sm font-semibold no-underline hover:opacity-75 transition-opacity duration-150 shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                Carte
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="bg-bg-surface-2 rounded-xl h-[500px] flex flex-col items-center justify-center gap-4">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="text-text-tertiary">
        <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
        <line x1="8" y1="2" x2="8" y2="18"/>
        <line x1="16" y1="6" x2="16" y2="22"/>
      </svg>
      <p class="text-text-primary font-semibold text-lg">Vue carte bientôt disponible</p>
      <p class="text-text-secondary text-sm">Utilisez la vue liste pour trouver un point de vente</p>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'default' })

const { getPublicPdv } = usePublicApi()

const searchQuery = ref('')
const selectedCountry = ref('')
const viewMode = ref('list')
const openZones = ref(new Set())
const loading = ref(true)
const pdvList = ref([])

const countries = computed(() => {
  const names = new Set(pdvList.value.map(c => c.name))
  return [...names]
})

const toggleZone = (key) => {
  if (openZones.value.has(key)) {
    openZones.value.delete(key)
  } else {
    openZones.value.add(key)
  }
  openZones.value = new Set(openZones.value)
}

let debounceTimer = null
const loadPdv = async () => {
  loading.value = true
  try {
    const params = {}
    if (selectedCountry.value) params.country = selectedCountry.value
    if (searchQuery.value.trim()) params.search = searchQuery.value.trim()
    const response = await getPublicPdv(params)
    pdvList.value = response?.data || response || []
    openZones.value = new Set()
    pdvList.value.forEach(country => {
      if (country.zones) {
        country.zones.forEach(zone => {
          openZones.value.add(country.name + '-' + zone.name)
        })
      }
    })
    openZones.value = new Set(openZones.value)
  } catch (err) {
    console.error('Error loading sales points:', err)
  } finally {
    loading.value = false
  }
}

onMounted(loadPdv)

watch(selectedCountry, loadPdv)
watch(searchQuery, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(loadPdv, 300)
})

const filteredData = computed(() => {
  let data = pdvList.value

  if (selectedCountry.value) {
    data = data.filter(c => c.name === selectedCountry.value)
  }

  if (!searchQuery.value.trim()) return data

  const q = searchQuery.value.toLowerCase().trim()
  return data
    .map(country => ({
      ...country,
      zones: (country.zones || [])
        .map(zone => ({
          ...zone,
          points: (zone.points || []).filter(
            p => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || zone.name.toLowerCase().includes(q)
          )
        }))
        .filter(zone => zone.points.length > 0)
    }))
    .filter(country => (country.zones || []).length > 0)
})
</script>
