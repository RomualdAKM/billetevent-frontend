<script setup lang="ts">
const props = defineProps<{
  modelValue: string | number
  label?: string
  placeholder?: string
  type?: string
  error?: string
  disabled?: boolean
  required?: boolean
  hint?: string
  prefix?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-sm font-medium text-text-secondary">
      {{ label }}
      <span v-if="required" class="text-red-error">*</span>
    </label>

    <div :class="prefix ? 'flex' : ''">
      <span
        v-if="prefix"
        class="inline-flex items-center px-3 py-2.5 border border-r-0 border-border-light rounded-l-lg bg-surface-2 text-sm text-text-secondary shrink-0"
      >{{ prefix }}</span>
      <input
        :type="type ?? 'text'"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        class="w-full bg-white border px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        :class="[
          error ? 'border-red-error focus:border-red-error focus:ring-2 focus:ring-red-error/10' : 'border-border-light focus:border-orange-primary focus:ring-2 focus:ring-orange-primary/10',
          prefix ? 'rounded-r-lg' : 'rounded-lg'
        ]"
        @input="onInput"
      />
    </div>

    <p v-if="error" class="text-xs text-red-error">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-text-tertiary">{{ hint }}</p>
  </div>
</template>
