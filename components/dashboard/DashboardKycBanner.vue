<script setup lang="ts">
const props = defineProps<{
  /** Override the default 'pending' message to match the surrounding page context. */
  pendingMessage?: string
}>()

const authStore = useAuthStore()
const kycStatus = computed(() => (authStore.user as Record<string, unknown> | null)?.kyc_status as string | undefined)

const bannerType = computed<'pending' | 'submitted' | 'rejected' | null>(() => {
  switch (kycStatus.value) {
    case 'not_started':
    case 'incomplete':
    case undefined:
    case null:
    case '':
      return 'pending'
    case 'submitted':
    case 'in_review':
      return 'submitted'
    case 'rejected':
      return 'rejected'
    default:
      return null
  }
})

const pendingLabel = computed(() =>
  props.pendingMessage || 'Complétez votre vérification d\'identité pour activer les versements.'
)
</script>

<template>
  <!-- Pending -->
  <div v-if="bannerType === 'pending'" class="flex items-center justify-between bg-gold-dim border border-[rgba(217,119,6,0.2)] rounded-xl px-5 py-3.5">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-full bg-gold/10 flex items-center justify-center shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-gold)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      </div>
      <p class="text-sm text-gold font-medium">{{ pendingLabel }}</p>
    </div>
    <NuxtLink to="/dashboard/kyc" class="text-sm text-gold font-semibold hover:underline whitespace-nowrap ml-4">Compléter →</NuxtLink>
  </div>

  <!-- Submitted -->
  <div v-else-if="bannerType === 'submitted'" class="flex items-center justify-between bg-blue-dim border border-[rgba(27,43,94,0.12)] rounded-xl px-5 py-3.5">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-full bg-blue-dim flex items-center justify-center shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue-light)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </div>
      <p class="text-sm text-blue-main font-medium">Vos documents sont en cours de vérification. Délai estimé : 24-48h.</p>
    </div>
    <NuxtLink to="/dashboard/kyc" class="text-sm text-blue-light font-semibold hover:underline whitespace-nowrap ml-4">Voir le statut →</NuxtLink>
  </div>

  <!-- Rejected -->
  <div v-else-if="bannerType === 'rejected'" class="flex items-center justify-between bg-red-dim border border-[rgba(220,38,38,0.15)] rounded-xl px-5 py-3.5">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded-full bg-red-dim flex items-center justify-center shrink-0">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-red-error)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
      </div>
      <p class="text-sm text-red-error font-medium">Votre vérification a été refusée. Veuillez resoumettre vos documents.</p>
    </div>
    <NuxtLink to="/dashboard/kyc" class="text-sm text-red-error font-semibold hover:underline whitespace-nowrap ml-4">Resoumettre →</NuxtLink>
  </div>
</template>
