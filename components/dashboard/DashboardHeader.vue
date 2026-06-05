<template>
  <header
    class="h-[68px] flex items-center justify-between px-5 sm:px-6 md:px-8 gap-3 bg-surface sticky top-0 z-50 transition-shadow duration-300"
    style="box-shadow: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)"
  >
    <!-- Left: menu mobile + titre -->
    <div class="flex items-center gap-3 min-w-0 flex-1">
      <button
        type="button"
        aria-label="Ouvrir le menu"
        class="flex lg:hidden w-10 h-10 rounded-xl bg-surface-2 border border-border-light items-center justify-center cursor-pointer transition-all duration-150 hover:bg-surface-3 hover:border-border-medium active:scale-95"
        @click="$emit('toggleSidebar')"
        title="Menu"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-text-primary">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>
      <div class="min-w-0">
        <h1 class="font-serif text-[1.15rem] whitespace-nowrap overflow-hidden text-ellipsis text-text-primary leading-tight">
          {{ pageTitle }}
        </h1>
      </div>
    </div>

    <!-- Right: actions desktop -->
    <div class="hidden md:flex items-center gap-2.5 shrink-0">
      <!-- Notifications -->
      <div class="relative" ref="notifRef">
        <button
          type="button"
          :aria-label="unreadCount > 0 ? `Notifications (${unreadCount} non lues)` : 'Notifications'"
          :aria-expanded="notifOpen"
          class="w-10 h-10 rounded-xl bg-surface-2 border border-border-light flex items-center justify-center cursor-pointer relative transition-all duration-150 hover:border-border-medium hover:bg-surface-3"
          @click="notifOpen = !notifOpen"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-text-secondary">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <div
            v-if="unreadCount > 0"
            class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-primary ring-2 ring-surface"
          />
        </button>
        <Transition name="dropdown">
          <div
            v-if="notifOpen"
            class="absolute right-0 top-full mt-2 w-[90vw] max-w-[380px] bg-surface border border-border-light rounded-xl z-50 overflow-hidden"
            style="box-shadow: var(--shadow-card)"
          >
            <div class="flex items-center justify-between px-4 py-3.5 border-b border-border-light">
              <span class="text-sm font-semibold text-text-primary">Notifications</span>
              <span
                v-if="unreadCount > 0"
                class="bg-orange-primary text-white text-[0.65rem] font-bold px-1.5 py-0.5 rounded-full leading-none"
              >
                {{ unreadCount }}
              </span>
            </div>
            <div class="max-h-[360px] overflow-y-auto">
              <div
                v-for="notif in notifications"
                :key="notif.id"
                class="flex items-start gap-3 px-4 py-3.5 border-b border-border-light/60 last:border-b-0 transition-colors duration-150 hover:bg-surface-2/60 cursor-pointer"
                :class="!notif.read ? 'bg-orange-dim/30' : ''"
              >
                <div
                  class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs"
                  :class="notif.iconBg"
                >
                  <span v-html="notif.icon" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="text-sm text-text-primary leading-snug">{{ notif.text }}</div>
                  <div class="text-[0.68rem] text-text-tertiary mt-1">{{ notif.time }}</div>
                </div>
                <div v-if="!notif.read" class="w-2 h-2 rounded-full bg-orange-primary shrink-0 mt-1.5" />
              </div>
              <div
                v-if="notifications.length === 0"
                class="px-4 py-8 text-center text-sm text-text-tertiary"
              >
                Aucune notification
              </div>
            </div>
            <div class="px-4 py-3 border-t border-border-light">
              <button
                class="w-full text-center text-xs font-semibold text-orange-primary hover:text-orange-light transition-colors duration-150 cursor-pointer"
                @click="markAllRead"
              >
                Tout marquer comme lu
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <!-- Mes pages -->
      <NuxtLink
        to="/dashboard/events"
        class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border-light text-text-secondary bg-surface hover:bg-surface-2 hover:text-text-primary hover:border-border-medium transition-all duration-150"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>Mes pages</span>
      </NuxtLink>

      <!-- Nouvel événement -->
      <NuxtLink
        to="/dashboard/events/create"
        class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-orange-primary text-white hover:bg-orange-light transition-all duration-150"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        <span>Nouvel événement</span>
      </NuxtLink>
    </div>

    <!-- Right: actions mobile -->
    <div class="flex md:hidden items-center gap-2">
      <!-- Notifications mobile -->
      <NuxtLink
        to="/dashboard/notifications"
        class="w-10 h-10 rounded-xl bg-surface-2 border border-border-light flex items-center justify-center relative"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-text-secondary">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        <div
          v-if="unreadCount > 0"
          class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-primary ring-2 ring-surface"
        />
      </NuxtLink>

      <!-- Nouvel événement mobile (icon only) -->
      <NuxtLink
        to="/dashboard/events/create"
        class="w-10 h-10 rounded-xl bg-orange-primary text-white flex items-center justify-center hover:bg-orange-light transition-all duration-150 active:scale-95"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </NuxtLink>
    </div>
  </header>
</template>

<script setup lang="ts">
defineEmits(['toggleSidebar'])

const route = useRoute()
const notificationStore = useNotificationStore()

const pageTitles: Record<string, string> = {
  '/dashboard': "Vue d'ensemble",
  '/dashboard/events': 'Mes événements',
  '/dashboard/tickets': 'Billets & Ventes',
  '/dashboard/participants': 'Participants',
  '/dashboard/invitations': 'Invitations',
  '/dashboard/marketing': 'Marketing',
  '/dashboard/pdv': 'Points de vente',
  '/dashboard/settings': 'Paramètres',
  '/dashboard/kyc': 'Vérification KYC',
  '/dashboard/support': 'Support',
  '/dashboard/checkin': 'Scan & Check-in',
  '/dashboard/wallet': 'Mon portefeuille',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/promo-codes': 'Codes promotionnels',
  '/dashboard/events/create': 'Créer un événement'
}

const pageTitle = computed(() => {
  if (route.path === '/dashboard/events/create' && route.query.edit) return 'Modifier l\'événement'
  return pageTitles[route.path] || "Vue d'ensemble"
})

const notifOpen = ref(false)
const notifRef = ref<HTMLElement | null>(null)

const notifications = ref<any[]>([])

const unreadCount = computed(() => notificationStore.unreadCount)

const markAllRead = () => {
  notifications.value.forEach(n => n.read = true)
  notificationStore.reset()
}

const onClickOutside = (e: MouseEvent) => {
  if (notifRef.value && !notifRef.value.contains(e.target as Node)) {
    notifOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>
