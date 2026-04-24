<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  label?: string
  description?: string
  disabled?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

function toggle() {
  if (!props.disabled) {
    emit('update:modelValue', !props.modelValue)
  }
}
</script>

<template>
  <div
    class="flex items-center justify-between gap-4"
    :class="{ 'opacity-50 pointer-events-none': disabled }"
  >
    <div v-if="label || description" class="min-w-0">
      <span v-if="label" class="block text-sm font-medium text-text-primary leading-snug">
        {{ label }}
      </span>
      <span v-if="description" class="block text-xs text-text-secondary mt-0.5 leading-relaxed">
        {{ description }}
      </span>
    </div>

    <button
      type="button"
      role="switch"
      :aria-checked="modelValue"
      :aria-label="label"
      class="relative inline-flex shrink-0 w-[44px] h-[24px] rounded-full border-none cursor-pointer transition-colors duration-200 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-primary"
      :class="modelValue ? 'bg-orange-primary' : 'bg-border-medium'"
      @click="toggle"
    >
      <span
        class="pointer-events-none absolute top-[3px] left-[3px] inline-block w-[18px] h-[18px] rounded-full bg-white transition-transform duration-200 ease-in-out"
        :class="modelValue ? 'translate-x-[20px]' : 'translate-x-0'"
      />
    </button>
  </div>
</template>
