export const useAuthApi = () => {
  const { post, get } = useApi()

  const register = (data: { first_name: string; last_name: string; email: string; password: string; password_confirmation: string; accept_terms: boolean }) =>
    post('/auth/register', data)

  const login = (data: { email: string; password: string }) =>
    post('/auth/login', data)

  const logout = () =>
    post('/auth/logout')

  const verifyOtp = (data: { email: string; otp: string }) =>
    post<{ message: string; user: Record<string, unknown>; token: string }>('/auth/verify-otp', data)

  const resendOtp = (data: { email: string }) =>
    post('/auth/resend-otp', data)

  const forgotPassword = (data: { email: string }) =>
    post('/auth/forgot-password', data)

  const resetPassword = (data: { email: string; token: string; password: string; password_confirmation: string }) =>
    post('/auth/reset-password', data)

  const me = () =>
    get('/auth/me')

  const becomeOrganizer = () =>
    post('/auth/become-organizer')

  return { register, login, logout, verifyOtp, resendOtp, forgotPassword, resetPassword, me, becomeOrganizer }
}
