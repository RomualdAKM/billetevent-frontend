<template>
  <div class="h-[60px] flex items-center justify-between px-4 md:px-8 gap-3 bg-surface border-b border-border-light sticky top-0 z-50">
    <div class="flex items-center gap-3 min-w-0 flex-1">
      <button
        class="flex lg:hidden w-9 h-9 rounded-lg bg-surface-2 border border-border-light items-center justify-center cursor-pointer"
        @click="$emit('toggleSidebar')"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
      </button>
      <div class="min-w-0">
        <div class="font-serif text-[1.15rem] whitespace-nowrap overflow-hidden text-ellipsis text-text-primary">{{ pageTitle }}</div>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <div class="w-9 h-9 rounded-full bg-blue-main text-white flex items-center justify-center text-[0.75rem] font-bold">{{ adminInitials }}</div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['toggleSidebar'])

const route = useRoute()
const authStore = useAuthStore()

const adminInitials = computed(() => {
  const u = authStore.user
  if (!u) return 'AD'
  const f = (u.first_name || '').charAt(0).toUpperCase()
  const l = (u.last_name || '').charAt(0).toUpperCase()
  return f + l || 'AD'
})

const pageTitles = {
  '/admin': 'Dashboard Admin',
  '/admin/fees': 'Frais & Commissions',
  '/admin/payment-methods': 'Méthodes de paiement',
  '/admin/kyc': 'Vérifications KYC',
  '/admin/withdrawals': 'Demandes de retrait',
  '/admin/users': 'Utilisateurs',
}

const pageTitle = computed(() => pageTitles[route.path] || 'Administration')
</script>
