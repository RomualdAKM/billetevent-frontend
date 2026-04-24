<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue'

const props = defineProps<{
  modelValue: string
  label?: string
  placeholder?: string
  suggestions: string[]
  loading?: boolean
  error?: string
  disabled?: boolean
  required?: boolean
  hint?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  search: [query: string]
}>()

const isOpen = ref(false)
const activeIndex = ref(-1)
const inputRef = ref<HTMLInputElement | null>(null)
const listRef = ref<HTMLUListElement | null>(null)
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const query = computed(() => props.modelValue ?? '')

function onInput(e: Event) {
  const value = (e.target as HTMLInputElement).value
  emit('update:modelValue', value)
  activeIndex.value = -1

  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    emit('search', value)
  }, 400)

  if (value.length >= 2) {
    isOpen.value = true
  } else {
    isOpen.value = false
  }
}

function selectSuggestion(value: string) {
  emit('update:modelValue', value)
  isOpen.value = false
  activeIndex.value = -1
  nextTick(() => inputRef.value?.blur())
}

function onFocus() {
  if (query.value.length >= 2 && (props.suggestions.length > 0 || props.loading)) {
    isOpen.value = true
  }
}

function onBlur() {
  // Délai pour permettre le clic sur une suggestion
  setTimeout(() => {
    isOpen.value = false
    activeIndex.value = -1
  }, 200)
}

function onKeydown(e: KeyboardEvent) {
  if (!isOpen.value) {
    if (e.key === 'ArrowDown' && query.value.length >= 2) {
      isOpen.value = true
      e.preventDefault()
    }
    return
  }

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      activeIndex.value = Math.min(activeIndex.value + 1, props.suggestions.length - 1)
      scrollToActive()
      break
    case 'ArrowUp':
      e.preventDefault()
      activeIndex.value = Math.max(activeIndex.value - 1, -1)
      scrollToActive()
      break
    case 'Enter':
      e.preventDefault()
      if (activeIndex.value >= 0 && activeIndex.value < props.suggestions.length) {
        selectSuggestion(props.suggestions[activeIndex.value])
      }
      break
    case 'Escape':
      isOpen.value = false
      activeIndex.value = -1
      break
  }
}

function scrollToActive() {
  nextTick(() => {
    if (!listRef.value) return
    const activeEl = listRef.value.children[activeIndex.value] as HTMLElement | undefined
    activeEl?.scrollIntoView({ block: 'nearest' })
  })
}

// Ouvrir le dropdown quand les suggestions changent
watch(() => props.suggestions, (newVal) => {
  if (newVal.length > 0 && query.value.length >= 2) {
    isOpen.value = true
  }
})

const showDropdown = computed(() => {
  return isOpen.value && (props.loading || props.suggestions.length > 0 || query.value.length > 2)
})

function highlightMatch(text: string): string {
  if (!query.value || query.value.length < 1) return text
  const escaped = query.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  return text.replace(regex, '<strong class="font-semibold text-text-primary">$1</strong>')
}
</script>

<template>
  <div class="flex flex-col gap-1.5 relative">
    <label v-if="label" class="text-sm font-medium text-text-secondary">
      {{ label }}
      <span v-if="required" class="text-red-error">*</span>
    </label>

    <div class="relative">
      <input
        ref="inputRef"
        type="text"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        autocomplete="off"
        class="w-full bg-white border rounded-lg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        :class="[
          error
            ? 'border-red-error focus:border-red-error focus:ring-2 focus:ring-red-error/10'
            : 'border-border-light focus:border-orange-primary focus:ring-2 focus:ring-orange-primary/10'
        ]"
        @input="onInput"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
        role="combobox"
        :aria-expanded="showDropdown"
        aria-haspopup="listbox"
        aria-autocomplete="list"
      />

      <!-- Dropdown -->
      <Transition
        enter-active-class="transition duration-150 ease-out"
        enter-from-class="opacity-0 translate-y-1"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition duration-100 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 translate-y-1"
      >
        <div
          v-if="showDropdown"
          class="absolute left-0 right-0 top-full mt-1 bg-white rounded-lg border border-border-light z-50 overflow-hidden"
        >
          <!-- Loading -->
          <div v-if="loading" class="flex items-center gap-2 px-3.5 py-3 text-sm text-text-tertiary">
            <svg class="animate-spin h-4 w-4 text-orange-primary" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Recherche en cours…
          </div>

          <!-- Suggestions list -->
          <ul
            v-else-if="suggestions.length > 0"
            ref="listRef"
            role="listbox"
            class="max-h-48 overflow-y-auto"
          >
            <li
              v-for="(item, index) in suggestions"
              :key="item"
              role="option"
              :aria-selected="index === activeIndex"
              class="px-3.5 py-2 text-sm text-text-primary cursor-pointer transition-colors duration-100"
              :class="index === activeIndex ? 'bg-surface-2' : 'hover:bg-surface-2'"
              @mousedown.prevent="selectSuggestion(item)"
              @mouseenter="activeIndex = index"
              v-html="highlightMatch(item)"
            />
          </ul>

          <!-- Aucun résultat -->
          <div v-else-if="query.length > 2 && !loading" class="px-3.5 py-3 text-sm text-text-tertiary">
            Aucun résultat
          </div>
        </div>
      </Transition>
    </div>

    <p v-if="error" class="text-xs text-red-error">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-text-tertiary">{{ hint }}</p>
  </div>
</template>
