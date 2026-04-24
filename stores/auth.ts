export const useAuthStore = defineStore('auth', () => {
  const user = ref<Record<string, unknown> | null>(null)
  const token = ref<string | null>(import.meta.client ? localStorage.getItem('auth_token') : null)
  const isInitializing = ref(true)
  const isLoggedIn = computed(() => !!token.value)
  const isOrganizer = computed(() => (user.value as Record<string, unknown>)?.role === 'organizer')
  const isAdmin = computed(() => (user.value as Record<string, unknown>)?.role === 'admin')

  // Promise partagée pour éviter les initialisations concurrentes
  let _initPromise: Promise<void> | null = null

  const fullName = computed(() => {
    if (!user.value) return ''
    const first = (user.value.first_name as string) || ''
    const last = (user.value.last_name as string) || ''
    return (first + ' ' + last).trim()
  })

  const userInitials = computed(() => {
    if (!user.value) return '?'
    const f = ((user.value.first_name as string) || '').charAt(0).toUpperCase()
    const l = ((user.value.last_name as string) || '').charAt(0).toUpperCase()
    return (f + l) || '?'
  })

  function setAuth(userData: Record<string, unknown>, authToken: string) {
    user.value = userData
    token.value = authToken
    if (import.meta.client) {
      localStorage.setItem('auth_token', authToken)
    }
  }

  function setUser(userData: Record<string, unknown>) {
    user.value = userData
  }

  function logout() {
    user.value = null
    token.value = null
    if (import.meta.client) {
      localStorage.removeItem('auth_token')
    }
  }

  async function fetchUser() {
    const { me } = useAuthApi()
    const response = await me()
    // L'API /auth/me retourne { user: { ... } }
    const raw = response as Record<string, unknown>
    user.value = (raw.user as Record<string, unknown>) ?? raw.data as Record<string, unknown> ?? raw
  }

  async function _doInitialize() {
    if (!token.value) {
      isInitializing.value = false
      return
    }
    try {
      await fetchUser()
    } catch (err: unknown) {
      const error = err as { response?: { status?: number }; status?: number }
      if (error?.response?.status === 401 || error?.status === 401) {
        logout()
      }
    } finally {
      isInitializing.value = false
    }
  }

  async function initialize() {
    if (!_initPromise) {
      _initPromise = _doInitialize()
    }
    return _initPromise
  }

  /** Attendre que l'initialisation soit terminée (utilisé par les middlewares) */
  async function waitForInit() {
    if (_initPromise) {
      await _initPromise
    } else if (isInitializing.value && import.meta.client) {
      // Le plugin n'a pas encore lancé initialize(), on le fait nous-mêmes
      await initialize()
    }
  }

  return { user, token, isInitializing, isLoggedIn, isOrganizer, isAdmin, fullName, userInitials, setAuth, setUser, logout, fetchUser, initialize, waitForInit }
})
