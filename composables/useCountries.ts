export const COUNTRY_OPTIONS = [
  { code: 'SN', label: 'Sénégal', prefix: '+221' },
  { code: 'CI', label: "Côte d'Ivoire", prefix: '+225' },
  { code: 'BJ', label: 'Bénin', prefix: '+229' },
  { code: 'TG', label: 'Togo', prefix: '+228' },
  { code: 'ML', label: 'Mali', prefix: '+223' },
  { code: 'BF', label: 'Burkina Faso', prefix: '+226' },
  { code: 'CM', label: 'Cameroun', prefix: '+237' },
] as const

export function useCountries() {
  return { COUNTRY_OPTIONS }
}
