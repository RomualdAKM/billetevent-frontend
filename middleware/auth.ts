export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()

  // Côté serveur : pas de localStorage, on ne peut pas vérifier → on laisse passer
  // Le client prendra le relais après hydratation
  if (import.meta.server) {
    return
  }

  // Côté client : attendre que l'initialisation auth soit terminée
  if (authStore.isInitializing) {
    await authStore.waitForInit()
  }

  // Fallback : si le store est vide mais qu'un token existe dans localStorage
  if (!authStore.isLoggedIn) {
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      // Restaurer le token dans le store et tenter de récupérer l'utilisateur
      authStore.token = storedToken
      try {
        await authStore.fetchUser()
        return // Utilisateur restauré, on continue
      } catch {
        authStore.logout()
        return navigateTo('/auth/login')
      }
    }
    return navigateTo('/auth/login')
  }
})
