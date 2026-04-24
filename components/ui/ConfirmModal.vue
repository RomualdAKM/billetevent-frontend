<script setup lang="ts">
const props = defineProps<{
  isOpen: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  loading?: boolean
  loadingText?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const variantConfig = computed(() => {
  const configs = {
    danger: {
      iconBg: 'bg-red-dim',
      iconColor: 'text-red-error',
      btnBg: 'bg-red-error hover:bg-red-error/90',
    },
    warning: {
      iconBg: 'bg-gold-dim',
      iconColor: 'text-gold',
      btnBg: 'bg-gold hover:bg-gold/90',
    },
    info: {
      iconBg: 'bg-blue-dim',
      iconColor: 'text-blue-main',
      btnBg: 'bg-blue-main hover:bg-blue-main/90',
    },
  }
  return configs[props.variant || 'danger']
})
</script>

<template>
  <UiBaseModal :is-open="isOpen" :title="title || 'Confirmation'" size="sm" @close="emit('cancel')">
    <div class="flex flex-col items-center text-center gap-4 py-2">
      <div
        :class="[
          'w-14 h-14 rounded-full flex items-center justify-center',
          variantConfig.iconBg,
        ]"
      >
        <svg
          class="w-7 h-7"
          :class="variantConfig.iconColor"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>

      <p class="text-sm text-text-secondary leading-relaxed">{{ message }}</p>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2.5 rounded-lg text-sm font-medium text-text-secondary bg-surface-2 hover:bg-surface-3 transition-colors"
          :disabled="loading"
          @click="emit('cancel')"
        >
          {{ cancelText || 'Annuler' }}
        </button>
        <button
          type="button"
          :class="[
            'px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-colors flex items-center gap-2',
            variantConfig.btnBg,
            loading ? 'opacity-75 cursor-not-allowed' : '',
          ]"
          :disabled="loading"
          @click="emit('confirm')"
        >
          <svg v-if="loading" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" stroke-opacity="0.75"/></svg>
          {{ loading ? (loadingText || 'Chargement...') : (confirmText || 'Confirmer') }}
        </button>
      </div>
    </template>
  </UiBaseModal>
</template>
