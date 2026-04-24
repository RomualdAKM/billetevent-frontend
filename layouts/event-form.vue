<template>
  <div class="min-h-screen bg-bg-primary">
    <!-- Top bar simplifiée -->
    <header class="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-border-light">
      <div class="flex items-center justify-between px-5 sm:px-8 h-14">
        <!-- Gauche : retour -->
        <NuxtLink
          to="/dashboard/events"
          class="flex items-center gap-2 text-text-secondary hover:text-orange-primary transition-colors duration-150 shrink-0"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          <span class="text-sm font-medium">Mes événements</span>
        </NuxtLink>

        <!-- Droite : actions (injectées par la page) + avatar -->
        <div class="flex items-center gap-3 shrink-0">
          <div
            class="w-8 h-8 rounded-full bg-gradient-to-br from-orange-primary to-orange-light flex items-center justify-center text-xs font-bold text-white ring-2 ring-white"
          >
            {{ userInitials }}
          </div>
        </div>
      </div>
    </header>

    <!-- Contenu plein écran -->
    <main>
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const authStore = useAuthStore()

const isEdit = computed(() => !!route.query.edit)

const pageTitle = computed(() =>
  isEdit.value ? 'Modifier l\'événement' : 'Créer un événement'
)

const userInitials = computed(() => {
  const u = authStore.user
  if (!u) return '?'
  const f = (u.first_name || '').charAt(0).toUpperCase()
  const l = (u.last_name || '').charAt(0).toUpperCase()
  return f + l || '?'
})
</script>
