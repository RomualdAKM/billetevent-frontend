import { ref } from 'vue'
import citiesData from '~/data/cities.json'

const COUNTRY_NAMES: Record<string, string> = {
  SN: 'Senegal',
  CI: 'Ivory Coast',
  ML: 'Mali',
  BF: 'Burkina Faso',
  BJ: 'Benin',
  TG: 'Togo',
  CM: 'Cameroon'
}

function getCountryName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] ?? code
}

export function useCityAutocomplete() {
  const suggestions = ref<string[]>([])
  const loading = ref(false)

  async function searchCities(countryCode: string, query: string) {
    if (!query || query.length < 2) {
      suggestions.value = []
      return
    }

    const code = countryCode.toUpperCase()
    const staticCities = (citiesData as Record<string, string[]>)[code] || []
    const filtered = staticCities.filter(c =>
      c.toLowerCase().includes(query.toLowerCase())
    )

    if (filtered.length > 0) {
      suggestions.value = filtered.slice(0, 10)
      return
    }

    // Fallback Nominatim si rien trouvé en statique
    loading.value = true
    try {
      const countryName = getCountryName(code)
      const response = await $fetch<any[]>('https://nominatim.openstreetmap.org/search', {
        params: {
          city: query,
          country: countryName,
          countrycodes: code.toLowerCase(),
          format: 'json',
          limit: 10,
          'accept-language': 'fr',
          featuretype: 'city'
        },
        headers: {
          'User-Agent': 'BilletEvent/1.0'
        }
      })
      suggestions.value = [
        ...new Set(
          response
            .map(r => r.name || r.display_name?.split(',')[0])
            .filter(Boolean)
        )
      ].slice(0, 10)
    } catch {
      suggestions.value = []
    } finally {
      loading.value = false
    }
  }

  return { suggestions, loading, searchCities }
}
