interface Operator {
  key: string
  name: string
}

interface PaymentCountry {
  code: string
  name: string
  flag: string
  prefix: string
  operators: Operator[]
}

const cachedCountries = ref<PaymentCountry[]>([])
const loaded = ref(false)
const loading = ref(false)

export function usePaymentOperators() {
  const fetchOperators = async (): Promise<PaymentCountry[]> => {
    if (loaded.value || loading.value) return cachedCountries.value
    loading.value = true
    try {
      const config = useRuntimeConfig()
      const baseURL = (config.public.apiBase as string) || 'http://localhost:8000/api'
      const res = await $fetch<any>(`${baseURL}/payment-methods/operators`)
      const data = res?.data ?? res
      cachedCountries.value = data?.countries ?? data ?? []
      loaded.value = true
    } catch (e) {
      console.error('Erreur chargement opérateurs:', e)
    } finally {
      loading.value = false
    }
    return cachedCountries.value
  }

  const getOperatorsForCountry = (countryCode: string): Operator[] => {
    const country = cachedCountries.value.find((c) => c.code === countryCode)
    return country?.operators ?? []
  }

  const getCountryInfo = (countryCode: string): PaymentCountry | undefined => {
    return cachedCountries.value.find((c) => c.code === countryCode)
  }

  return {
    countries: cachedCountries,
    loaded,
    loading,
    fetchOperators,
    getOperatorsForCountry,
    getCountryInfo,
  }
}
