<script setup lang="ts">
const props = defineProps({
  open: { type: Boolean, default: false },
  links: { type: Array, default: () => [] },
})

const emit = defineEmits(['close'])

const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const { logout: apiLogout } = useAuthApi()
const loggingOut = ref(false)

const handleLogout = async () => {
  if (loggingOut.value) return
  loggingOut.value = true
  try {
    await apiLogout()
  } catch (err) {
    console.error('Erreur déconnexion:', err)
  }
  authStore.logout()
  notificationStore.reset()
  loggingOut.value = false
  emit('close')
  navigateTo('/auth/login')
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="fixed inset-0 z-[500] bg-black/50 md:hidden" @click="emit('close')">
        <div
          class="absolute inset-0 bg-white overflow-y-auto flex flex-col"
          @click.stop
        >
          <div class="flex items-center justify-between px-6 py-5 border-b border-border-light">
            <NuxtLink to="/" class="flex items-center gap-2" @click="emit('close')">
              <NuxtImg src="/logo.png" alt="BilletEvent" class="h-10 w-auto" :width="40" :height="40" />
            </NuxtLink>
            <button type="button" aria-label="Fermer le menu" class="w-9 h-9 rounded-lg bg-surface-2 flex items-center justify-center" @click="emit('close')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div class="flex flex-col gap-1 px-4 pt-4">
            <NuxtLink
              v-for="link in links"
              :key="link.label"
              :to="link.to"
              class="text-base font-medium text-text-secondary px-4 py-3.5 rounded-lg hover:bg-surface-2 hover:text-text-primary transition-all duration-150"
              @click="emit('close')"
            >
              {{ link.label }}
            </NuxtLink>
          </div>

          <div class="mt-auto px-6 pt-6 pb-8 border-t border-border-light flex flex-col gap-3">
          <template v-if="!authStore.isLoggedIn">
            <NuxtLink
              to="/auth/login"
              class="flex items-center justify-center border border-border-light text-text-primary w-full py-3 rounded-full text-sm font-bold transition-all duration-200 hover:border-orange-primary hover:text-orange-primary"
              @click="emit('close')"
            >
              Se connecter
            </NuxtLink>
            <NuxtLink
              to="/auth/register"
              class="flex items-center justify-center bg-orange-primary text-white w-full py-3 rounded-full text-sm font-bold transition-all duration-200 hover:bg-orange-light"
              @click="emit('close')"
            >
              S'inscrire
            </NuxtLink>
          </template>
          <template v-else>
            <NuxtLink
              to="/dashboard"
              class="flex items-center gap-3 text-sm font-medium text-text-secondary px-4 py-3 rounded-lg hover:bg-surface-2 hover:text-text-primary transition-all duration-150"
              @click="emit('close')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              Dashboard organisateur
            </NuxtLink>
            <NuxtLink
              to="/account/tickets"
              class="flex items-center gap-3 text-sm font-medium text-text-secondary px-4 py-3 rounded-lg hover:bg-surface-2 hover:text-text-primary transition-all duration-150"
              @click="emit('close')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>
              Mes billets
            </NuxtLink>
            <NuxtLink
              v-if="authStore.isAdmin"
              to="/admin"
              class="flex items-center gap-3 text-sm font-medium text-text-secondary px-4 py-3 rounded-lg hover:bg-surface-2 hover:text-text-primary transition-all duration-150"
              @click="emit('close')"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Administration
            </NuxtLink>
            <div class="border-t border-border-light my-1"></div>
            <button
              class="flex items-center gap-3 text-sm font-medium text-red-error px-4 py-3 rounded-lg hover:bg-red-dim transition-all duration-150 w-full cursor-pointer"
              @click="handleLogout"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Déconnexion
            </button>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
