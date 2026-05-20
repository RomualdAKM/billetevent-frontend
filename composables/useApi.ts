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
      // Distinguish bad credentials (login/register/verify) from expired
      // session (every other authenticated endpoint). For auth attempts the
      // caller will display its own message ("Email ou mot de passe incorrect")
      // — we must NOT show "Session expirée" or boot them to /auth/login.
      const requestUrl = String(err?.request || err?.response?.url || '')
      const isAuthAttempt = /\/auth\//.test(requestUrl)

      if (!isAuthAttempt && import.meta.client) {
        const { error: notifyError } = useNotification()
        notifyError('Session expirée, veuillez vous reconnecter')
        localStorage.removeItem('auth_token')
        const { stripSensitiveQuery } = useSafeRedirect()
        const currentPath = stripSensitiveQuery(window.location.pathname + window.location.search)
        const target: { path: string; query?: Record<string, string> } = { path: '/auth/login' }
        if (currentPath && !currentPath.startsWith('/auth/')) {
          target.query = { redirect: currentPath }
        }
        navigateTo(target)
      }
      // Normalise the error so callers see the backend message, not the raw
      // fetch error (which has `message = '[POST] "https://..." 401'`).
      const data = err?.response?._data || err?.data
      throw { status: 401, message: data?.message || 'Identifiants invalides', data }
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
      const data = err?.response?._data || err?.data
      throw { status: 500, message: data?.message || 'Erreur serveur', data }
    }

    // Any other status: normalise to hide the raw fetch error (which embeds
    // the URL in .message). Default to a clean French message if backend
    // didn't provide one.
    const data = err?.response?._data || err?.data
    throw {
      status: status || 0,
      message: data?.message || 'Une erreur est survenue. Veuillez réessayer.',
      data,
    }
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
        // Normalised shape so callers never see the raw fetch URL in .message
        throw { status: 0, message: 'La requête a expiré. Vérifiez votre connexion.' }
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

  const del = <T = any>(url: string, data?: any) =>
    request<T>(url, { method: 'DELETE', body: data })

  return { get, post, put, patch, delete: del }
}
