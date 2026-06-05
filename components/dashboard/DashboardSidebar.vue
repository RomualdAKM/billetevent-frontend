<template>
  <aside
    class="fixed top-0 left-0 bottom-0 z-[100] bg-surface flex flex-col overflow-hidden transition-all duration-250 ease-[cubic-bezier(.4,0,.2,1)]"
    :class="[
      collapsed ? 'w-16' : 'w-60',
      openMobile
        ? 'translate-x-0'
        : '-translate-x-60 lg:translate-x-0'
    ]"
  >
    <!-- Logo -->
    <div
      class="flex items-center border-b border-border-light bg-surface transition-all duration-300"
      :class="collapsed ? 'justify-center px-2 pt-5 pb-4' : 'px-5 pt-6 pb-5 justify-center'"
    >
      <img
        src="/logo.png"
        alt="BilletEvent"
        class="block transition-all duration-300"
        :class="collapsed ? 'h-8 w-auto' : 'w-36 h-auto'"
      />
    </div>

    <!-- Collapse toggle (desktop only) -->
    <div
      v-if="!isMobile"
      class="flex border-b border-border-light bg-surface transition-all duration-300"
      :class="collapsed ? 'justify-center px-0 py-1.5' : 'justify-end px-3 py-1.5'"
    >
      <button
        class="bg-orange-dim border border-border-medium rounded-md w-7 h-7 flex items-center justify-center cursor-pointer transition-colors duration-150 hover:bg-orange-primary/15"
        @click="$emit('toggleCollapse')"
        :title="collapsed ? 'Étendre' : 'Réduire'"
      >
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
          class="text-orange-primary transition-transform duration-300"
          :class="collapsed ? 'rotate-180' : ''"
        >
          <polyline points="15 18 9 12 15 6" />
          <polyline points="21 18 15 12 21 6" />
        </svg>
      </button>
    </div>

    <!-- Navigation scrollable -->
    <nav class="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-thin">
      <!-- Grouped navigation -->
      <template v-for="(group, gIdx) in navGroups" :key="gIdx">
        <div class="px-3" :class="gIdx > 0 ? 'mt-5' : ''">
          <div
            v-if="!collapsed && group.title"
            class="text-xs font-medium tracking-wider uppercase text-text-tertiary px-2.5 mb-1.5 select-none"
          >
            {{ group.title }}
          </div>
          <div v-else-if="collapsed && gIdx > 0" class="mx-2 mb-2 mt-1">
            <div class="h-px bg-border-light" />
          </div>
          <NuxtLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="group flex items-center gap-2.5 py-1.5 px-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors duration-150 mb-px"
            :class="[
              isActive(item.to)
                ? 'bg-orange-dim text-orange-primary'
                : 'text-text-secondary hover:bg-surface-2/50 hover:text-text-primary',
              collapsed ? 'justify-center px-2' : ''
            ]"
            :title="collapsed ? item.label : undefined"
            @click="closeMobile"
          >
            <span
              class="w-5 h-5 flex items-center justify-center shrink-0 transition-colors duration-150"
              :class="isActive(item.to) ? 'text-orange-primary' : 'text-text-tertiary group-hover:text-text-secondary'"
              v-html="item.icon"
            />
            <span v-if="!collapsed" class="whitespace-nowrap truncate">{{ item.label }}</span>
            <span
              v-if="item.badge && !collapsed"
              class="ml-auto bg-orange-primary text-white text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full leading-none"
            >
              {{ item.badge }}
            </span>
            <span
              v-if="item.kycBadge && !collapsed && kycBadge"
              :class="['ml-auto rounded-full w-[18px] h-[18px] inline-flex items-center justify-center text-[0.65rem] font-extrabold shrink-0 border', kycBadge.classes]"
              :aria-label="kycBadge.ariaLabel"
              :title="kycBadge.ariaLabel"
            >
              {{ kycBadge.label }}
            </span>
          </NuxtLink>
        </div>
      </template>
    </nav>

    <!-- Account menu (bottom) -->
    <div class="p-3 border-t border-border-light relative" ref="accountRef">
      <div
        class="flex items-center gap-2.5 rounded-xl cursor-pointer transition-colors duration-150 hover:bg-surface-3/70"
        :class="collapsed ? 'justify-center p-2' : 'p-2.5 bg-surface-2/60'"
        @click="accountMenuOpen = !accountMenuOpen"
      >
        <div
          class="w-8 h-8 rounded-full bg-gradient-to-br from-orange-primary to-orange-light flex items-center justify-center text-[0.8rem] font-bold text-white shrink-0 ring-2 ring-surface"
        >
          {{ userInitials }}
        </div>
        <template v-if="!collapsed">
          <div class="min-w-0 flex-1">
            <div class="text-sm font-semibold text-text-primary truncate max-w-[130px]">{{ userName }}</div>
            <div class="text-[0.68rem] text-text-tertiary">Organisateur</div>
          </div>
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
            class="text-text-tertiary shrink-0 transition-transform duration-200"
            :class="accountMenuOpen ? 'rotate-180' : ''"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </template>
      </div>

      <!-- Popup menu -->
      <Transition name="popup">
        <div
          v-if="accountMenuOpen"
          class="absolute bottom-full left-3 right-3 mb-2 bg-surface border border-border-light rounded-xl overflow-hidden z-50"
          style="box-shadow: var(--shadow-card)"
        >
          <NuxtLink
            to="/account"
            class="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors duration-150 cursor-pointer"
            @click="accountMenuOpen = false; closeMobile()"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Espace acheteur
          </NuxtLink>
          <NuxtLink
            to="/dashboard/settings"
            class="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors duration-150 cursor-pointer"
            @click="accountMenuOpen = false; closeMobile()"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            Paramètres organisateur
          </NuxtLink>
          <NuxtLink
            to="/"
            class="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-text-secondary hover:bg-surface-2 hover:text-text-primary transition-colors duration-150 cursor-pointer"
            @click="accountMenuOpen = false; closeMobile()"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Retour au site
          </NuxtLink>
          <div class="h-px bg-border-light mx-3" />
          <button
            class="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-red-error hover:bg-red-dim transition-colors duration-150 cursor-pointer w-full text-left"
            @click="showLogoutConfirm = true; accountMenuOpen = false"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Se déconnecter
          </button>
        </div>
      </Transition>
    </div>

    <!-- Logout confirm -->
    <UiConfirmModal
      :is-open="showLogoutConfirm"
      title="Se déconnecter"
      message="Êtes-vous sûr de vouloir vous déconnecter de votre compte ?"
      confirm-text="Se déconnecter"
      cancel-text="Annuler"
      variant="danger"
      @confirm="handleLogout"
      @cancel="showLogoutConfirm = false"
    />
  </aside>
