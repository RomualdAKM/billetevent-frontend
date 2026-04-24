<template>
  <div
    class="bg-surface border border-border-light rounded-xl p-5 transition-[border-color] duration-200 hover:border-border-medium"
  >
    <div class="flex items-center justify-between mb-3">
      <div :class="iconColorClass">
        <slot name="icon" />
      </div>
      <div
        v-if="trend"
        class="text-xs font-bold flex items-center gap-0.5"
        :class="trend.direction === 'up' ? 'text-green-dark' : 'text-red-error'"
      >
        {{ trend.direction === 'up' ? '↑' : '↓' }} {{ trend.value }}
      </div>
    </div>
    <div class="font-serif text-3xl leading-none mb-1 text-text-primary">{{ value }}</div>
    <div class="text-xs text-text-secondary">{{ label }}</div>
    <div v-if="subLabel" class="text-[11px] text-text-tertiary mt-0.5">{{ subLabel }}</div>
  </div>
</template>

<script setup>
const props = defineProps({
  value: { type: String, required: true },
  label: { type: String, required: true },
  color: { type: String, default: 'orange' },
  trend: { type: Object, default: null },
  subLabel: { type: String, default: '' }
})

const iconColorClass = computed(() => ({
  orange: 'text-orange-primary',
  green: 'text-green-dark',
  blue: 'text-blue-main',
  gold: 'text-gold'
}[props.color] || ''))
</script>
