<script setup lang="ts">
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const { getUnreadCount } = useOrganizerApi()
const { logout: apiLogout } = useAuthApi()
const route = useRoute()

const mobileMenuOpen = ref(false)
const dropdownOpen = ref(false)
const dropdownRef = ref(null)
const loggingOut = ref(false)

const navLinks = [
  { label: 'Accueil', to: '/' },
  { label: 'Événements', to: '/events' },
  { label: 'À propos', to: '/about' },
  { label: 'Tarifs', to: '/pricing' },
  // { label: 'FAQ', to: '/faq' },
  { label: 'Contact', to: '/contact' },
]

const isLinkActive = (to: string) => {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}

watch(() => route.path, () => {
  dropdownOpen.value = false
  mobileMenuOpen.value = false
})

const logout = async () => {
  if (loggingOut.value) return
  loggingOut.value = true
  dropdownOpen.value = false
  try {
    await apiLogout()
  } catch (err) {
    console.error('Erreur déconnexion:', err)
  }
  authStore.logout()
  notificationStore.reset()
  loggingOut.value = false
  navigateTo('/auth/login')
}

const fetchNotifications = async () => {
  if (!authStore.isLoggedIn) return
  try {
    const res = await getUnreadCount()
    notificationStore.setUnreadCount(res?.data?.count ?? res?.count ?? 0)
  } catch (err) {
    console.error('Erreur chargement notifications:', err)
  }
}

const onClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !(dropdownRef.value as HTMLElement).contains(e.target as Node)) {
    dropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
  fetchNotifications()
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<template>
  <nav class="sticky top-0 z-[200] bg-bg-primary/92 backdrop-blur-[20px] border-b border-border-light px-5 md:px-10 h-16 flex items-center justify-between">
    <NuxtLink to="/" class="flex items-center gap-2.5 font-sans text-[1.15rem] font-bold text-text-primary tracking-tight">
      <img src="/logo.png" alt="BilletEvent" class="h-14 w-auto" />
    </NuxtLink>

    <div class="flex items-center gap-2.5">
      <ul class="hidden md:flex gap-9 list-none">
        <li v-for="link in navLinks" :key="link.label">
          <NuxtLink :to="link.to" :class="isLinkActive(link.to) ? 'text-sm font-medium text-orange-primary tracking-wide transition-colors duration-200' : 'text-sm font-medium text-text-secondary tracking-wide hover:text-orange-primary transition-colors duration-200'">{{ link.label }}</NuxtLink>
        </li>
      </ul>

      <div class="hidden md:block w-px h-5 bg-border-medium shrink-0"></div>

      <template v-if="authStore.isInitializing">
        <div class="hidden md:block w-20 h-9 rounded-full bg-surface-2 animate-pulse"></div>
      </template>

      <template v-else-if="!authStore.isLoggedIn">
        <NuxtLink to="/auth/login" class="hidden md:inline-flex bg-transparent border border-border-light text-text-primary px-5 py-2 rounded-full text-sm font-bold transition-all duration-200 hover:border-orange-primary hover:text-orange-primary whitespace-nowrap">
          Se connecter
        </NuxtLink>

        <NuxtLink to="/auth/register" class="hidden md:inline-flex bg-orange-primary text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-200 hover:bg-orange-light whitespace-nowrap">
          S'inscrire
        </NuxtLink>
      </template>

      <div v-if="authStore.isLoggedIn" class="hidden md:block relative" ref="dropdownRef">
        <div class="flex items-center gap-3">
          <NuxtLink to="/dashboard/notifications" class="relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-text-secondary hover:text-orange-primary transition-colors duration-200"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span v-if="notificationStore.unreadCount > 0" class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{{ notificationStore.unreadCount > 9 ? '9+' : notificationStore.unreadCount }}</span>
          </NuxtLink>
          <button
            class="flex items-center gap-2 cursor-pointer"
            @click="dropdownOpen = !dropdownOpen"
          >
          <div class="w-9 h-9 rounded-full bg-blue-main text-white flex items-center justify-center text-[0.75rem] font-bold">
            {{ authStore.userInitials }}
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-text-secondary transition-transform duration-200" :class="dropdownOpen ? 'rotate-180' : ''">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        </div>
        <Transition name="dropdown">
          <div
            v-if="dropdownOpen"
            class="absolute right-0 top-full mt-2 w-52 bg-surface border border-border-light rounded-xl z-50 overflow-hidden py-1"
          >
            <NuxtLink
              to="/dashboard"
              class="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors duration-150"
              @click="dropdownOpen = false"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              Dashboard organisateur
            </NuxtLink>
            <NuxtLink
              to="/account/tickets"
              class="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors duration-150"
              @click="dropdownOpen = false"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>
              Mes billets
            </NuxtLink>
            <NuxtLink
              v-if="authStore.isAdmin"
              to="/admin"
              class="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors duration-150"
              @click="dropdownOpen = false"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Administration
            </NuxtLink>
            <div class="border-t border-border-light my-1"></div>
            <button
              class="flex items-center gap-3 px-4 py-2.5 text-sm text-red-error hover:bg-red-dim transition-colors duration-150 w-full cursor-pointer"
              @click="logout"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Déconnexion
            </button>
          </div>
        </Transition>
      </div>

      <button
        class="flex md:hidden w-9 h-9 bg-surface-2 rounded-lg items-center justify-center"
        @click="mobileMenuOpen = !mobileMenuOpen"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
    </div>

    <LayoutMobileMenu :open="mobileMenuOpen" :links="navLinks" @close="mobileMenuOpen = false" />
  </nav>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
