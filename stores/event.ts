export const useEventStore = defineStore('event', () => {
  const filters = ref({ category: '', search: '', city: '', sort: 'date' })
  const currentPage = ref(1)

  function setFilter(key: string, value: string) {
    ;(filters.value as any)[key] = value
    currentPage.value = 1
  }

  function setPage(page: number) { currentPage.value = page }

  function resetFilters() {
    filters.value = { category: '', search: '', city: '', sort: 'date' }
    currentPage.value = 1
  }

  return { filters, currentPage, setFilter, setPage, resetFilters }
})
