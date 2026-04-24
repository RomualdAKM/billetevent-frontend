<script setup lang="ts">
const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
})

const variantClasses: Record<string, string> = {
  primary: 'bg-orange-primary text-white hover:bg-orange-light',
  secondary: 'bg-transparent border border-border-light text-text-primary hover:bg-surface-2',
  ghost: 'bg-transparent text-text-secondary hover:bg-surface-2',
  danger: 'bg-transparent text-red-error hover:bg-red-dim',
}

const sizeClasses: Record<string, string> = {
  sm: 'text-sm px-3 py-1.5 rounded-lg',
  md: 'text-sm px-4 py-2.5 rounded-lg',
}
</script>

<template>
  <button
    :type="props.type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center font-medium cursor-pointer transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      variantClasses[props.variant],
      sizeClasses[props.size],
    ]"
  >
    <!-- Spinner -->
    <svg
      v-if="loading"
      class="animate-spin w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>

    <slot v-else />
  </button>
</template>
