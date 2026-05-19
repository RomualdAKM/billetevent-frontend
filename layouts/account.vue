<script setup>
const route = useRoute()

const sidebarLinks = [
  { label: 'Mon profil', to: '/account', icon: 'user' },
  { label: 'Mes achats', to: '/account/orders', icon: 'receipt' },
  { label: 'Mes favoris', to: '/account/favorites', icon: 'heart' },
]

const isActive = (to) => {
  if (to === '/account') return route.path === '/account'
  return route.path.startsWith(to)
}
</script>

<template>
  <div class="min-h-screen bg-bg-primary font-sans">
    <LayoutNavbar />

    <div class="max-w-[1200px] mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      <aside class="md:w-[240px] shrink-0">
        <nav class="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          <NuxtLink
            v-for="link in sidebarLinks"
            :key="link.to"
            :to="link.to"
            class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors"
            :class="isActive(link.to) ? 'bg-orange-dim text-orange-primary font-semibold' : 'text-text-secondary hover:bg-surface-2 hover:text-text-primary'"
          >
            <svg v-if="link.icon === 'user'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
            <svg v-if="link.icon === 'receipt'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            <svg v-if="link.icon === 'heart'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {{ link.label }}
          </NuxtLink>
        </nav>
      </aside>

      <main id="main" class="flex-1 min-w-0">
        <slot />
      </main>
    </div>

    <LayoutFooter />
  </div>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
