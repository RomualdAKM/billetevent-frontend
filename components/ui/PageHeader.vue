<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
    <div class="min-w-0">
      <h1 class="font-serif text-2xl text-text-primary leading-tight">
        {{ title }}
      </h1>
      <p v-if="subtitle" class="text-sm text-text-secondary mt-1">
        {{ subtitle }}
      </p>
    </div>

    <div v-if="$slots.default" class="flex items-center gap-3 shrink-0">
      <slot />
    </div>
  </div>
</template>
