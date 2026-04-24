<script setup>
const { info } = useNotification()

const handleSso = (provider) => {
  info(`Connexion ${provider} bientôt disponible`)
}
</script>

<template>
  <!-- Connexion Google/Microsoft - pas encore implémentée
  <div>
    <div class="flex gap-2.5 mb-1">
      <button class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border-light bg-surface text-[0.82rem] font-medium text-text-secondary hover:bg-bg-primary transition-colors" @click="handleSso('Google')">
        Google
      </button>
      <button class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border-light bg-surface text-[0.82rem] font-medium text-text-secondary hover:bg-bg-primary transition-colors" @click="handleSso('Microsoft')">
        Microsoft
      </button>
    </div>
    <div class="flex items-center gap-3 my-5 text-text-tertiary text-[0.75rem]">
      <div class="flex-1 h-px bg-border-light"></div>
      ou avec votre email
      <div class="flex-1 h-px bg-border-light"></div>
    </div>
  </div>
  -->
  <div></div>
</template>
