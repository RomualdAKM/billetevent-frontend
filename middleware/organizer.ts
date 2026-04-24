export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()

  // Côté serveur : pas de localStorage → laisser passer, le client gère
  if (import.meta.server) {
    return
  }

  // Côté client : attendre que l'initialisation auth soit terminée
  if (authStore.isInitializing) {
    await authStore.waitForInit()
  }

  // Vérifier l'authentification avec fallback localStorage
  if (!authStore.isLoggedIn) {
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      authStore.token = storedToken
      try {
        await authStore.fetchUser()
      } catch {
        authStore.logout()
        return navigateTo('/auth/login')
      }
    } else {
      return navigateTo('/auth/login')
    }
  }

  // Vérifier le rôle organisateur ou admin
  if (authStore.isOrganizer || authStore.isAdmin) {
    return
  }

  // Tenter de devenir organisateur
  try {
    const { becomeOrganizer } = useAuthApi()
    const response = await becomeOrganizer()
    const userData = response?.data?.user ?? response?.user
    if (userData) {
      authStore.setUser(userData)
    }
  } catch {
    return navigateTo('/account')
  }
})
