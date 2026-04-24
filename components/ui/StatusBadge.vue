<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'
    label: string
    dot?: boolean
    size?: 'sm' | 'md'
  }>(),
  { dot: true, size: 'md' }
)

const variantClasses: Record<string, string> = {
  success: 'bg-green-dim text-green-dark',
  warning: 'bg-orange-dim text-orange-primary',
  error: 'bg-red-dim text-red-error',
  info: 'bg-blue-dim text-blue-main',
  neutral: 'bg-surface-2 text-text-secondary',
}
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-medium whitespace-nowrap"
    :class="[
      variantClasses[variant],
      size === 'sm' ? 'text-[11px]' : 'text-xs',
    ]"
  >
    <span
      v-if="dot"
      class="w-1.5 h-1.5 rounded-full bg-current shrink-0"
      aria-hidden="true"
    />
    {{ label }}
  </span>
</template>
