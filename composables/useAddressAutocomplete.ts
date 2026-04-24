import { ref } from 'vue'

export interface AddressSuggestion {
  display_name: string
  lat: string
  lon: string
}

export function useAddressAutocomplete() {
  const suggestions = ref<string[]>([])
  const loading = ref(false)
  const rawResults = ref<AddressSuggestion[]>([])

  let debounceTimer: ReturnType<typeof setTimeout> | null = null

  async function searchAddresses(query: string, countryCode?: string, city?: string) {
    if (!query || query.length < 3 || !countryCode || !city) {
      suggestions.value = []
      rawResults.value = []
      return
    }

    if (debounceTimer) clearTimeout(debounceTimer)

    debounceTimer = setTimeout(async () => {
      loading.value = true
      try {
        const params: Record<string, string> = {
          q: `${query} ${city}`,
          format: 'json',
          limit: '5',
          'accept-language': 'fr',
          addressdetails: '1',
          countrycodes: countryCode.toLowerCase()
        }

        const response = await $fetch<any[]>('https://nominatim.openstreetmap.org/search', {
          params,
          headers: {
            'User-Agent': 'BilletEvent/1.0'
          }
        })

        rawResults.value = response.map(r => ({
          display_name: r.display_name,
          lat: r.lat,
          lon: r.lon
        }))

        suggestions.value = rawResults.value
          .map(r => r.display_name)
          .filter(Boolean)
      } catch {
        suggestions.value = []
        rawResults.value = []
      } finally {
        loading.value = false
      }
    }, 400)
  }

  function getCoordinates(selectedDisplayName: string): { lat: number; lon: number } | null {
    const match = rawResults.value.find(r => r.display_name === selectedDisplayName)
    if (match) {
      return { lat: parseFloat(match.lat), lon: parseFloat(match.lon) }
    }
    return null
  }

  return { suggestions, loading, searchAddresses, getCoordinates }
}
