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

watch(
  () => props.isOpen,
  (open) => {
    if (import.meta.client) {
      document.body.style.overflow = open ? 'hidden' : ''
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
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      >
        <div
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="onOverlayClick"
        />

        <div
          :class="[
            'relative w-full bg-surface rounded-xl flex flex-col max-h-[90vh]',
            'max-sm:!max-w-none max-sm:h-full max-sm:max-h-full max-sm:rounded-none',
            sizeClasses,
          ]"
        >
          <div class="flex items-center justify-between px-6 py-4 border-b border-border-light shrink-0">
            <h2 class="text-lg font-semibold text-text-primary">{{ title }}</h2>
            <button
              type="button"
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
