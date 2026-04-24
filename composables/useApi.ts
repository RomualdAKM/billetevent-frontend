export const useApi = () => {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBase as string

  const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    }

    if (import.meta.client) {
      const token = localStorage.getItem('auth_token')
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }
    }

    return headers
  }

  const handleError = (err: any) => {
    const status = err?.response?.status || err?.status

    if (status === 401) {
      if (import.meta.client) {
        const { error: notifyError } = useNotification()
        notifyError('Session expirée, veuillez vous reconnecter')
        localStorage.removeItem('auth_token')
        navigateTo('/auth/login')
      }
      throw err
    }

    if (status === 422) {
      const data = err?.response?._data || err?.data
      throw { status: 422, errors: data?.errors || {}, message: data?.message || 'Erreur de validation' }
    }

    if (status === 403) {
      const data = err?.response?._data || err?.data
      throw { status: 403, message: data?.message || 'Accès refusé', data }
    }

    if (status === 500) {
      const { error: notifyError } = useNotification()
      notifyError('Une erreur serveur est survenue. Veuillez réessayer.')
      throw err
    }

    throw err
  }

  const request = async <T = any>(url: string, options: any = {}): Promise<T> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)
    try {
      return await $fetch<T>(url, {
        baseURL,
        headers: { ...getHeaders(), ...options.headers },
        signal: controller.signal,
        ...options,
      })
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        const { error: notifyError } = useNotification()
        notifyError('La requête a expiré. Vérifiez votre connexion.')
        throw err
      }
      return handleError(err)
    } finally {
      clearTimeout(timeoutId)
    }
  }

  const get = <T = any>(url: string, params?: Record<string, any>) =>
    request<T>(url, { method: 'GET', params })

  const post = <T = any>(url: string, data?: any) =>
    request<T>(url, { method: 'POST', body: data })

  const put = <T = any>(url: string, data?: any) =>
    request<T>(url, { method: 'PUT', body: data })

  const patch = <T = any>(url: string, data?: any) =>
    request<T>(url, { method: 'PATCH', body: data })

  const del = <T = any>(url: string) =>
    request<T>(url, { method: 'DELETE' })

  return { get, post, put, patch, delete: del }
}
