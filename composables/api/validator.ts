export const useValidatorApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase as string

  const getToken = (): string | null => {
    if (import.meta.client) {
      return localStorage.getItem('validator_token')
    }
    return null
  }

  const request = async <T = any>(url: string, options: any = {}): Promise<T> => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...options.headers,
    }

    const token = getToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return await $fetch<T>(url, {
      baseURL,
      headers,
      ...options,
    })
  }

  const login = (data: { session_code: string; access_code: string }) =>
    request('/validator/login', { method: 'POST', body: data })

  const scan = (data: { qr_data: string }) =>
    request('/validator/scan', { method: 'POST', body: data })

  const search = (params: { query: string }) =>
    request('/validator/search', { method: 'GET', params })

  const manualValidate = (data: { ticket_reference: string }) =>
    request('/validator/validate', { method: 'POST', body: data })

  const getStats = () =>
    request('/validator/stats', { method: 'GET' })

  return { login, scan, search, manualValidate, getStats }
}