</template>

<script setup lang="ts">
const props = defineProps({
  collapsed: { type: Boolean, default: false },
  openMobile: { type: Boolean, default: false }
})

const emit = defineEmits(['toggleCollapse', 'closeMobile'])

const route = useRoute()
const { success } = useNotification()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const { logout: apiLogout } = useAuthApi()
const isMobile = ref(false)
const accountMenuOpen = ref(false)
const showLogoutConfirm = ref(false)
const accountRef = ref<HTMLElement | null>(null)

const userInitials = computed(() => {
  const u = authStore.user
  if (!u) return '?'
  const f = (u.first_name || '').charAt(0).toUpperCase()
  const l = (u.last_name || '').charAt(0).toUpperCase()
  return f + l || '?'
})

const userName = computed(() => {
  const u = authStore.user
  if (!u) return ''
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email || ''
})

const checkMobile = () => { isMobile.value = window.innerWidth < 1024 }

const isActive = (to: string) => {
  if (to === '/dashboard') return route.path === '/dashboard'
  return route.path.startsWith(to)
}

const closeMobile = () => { if (isMobile.value) emit('closeMobile') }

const handleLogout = async () => {
  showLogoutConfirm.value = false
  try {
    await apiLogout()
  } catch (err) {
    console.error('Erreur déconnexion:', err)
  }
  authStore.logout()
  notificationStore.reset()
  success('Déconnexion réussie')
  navigateTo('/auth/login')
}

