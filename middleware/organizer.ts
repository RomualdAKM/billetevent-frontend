export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  // Côté serveur : pas de localStorage → laisser passer, le client gère
  if (import.meta.server) {
    return
  }

  // Côté client : attendre que l'initialisation auth soit terminée
  if (authStore.isInitializing) {
    await authStore.waitForInit()
  }

  const { stripSensitiveQuery } = useSafeRedirect()
  const loginRedirect = () => navigateTo({
    path: '/auth/login',
    query: { redirect: stripSensitiveQuery(to.fullPath) },
  })

  // Vérifier l'authentification avec fallback localStorage
  if (!authStore.isLoggedIn) {
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      authStore.token = storedToken
      try {
        await authStore.fetchUser()
      } catch {
        authStore.logout()
        return loginRedirect()
      }
    } else {
      return loginRedirect()
    }
  }

  // Vérifier le rôle organisateur ou admin
  if (authStore.isOrganizer || authStore.isAdmin) {
    return
  }

  // RGPD / UX fix : ne plus élever silencieusement le buyer en organizer.
  // L'élévation silencieuse changeait le rôle (avec CGU différentes) sans
  // consentement explicite. On envoie l'utilisateur vers une page dédiée
  // /dashboard/devenir-organisateur où il accepte explicitement les CGU
  // organisateur avant d'être élevé.
  if (to.path !== '/dashboard/devenir-organisateur') {
    return navigateTo({
      path: '/dashboard/devenir-organisateur',
      query: { redirect: to.fullPath },
    })
  }
})
