export default defineNuxtRouteMiddleware(async (to) => {
  const authStore = useAuthStore()

  // Wait for the auth init to finish before deciding. A token in localStorage
  // means "maybe logged in" — we only know for sure once the /auth/me call
  // resolves (either user loaded or 401 + logout). Without this wait, a stale
  // token bounces visitors away from /auth/login/forgot-password and back to
  // /dashboard, which then itself redirects to login — visible flash.
  if (import.meta.client && authStore.isInitializing) {
    await authStore.waitForInit()
  }

  // Now isLoggedIn is reliable: token present AND user loaded
  if (authStore.isLoggedIn && authStore.user) {
    const { getSafeRedirect } = useSafeRedirect()
    return navigateTo(getSafeRedirect(to.query.redirect))
  }
})
