interface EventFilters {
  category?: string
  search?: string
  city?: string
  sort?: string
  page?: number
  per_page?: number
  featured?: boolean
}

export const useEventsApi = () => {
  const { get, post } = useApi()

  const getEvents = (params?: EventFilters) =>
    get('/events', params)

  const getEvent = (slug: string) =>
    get(`/events/${slug}`)

  const toggleFavorite = (eventId: number | string) =>
    post(`/events/${eventId}/favorite`)

  const getFavorites = () =>
    get('/favorites')

  return { getEvents, getEvent, toggleFavorite, getFavorites }
}
