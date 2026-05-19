<script setup lang="ts">
// Public-facing landing layout for shared event links (/e/[slug]).
// Designed for paid traffic: minimal chrome, no BilletEvent navbar/footer,
// the event itself owns the visual real estate. A discreet "Propulsé par
// BilletEvent" mini-footer keeps the brand visible.
</script>

<template>
  <div class="min-h-screen bg-bg-primary font-sans">
    <main id="main">
      <slot />
    </main>

    <footer class="border-t border-border-light bg-surface py-4 px-5">
      <div class="max-w-[1080px] mx-auto flex items-center justify-between gap-4 flex-wrap text-xs text-text-tertiary">
        <NuxtLink to="/" class="inline-flex items-center gap-1.5 font-medium hover:text-text-primary transition-colors">
          <span>Propulsé par</span>
          <NuxtImg src="/logo.png" alt="BilletEvent" :width="80" :height="22" class="h-5 w-auto" loading="lazy" />
        </NuxtLink>
        <div class="flex items-center gap-4">
          <NuxtLink to="/legal/cgu" class="hover:text-text-primary transition-colors">CGU</NuxtLink>
          <NuxtLink to="/legal/privacy" class="hover:text-text-primary transition-colors">Confidentialité</NuxtLink>
        </div>
      </div>
    </footer>
  </div>
</template>
