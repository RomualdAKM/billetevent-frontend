export default defineNuxtRouteMiddleware((to) => {
  const { isLoggedIn } = useAuthStore()
  if (isLoggedIn) {
    const { getSafeRedirect } = useSafeRedirect()
    return navigateTo(getSafeRedirect(to.query.redirect))
  }
})
