<script setup lang="ts">
defineProps<{
  modelValue: string | number
  label?: string
  options: Array<{ label: string; value: string | number }>
  placeholder?: string
  error?: string
  disabled?: boolean
  required?: boolean
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

function onChange(e: Event) {
  emit('update:modelValue', (e.target as HTMLSelectElement).value)
}
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label v-if="label" class="text-sm font-medium text-text-secondary">
      {{ label }}
      <span v-if="required" class="text-red-error">*</span>
    </label>

    <div class="relative">
      <select
        :value="modelValue"
        :disabled="disabled"
        :required="required"
        class="w-full appearance-none bg-white border rounded-lg px-3.5 py-2.5 pr-9 text-sm text-text-primary outline-none transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        :class="[
          error ? 'border-red-error focus:border-red-error focus:ring-2 focus:ring-red-error/10' : 'border-border-light focus:border-orange-primary focus:ring-2 focus:ring-orange-primary/10',
          !modelValue && placeholder ? 'text-text-tertiary' : ''
        ]"
        @change="onChange"
      >
        <option v-if="placeholder" value="" disabled :selected="!modelValue">
          {{ placeholder }}
        </option>
        <option
          v-for="opt in options"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>

      <!-- Chevron -->
      <svg
        class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        stroke-width="2"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>

    <p v-if="error" class="text-xs text-red-error">{{ error }}</p>
  </div>
</template>
