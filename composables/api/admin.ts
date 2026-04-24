export const useAdminApi = () => {
  const { get, put, post } = useApi()

  const getOverview = () =>
    get('/admin/dashboard/overview')

  const getRevenueByMethod = () =>
    get('/admin/dashboard/revenue-by-method')

  const getRevenueByCountry = () =>
    get('/admin/dashboard/revenue-by-country')

  const getPendingPayouts = () =>
    get('/admin/dashboard/pending-payouts')

  const getFees = () =>
    get('/admin/fees')

  const updateFee = (id: number | string, data: Record<string, unknown>) =>
    put(`/admin/fees/${id}`, data)

  const getPaymentMethods = () =>
    get('/admin/payment-methods')

  const togglePaymentMethod = (id: number | string) =>
    post(`/admin/payment-methods/${id}/toggle`)

  const getPendingKyc = () =>
    get('/admin/kyc/pending')

  const getKycDetail = (id: number | string) =>
    get(`/admin/kyc/${id}`)

  const reviewKyc = (id: number | string, data: Record<string, unknown>) =>
    post(`/admin/kyc/${id}/review`, data)

  const getPendingWithdrawals = () =>
    get('/admin/withdrawals/pending')

  const getAllWithdrawals = () =>
    get('/admin/withdrawals')

  const processWithdrawal = (id: number | string, data: Record<string, unknown>) =>
    post(`/admin/withdrawals/${id}/process`, data)

  const getUsers = (params?: Record<string, unknown>) =>
    get('/admin/users', params)

  const getUser = (id: number | string) =>
    get(`/admin/users/${id}`)

  const toggleBlockUser = (id: number | string) =>
    post(`/admin/users/${id}/toggle-block`)

  return {
    getOverview, getRevenueByMethod, getRevenueByCountry, getPendingPayouts,
    getFees, updateFee,
    getPaymentMethods, togglePaymentMethod,
    getPendingKyc, getKycDetail, reviewKyc,
    getPendingWithdrawals, getAllWithdrawals, processWithdrawal,
    getUsers, getUser, toggleBlockUser,
  }
}
