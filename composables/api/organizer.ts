export const useOrganizerApi = () => {
  const { get, post, put, delete: del } = useApi()

  const getStats = (period?: string, dateFrom?: string, dateTo?: string) => {
    const params: Record<string, string> = {}
    if (period) params.period = period
    if (period === 'custom' && dateFrom) params.date_from = dateFrom
    if (period === 'custom' && dateTo) params.date_to = dateTo
    return get('/organizer/dashboard/stats', Object.keys(params).length ? params : undefined)
  }

  const getSalesByEvent = () =>
    get('/organizer/dashboard/sales-by-event')

  const getPassMix = () =>
    get('/organizer/dashboard/pass-mix')

  const getRecentEvents = () =>
    get('/organizer/dashboard/recent-events')

  const getRecentActivity = () =>
    get('/organizer/dashboard/recent-activity')

  const getSalesChart = (period?: string) =>
    get('/organizer/dashboard/sales-chart', period ? { period } : undefined)

  const getEvents = () =>
    get('/organizer/events')

  const createEvent = (data: Record<string, unknown>) =>
    post('/organizer/events', data)

  const getEvent = (id: number | string) =>
    get(`/organizer/events/${id}`)

  const updateEvent = (id: number | string, data: Record<string, unknown>) =>
    data instanceof FormData
      ? post(`/organizer/events/${id}`, data)
      : put(`/organizer/events/${id}`, data)

  const deleteEvent = (id: number | string) =>
    del(`/organizer/events/${id}`)

  const publishEvent = (id: number | string) =>
    post(`/organizer/events/${id}/publish`)

  const getPasses = (eventId: number | string) =>
    get(`/organizer/events/${eventId}/passes`)

  const createPass = (eventId: number | string, data: Record<string, unknown>) =>
    post(`/organizer/events/${eventId}/passes`, data)

  const updatePass = (eventId: number | string, passId: number | string, data: Record<string, unknown>) =>
    put(`/organizer/events/${eventId}/passes/${passId}`, data)

  const deletePass = (eventId: number | string, passId: number | string) =>
    del(`/organizer/events/${eventId}/passes/${passId}`)

  const getParticipants = (params?: Record<string, unknown>) =>
    get('/organizer/participants', params)

  const getParticipant = (ticketId: number | string) =>
    get(`/organizer/participants/${ticketId}`)

  const resendTicket = (ticketId: number | string) =>
    post(`/organizer/participants/${ticketId}/resend`)

  const sendEmailToParticipant = (ticketId: number | string, data: { subject: string; message: string }) =>
    post(`/organizer/participants/${ticketId}/send-email`, data)

  const getKyc = () =>
    get('/organizer/kyc')

  const submitIdentity = (data: Record<string, unknown>) =>
    post('/organizer/kyc/identity', data)

  const submitDocument = (formData: FormData) =>
    post('/organizer/kyc/document', formData)

  const resubmitKyc = () =>
    post('/organizer/kyc/resubmit')

  const getBalance = () =>
    get('/organizer/wallet/balance')

  const getTransactions = (params?: Record<string, unknown>) =>
    get('/organizer/wallet/transactions', params)

  const getWithdrawals = () =>
    get('/organizer/withdrawals')

  const requestWithdrawal = (data: Record<string, unknown>) =>
    post('/organizer/withdrawals', data)

  const getPromoCodes = () =>
    get('/organizer/promo-codes')

  const createPromoCode = (data: Record<string, unknown>) =>
    post('/organizer/promo-codes', data)

  const updatePromoCode = (id: number | string, data: Record<string, unknown>) =>
    put(`/organizer/promo-codes/${id}`, data)

  const deletePromoCode = (id: number | string) =>
    del(`/organizer/promo-codes/${id}`)

  const togglePromoCode = (id: number | string) =>
    post(`/organizer/promo-codes/${id}/toggle`)

  const getCampaigns = () =>
    get('/organizer/campaigns')

  const createCampaign = (data: Record<string, unknown>) =>
    post('/organizer/campaigns', data)

  const updateCampaign = (id: number | string, data: Record<string, unknown>) =>
    put(`/organizer/campaigns/${id}`, data)

  const deleteCampaign = (id: number | string) =>
    del(`/organizer/campaigns/${id}`)

  const sendCampaign = (id: number | string) =>
    post(`/organizer/campaigns/${id}/send`)

  const getPdvs = () =>
    get('/organizer/pdv')

  const createPdv = (data: Record<string, unknown>) =>
    post('/organizer/pdv', data)

  const updatePdv = (id: number | string, data: Record<string, unknown>) =>
    put(`/organizer/pdv/${id}`, data)

  const deletePdv = (id: number | string) =>
    del(`/organizer/pdv/${id}`)

  const togglePdv = (id: number | string) =>
    post(`/organizer/pdv/${id}/toggle`)

  const assignEventToPdv = (pdvId: number | string, eventId: number | string) =>
    post(`/organizer/pdv/${pdvId}/events/${eventId}`)

  const removeEventFromPdv = (pdvId: number | string, eventId: number | string) =>
    del(`/organizer/pdv/${pdvId}/events/${eventId}`)

  const recordPdvSale = (pdvId: number | string, data: Record<string, unknown>) =>
    post(`/organizer/pdv/${pdvId}/sales`, data)

  const getPdvStats = (pdvId: number | string) =>
    get(`/organizer/pdv/${pdvId}/stats`)

  const getProfile = () =>
    get('/organizer/settings/profile')

  const updateProfile = (data: Record<string, unknown> | FormData) => {
    if (data instanceof FormData) {
      data.append('_method', 'PUT')
      return post('/organizer/settings/profile', data)
    }
    return put('/organizer/settings/profile', data)
  }

  const getNotificationPrefs = () =>
    get('/organizer/settings/notifications')

  const updateNotificationPrefs = (data: Record<string, unknown>) =>
    put('/organizer/settings/notifications', data)

  const getPayoutMethods = () =>
    get('/organizer/settings/payout-methods')

  const addPayoutMethod = (data: Record<string, unknown>) =>
    post('/organizer/settings/payout-methods', data)

  const updatePayoutMethod = (id: number, data: Record<string, unknown>) =>
    put(`/organizer/settings/payout-methods/${id}`, data)

  const deletePayoutMethod = (id: number) =>
    del(`/organizer/settings/payout-methods/${id}`)

  const setDefaultPayoutMethod = (id: number) =>
    post(`/organizer/settings/payout-methods/${id}/set-default`)

  const getOperators = () => {
    const config = useRuntimeConfig()
    const baseURL = config.public.apiBase as string
    return $fetch(`${baseURL}/payment-methods/operators`)
  }

  const getPixels = () =>
    get('/organizer/pixels')

  const updatePixels = (data: Record<string, unknown>) =>
    put('/organizer/pixels', data)

  const getSupportTickets = () =>
    get('/support-tickets')

  const createSupportTicket = (data: Record<string, unknown>) =>
    post('/support-tickets', data)

  const getSupportTicket = (id: number | string) =>
    get(`/support-tickets/${id}`)

  const getNotifications = (params?: Record<string, unknown>) =>
    get('/notifications', params)

  const getUnreadCount = () =>
    get('/notifications/unread-count')

  const markAsRead = (id: number | string) =>
    post(`/notifications/${id}/read`)

  const markAllAsRead = () =>
    post('/notifications/read-all')

  const getValidatorSessions = (eventId: number | string) =>
    get(`/organizer/events/${eventId}/validator`)

  const createValidatorSession = (eventId: number | string, data: Record<string, unknown>) =>
    post(`/organizer/events/${eventId}/validator`, data)

  const updateValidatorSession = (eventId: number | string, _sessionId: number | string, data: Record<string, unknown>) =>
    post(`/organizer/events/${eventId}/validator/regenerate`, data)

  const deleteValidatorSession = (eventId: number | string, _sessionId: number | string) =>
    post(`/organizer/events/${eventId}/validator/deactivate`)

  const getInvitations = (eventId: number | string, params?: Record<string, any>) =>
    get(`/organizer/events/${eventId}/invitations`, params)
  const createInvitation = (eventId: number | string, data: Record<string, any>) =>
    post(`/organizer/events/${eventId}/invitations`, data)
  const getInvitation = (eventId: number | string, id: number | string) =>
    get(`/organizer/events/${eventId}/invitations/${id}`)
  const resendInvitation = (eventId: number | string, id: number | string) =>
    post(`/organizer/events/${eventId}/invitations/${id}/resend`)
  const cancelInvitation = (eventId: number | string, id: number | string) =>
    post(`/organizer/events/${eventId}/invitations/${id}/cancel`)

  const getCheckinStats = (eventId: number | string) =>
    get(`/organizer/events/${eventId}/checkin/stats`)
  const getRecentScans = (eventId: number | string) =>
    get(`/organizer/events/${eventId}/checkin/recent-scans`)
  const verifyTicket = (eventId: number | string, code: string) =>
    post(`/organizer/events/${eventId}/checkin/verify`, { code })
  const getActiveSessions = (eventId: number | string) =>
    get(`/organizer/events/${eventId}/checkin/active-sessions`)
  const getScanTimeline = (eventId: number | string) =>
    get(`/organizer/events/${eventId}/checkin/scan-timeline`)

  const exportTickets = (eventId: number | string) =>
    get(`/organizer/events/${eventId}/tickets/export`)

  // Programs
  const getEventPrograms = (eventId: number | string) =>
    get(`/organizer/events/${eventId}/programs`)
  const createEventProgram = (eventId: number | string, data: any) =>
    post(`/organizer/events/${eventId}/programs`, data)
  const updateEventProgram = (eventId: number | string, programId: number | string, data: any) =>
    put(`/organizer/events/${eventId}/programs/${programId}`, data)
  const deleteEventProgram = (eventId: number | string, programId: number | string) =>
    del(`/organizer/events/${eventId}/programs/${programId}`)

  const createEventArtist = (eventId: number | string, body: any) =>
    post(`/organizer/events/${eventId}/artists`, body)

  const updateEventArtist = (eventId: number | string, artistId: number | string, data: any) =>
    put(`/organizer/events/${eventId}/artists/${artistId}`, data)
  const deleteEventArtist = (eventId: number | string, artistId: number | string) =>
    del(`/organizer/events/${eventId}/artists/${artistId}`)
  const getEventArtists = (eventId: number | string) =>
    get(`/organizer/events/${eventId}/artists`)

  const createEventFaq = (eventId: number | string, body: any) =>
    post(`/organizer/events/${eventId}/faqs`, body)

  const updateEventFaq = (eventId: number | string, faqId: number | string, data: any) =>
    put(`/organizer/events/${eventId}/faqs/${faqId}`, data)
  const deleteEventFaq = (eventId: number | string, faqId: number | string) =>
    del(`/organizer/events/${eventId}/faqs/${faqId}`)
  const getEventFaqs = (eventId: number | string) =>
    get(`/organizer/events/${eventId}/faqs`)

  const getFollowers = (params?: Record<string, unknown>) =>
    get('/organizer/followers', params)

  const getFollowersStats = () =>
    get('/organizer/followers/stats')

  return {
    getStats, getSalesByEvent, getPassMix, getRecentEvents, getRecentActivity, getSalesChart,
    getEvents, createEvent, getEvent, updateEvent, deleteEvent, publishEvent,
    getPasses, createPass, updatePass, deletePass,
    getParticipants, getParticipant, resendTicket, sendEmailToParticipant,
    getKyc, submitIdentity, submitDocument, resubmitKyc,
    getBalance, getTransactions,
    getWithdrawals, requestWithdrawal,
    getPromoCodes, createPromoCode, updatePromoCode, deletePromoCode, togglePromoCode,
    getCampaigns, createCampaign, updateCampaign, deleteCampaign, sendCampaign,
    getPdvs, createPdv, updatePdv, deletePdv, togglePdv, assignEventToPdv, removeEventFromPdv, recordPdvSale, getPdvStats,
    getProfile, updateProfile, getNotificationPrefs, updateNotificationPrefs,
    getPayoutMethods, addPayoutMethod, updatePayoutMethod, deletePayoutMethod, setDefaultPayoutMethod, getOperators,
    getPixels, updatePixels,
    getSupportTickets, createSupportTicket, getSupportTicket,
    getNotifications, getUnreadCount, markAsRead, markAllAsRead,
    getValidatorSessions, createValidatorSession, updateValidatorSession, deleteValidatorSession,
    exportTickets,
    getInvitations, createInvitation, getInvitation, resendInvitation, cancelInvitation,
    getCheckinStats, getRecentScans, getActiveSessions, getScanTimeline, verifyTicket,
    getEventPrograms, createEventProgram, updateEventProgram, deleteEventProgram,
    createEventArtist, updateEventArtist, deleteEventArtist, getEventArtists,
    createEventFaq, updateEventFaq, deleteEventFaq, getEventFaqs,
    getFollowers, getFollowersStats,
  }
}