const onClickOutsideAccount = (e: MouseEvent) => {
  if (accountRef.value && !accountRef.value.contains(e.target as Node)) {
    accountMenuOpen.value = false
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  document.addEventListener('click', onClickOutsideAccount)
  if (authStore.user) loadEventCount()
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  document.removeEventListener('click', onClickOutsideAccount)
})

const eventCount = ref<number | null>(null)

// KYC badge in the sidebar — color/label reflects the current status so the
// organiser can see at a glance what to do next.
const kycBadge = computed<{ classes: string; label: string; ariaLabel: string } | null>(() => {
  const status = (authStore.user as Record<string, unknown> | null)?.kyc_status as string | undefined
  if (status === 'validated') return null
  if (status === 'submitted' || status === 'in_review') {
    return {
      classes: 'bg-blue-dim text-blue-light border-blue-light/20',
      label: '⏱',
      ariaLabel: 'Vérification en cours',
    }
  }
  if (status === 'rejected') {
    return {
      classes: 'bg-red-dim text-red-error border-red-error/20',
      label: '✗',
      ariaLabel: 'Vérification refusée',
    }
  }
  // Default: pending / not started
  return {
    classes: 'bg-gold-dim text-gold border-gold/20',
    label: '!',
    ariaLabel: 'Vérification à compléter',
  }
})

const loadEventCount = async () => {
  try {
    const { getEvents } = useOrganizerApi()
    const res = await getEvents()
    const data = res?.data ?? res
    eventCount.value = Array.isArray(data) ? data.length : 0
  } catch {
    eventCount.value = null
  }
}

// Icons constants
const icons = {
  overview: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
  events: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  tickets: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="9" y1="9" x2="9" y2="15"/></svg>',
  participants: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  checkin: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10"/></svg>',
  wallet: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 10h20"/><circle cx="18" cy="15" r="1"/></svg>',
  promo: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>',
  pdv: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  invitations: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
  followers: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  campaigns: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  kyc: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>',
  settings: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  support: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  notifications: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>'
}

const navGroups = computed(() => [
  {
    title: '',
    items: [
      { to: '/dashboard', label: "Vue d'ensemble", icon: icons.overview }
    ]
  },
  {
    title: 'Gestion des événements',
    items: [
      { to: '/dashboard/events', label: 'Mes événements', badge: eventCount.value !== null ? String(eventCount.value) : null, icon: icons.events },
      { to: '/dashboard/tickets', label: 'Billets & Ventes', icon: icons.tickets },
      { to: '/dashboard/participants', label: 'Participants', icon: icons.participants },
      { to: '/dashboard/checkin', label: 'Scan & Check-in', icon: icons.checkin }
    ]
  },
  {
    title: 'Revenus & finances',
    items: [
      { to: '/dashboard/wallet', label: 'Portefeuille', icon: icons.wallet },
      { to: '/dashboard/promo-codes', label: 'Codes promo', icon: icons.promo },
      { to: '/dashboard/pdv', label: 'Mes revendeurs', icon: icons.pdv }
    ]
  },
  {
    title: 'Marketing & audience',
    items: [
      { to: '/dashboard/invitations', label: 'Invitations', icon: icons.invitations },
      { to: '/dashboard/followers', label: 'Abonnés', icon: icons.followers },
      { to: '/dashboard/marketing', label: 'Campagnes', icon: icons.campaigns }
    ]
  },
  {
    title: 'Compte',
    items: [
      { to: '/dashboard/notifications', label: 'Notifications', icon: icons.notifications },
      { to: '/dashboard/kyc', label: 'Vérification KYC', kycBadge: true, icon: icons.kyc },
      { to: '/dashboard/settings', label: 'Paramètres', icon: icons.settings },
      { to: '/dashboard/support', label: 'Support', icon: icons.support }
    ]
  }
])
</script>

<style scoped>
.popup-enter-active,
.popup-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateY(6px) scale(0.97);
}

/* Custom thin scrollbar for nav */
.scrollbar-thin::-webkit-scrollbar {
  width: 3px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: var(--color-border-light);
  border-radius: 3px;
}
</style>
