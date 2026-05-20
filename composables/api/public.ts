export const usePublicApi = () => {
  const api = useApi()

  const getPublicStats = () => api.get('/public/stats')
  const getPublicPdv = (params?: any) => api.get('/public/points-of-sale', params)
  const getOrganizerProfile = (id: number | string) => api.get(`/public/organizers/${id}`)
  const getOrganizerEvents = (id: number | string, params?: any) => api.get(`/public/organizers/${id}/events`, params)
  const toggleFollowOrganizer = (id: number | string) => api.post(`/organizers/${id}/follow`)
  const sendContactMessage = (data: any) => api.post('/contact', data)
  const sendOrganizerInquiry = (organizerId: number | string, data: { name: string; email: string; subject: string; message: string }) =>
    api.post(`/public/organizers/${organizerId}/contact`, data)

  return { getPublicStats, getPublicPdv, getOrganizerProfile, getOrganizerEvents, toggleFollowOrganizer, sendContactMessage, sendOrganizerInquiry }
}
