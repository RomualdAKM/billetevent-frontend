<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg'
}>()

const emit = defineEmits<{
  close: []
}>()

const sizeClasses = computed(() => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-3xl',
  }
  return sizes[props.size || 'md']
})

// ── Focus management ────────────────────────────────────────
// Remember whoever triggered the modal so we can give them focus back on close
const dialogRef = ref<HTMLElement | null>(null)
let previouslyFocused: HTMLElement | null = null

const focusableSelectors = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const getFocusable = (): HTMLElement[] => {
  if (!dialogRef.value) return []
  return Array.from(dialogRef.value.querySelectorAll<HTMLElement>(focusableSelectors))
    .filter(el => !el.hasAttribute('inert') && el.offsetParent !== null)
}

const trapTab = (e: KeyboardEvent) => {
  if (e.key !== 'Tab') return
  const focusable = getFocusable()
  if (focusable.length === 0) {
    e.preventDefault()
    return
  }
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement as HTMLElement | null
  if (e.shiftKey && active === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  }
}

watch(
  () => props.isOpen,
  async (open) => {
    if (!import.meta.client) return
    if (open) {
      document.body.style.overflow = 'hidden'
      previouslyFocused = (document.activeElement as HTMLElement | null) ?? null
      await nextTick()
      const focusable = getFocusable()
      // Focus first interactive element inside the modal (skip the close button when possible)
      const target = focusable.find(el => !el.hasAttribute('data-modal-close')) ?? focusable[0]
      target?.focus()
    } else {
      document.body.style.overflow = ''
      // Restore focus to whatever opened the modal
      previouslyFocused?.focus?.()
      previouslyFocused = null
    }
  },
)

onUnmounted(() => {
  if (import.meta.client) {
    document.body.style.overflow = ''
  }
})

const onOverlayClick = () => emit('close')
const onClose = () => emit('close')

// Close on Escape — standard modal contract
const onKeydown = (e: KeyboardEvent) => {
  if (!props.isOpen) return
  if (e.key === 'Escape') onClose()
  else if (e.key === 'Tab') trapTab(e)
}
onMounted(() => {
  if (import.meta.client) window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  if (import.meta.client) window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? 'base-modal-title' : undefined"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="onOverlayClick"
        />

        <div
          ref="dialogRef"
          :class="[
            'relative w-full bg-surface rounded-xl flex flex-col max-h-[90vh]',
            'max-sm:!max-w-none max-sm:h-full max-sm:max-h-full max-sm:rounded-none',
            sizeClasses,
          ]"
        >
          <div class="flex items-center justify-between px-6 py-4 border-b border-border-light shrink-0">
            <h2 id="base-modal-title" class="text-lg font-semibold text-text-primary">{{ title }}</h2>
            <button
              type="button"
              data-modal-close
              aria-label="Fermer"
              class="w-8 h-8 flex items-center justify-center rounded-lg text-text-tertiary hover:bg-surface-2 hover:text-text-primary transition-colors"
              @click="onClose"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="flex-1 overflow-y-auto px-6 py-4">
            <slot />
          </div>

          <div v-if="$slots.footer" class="px-6 py-4 border-t border-border-light shrink-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}
.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95);
  opacity: 0;
}
</style>
