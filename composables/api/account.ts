export const useAccountApi = () => {
  const { get, put, post, delete: del } = useApi()

  const getProfile = () =>
    get('/account/profile')

  const updateProfile = (data: Record<string, unknown>) =>
    put('/account/profile', data)

  const uploadAvatar = (formData: FormData) =>
    post('/account/avatar', formData)

  const changePassword = (data: { current_password: string; password: string; password_confirmation: string }) =>
    put('/account/password', data)

  const deleteAccount = (password: string) =>
    del('/account/account', { password })

  const getTickets = (params?: Record<string, unknown>) =>
    get('/account/tickets', params)

  const getTicket = (reference: string) =>
    get(`/tickets/${reference}`)

  const downloadTicket = (reference: string) =>
    get(`/tickets/${reference}/download`)

  const resendTicket = (reference: string) =>
    post(`/tickets/${reference}/resend`)

  const getOrders = (params?: Record<string, unknown>) =>
    get('/account/orders', params)

  const getOrder = (id: number | string) =>
    get(`/orders/${id}`)

  const getGuestOrder = (reference: string, signedQuery: Record<string, string>) =>
    get(`/orders/${reference}/guest-access`, signedQuery)

  const requestRefund = (orderId: number | string) =>
    post(`/orders/${orderId}/refund`)

  const getFavorites = (params?: Record<string, unknown>) =>
    get('/favorites', params)

  const toggleFavorite = (eventId: number | string) =>
    post(`/events/${eventId}/favorite`)

  return {
    getProfile, updateProfile, uploadAvatar, changePassword, deleteAccount,
    getTickets, getTicket, downloadTicket, resendTicket,
    getOrders, getOrder, getGuestOrder, requestRefund,
    getFavorites, toggleFavorite,
  }
}
