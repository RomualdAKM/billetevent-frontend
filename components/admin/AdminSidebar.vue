<template>
  <aside
    class="fixed top-0 left-0 bottom-0 z-[100] bg-surface border-r border-border-light flex flex-col overflow-hidden transition-all duration-250 ease-[cubic-bezier(.4,0,.2,1)]"
    :class="[
      collapsed ? 'w-16' : 'w-60',
      openMobile ? 'translate-x-0' : '-translate-x-60 lg:translate-x-0'
    ]"
  >
    <div class="px-5 pt-6 pb-5 flex items-center gap-2.5 bg-surface border-b border-border-light" :class="collapsed ? 'justify-center px-0' : ''">
      <div class="flex items-center justify-center shrink-0">
        <img src="/logo.png" alt="BilletEvent" class="block h-12 w-auto" :class="collapsed ? 'h-8' : ''" />
      </div>
      <span v-if="!collapsed" class="text-xs font-bold text-orange-primary uppercase tracking-wide">Admin</span>
    </div>
    <div v-if="!isMobile" class="flex justify-end px-3 py-1.5 bg-surface border-b border-border-light" :class="collapsed ? 'justify-center px-0' : ''">
      <button
        class="bg-orange-dim border border-border-medium rounded-md w-[26px] h-[26px] flex items-center justify-center cursor-pointer transition-colors duration-150"
        @click="$emit('toggleCollapse')"
      >
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
          class="text-orange-primary transition-transform duration-250"
          :class="collapsed ? 'rotate-180' : ''"
        ><polyline points="15 18 9 12 15 6"/><polyline points="21 18 15 12 21 6"/></svg>
      </button>
    </div>
    <div class="py-4 px-3 flex-1 overflow-y-auto">
      <div v-if="!collapsed" class="text-[0.62rem] font-bold tracking-[0.14em] uppercase text-text-tertiary px-2 mb-1">Administration</div>
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-2.5 py-[9px] px-2.5 rounded-lg text-sm font-medium text-text-secondary cursor-pointer transition-all duration-150 mb-0.5 hover:bg-surface-2 hover:text-text-primary"
        :class="[
          isActive(item.to) ? 'bg-orange-dim text-orange-primary' : '',
          collapsed ? 'justify-center px-2.5' : ''
        ]"
        @click="closeMobile"
      >
        <span class="text-base w-5 text-center shrink-0" :class="isActive(item.to) ? 'text-orange-primary' : ''" v-html="item.icon" />
        <span v-if="!collapsed" class="whitespace-nowrap">{{ item.label }}</span>
      </NuxtLink>
    </div>
    <div class="mt-auto p-3 border-t border-border-light flex flex-col gap-2">
      <div
        class="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-surface-2 transition-colors duration-150"
        :class="collapsed ? 'justify-center p-2' : ''"
      >
        <div class="w-8 h-8 rounded-full bg-blue-main text-white flex items-center justify-center text-[0.75rem] font-bold shrink-0">{{ adminInitials }}</div>
        <div v-if="!collapsed" class="min-w-0">
          <div class="text-sm font-semibold text-text-primary truncate">{{ adminName }}</div>
          <div class="text-[0.7rem] text-text-secondary">Admin</div>
        </div>
      </div>
      <button
        class="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-surface-2 transition-colors duration-150 hover:bg-surface-3 text-sm font-medium text-red-error cursor-pointer w-full"
        :class="collapsed ? 'justify-center p-2' : ''"
        @click="handleLogout"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        <span v-if="!collapsed">Se déconnecter</span>
      </button>
      <NuxtLink
        to="/"
        class="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-surface-2 transition-colors duration-150 hover:bg-surface-3 text-sm font-medium text-text-secondary"
        :class="collapsed ? 'justify-center p-2' : ''"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span v-if="!collapsed">Retour au site</span>
      </NuxtLink>
    </div>
  </aside>
</template>

<script setup>
const props = defineProps({
  collapsed: { type: Boolean, default: false },
  openMobile: { type: Boolean, default: false }
})

const emit = defineEmits(['toggleCollapse', 'closeMobile'])

const route = useRoute()
const authStore = useAuthStore()
const { logout: apiLogout } = useAuthApi()
const isMobile = ref(false)

const adminInitials = computed(() => {
  const u = authStore.user
  if (!u) return 'AD'
  const f = (u.first_name || '').charAt(0).toUpperCase()
  const l = (u.last_name || '').charAt(0).toUpperCase()
  return f + l || 'AD'
})

const adminName = computed(() => {
  const u = authStore.user
  if (!u) return 'Admin'
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email || 'Admin'
})

const handleLogout = async () => {
  try {
    await apiLogout()
  } catch (err) {
    console.error('Erreur déconnexion:', err)
  }
  authStore.logout()
  navigateTo('/auth/login')
}

const checkMobile = () => { isMobile.value = window.innerWidth < 1024 }

const isActive = (to) => {
  if (to === '/admin') return route.path === '/admin'
  return route.path.startsWith(to)
}

const closeMobile = () => { if (isMobile.value) emit('closeMobile') }

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>' },
  { to: '/admin/fees', label: 'Frais & Commissions', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' },
  { to: '/admin/payment-methods', label: 'Méthodes de paiement', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' },
  { to: '/admin/kyc', label: 'Vérifications KYC', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' },
  { to: '/admin/withdrawals', label: 'Demandes de retrait', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><circle cx="18" cy="15" r="1"/></svg>' },
  { to: '/admin/users', label: 'Utilisateurs', icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' },
]
</script>
