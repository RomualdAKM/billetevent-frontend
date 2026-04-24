<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  label?: string
  placeholder?: string
  rows?: number
  maxlength?: number
  error?: string
  disabled?: boolean
  hint?: string
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLTextAreaElement).value)
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-sm font-medium text-text-secondary">
      {{ label }}
    </label>

    <textarea
      :value="modelValue"
      :placeholder="placeholder"
      :rows="props.rows ?? 3"
      :maxlength="maxlength"
      :disabled="disabled"
      class="w-full bg-white border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none resize-none transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
      :class="error ? 'border-red-error focus:border-red-error focus:ring-2 focus:ring-red-error/10' : 'border-border-light focus:border-orange-primary focus:ring-2 focus:ring-orange-primary/10'"
      @input="onInput"
    />

    <div class="flex items-center justify-between gap-2">
      <p v-if="error" class="text-xs text-red-error">{{ error }}</p>
      <p v-else-if="hint" class="text-xs text-text-tertiary">{{ hint }}</p>
      <span v-else />
      <span v-if="maxlength" class="text-xs text-text-tertiary ml-auto shrink-0">
        {{ modelValue?.length ?? 0 }}/{{ maxlength }}
      </span>
    </div>
  </div>
</template>
