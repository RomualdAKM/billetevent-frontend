<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    icon?: string
    title: string
    description?: string
    actionLabel?: string
    actionTo?: string
  }>(),
  { icon: undefined, description: undefined, actionLabel: undefined, actionTo: undefined }
)

const emit = defineEmits<{ action: [] }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
    <!-- Icône par défaut (boîte vide) si aucun slot icon -->
    <div class="w-12 h-12 text-text-tertiary mb-4 flex items-center justify-center">
      <slot name="icon">
        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.2">
          <path stroke-linecap="round" stroke-linejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </slot>
    </div>

    <h3 class="text-base font-semibold text-text-primary mb-1">
      {{ title }}
    </h3>

    <p v-if="description" class="text-sm text-text-secondary max-w-sm leading-relaxed">
      {{ description }}
    </p>

    <div v-if="actionLabel" class="mt-5">
      <NuxtLink
        v-if="actionTo"
        :to="actionTo"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border border-border-medium text-text-primary hover:bg-surface-2 transition-colors"
      >
        {{ actionLabel }}
      </NuxtLink>
      <button
        v-else
        type="button"
        class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium border border-border-medium text-text-primary hover:bg-surface-2 transition-colors"
        @click="emit('action')"
      >
        {{ actionLabel }}
      </button>
    </div>
  </div>
</template>
