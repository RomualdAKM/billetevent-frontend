export default defineNuxtPlugin(async () => {
  const authStore = useAuthStore()
  try {
    await authStore.initialize()
  } catch (_) {
    authStore.logout()
  }
})
