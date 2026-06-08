<script setup lang="ts">
import type { Notification } from '~/composables/useNotification'

const { notifications, remove } = useNotification()

const iconMap: Record<Notification['type'], string> = {
  success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
}

const colorMap: Record<Notification['type'], { bg: string; icon: string; bar: string }> = {
  success: { bg: 'bg-green-dim', icon: 'text-green-dark', bar: 'bg-green-dark' },
  error: { bg: 'bg-red-dim', icon: 'text-red-error', bar: 'bg-red-error' },
  info: { bg: 'bg-blue-dim', icon: 'text-blue-main', bar: 'bg-blue-main' },
  warning: { bg: 'bg-gold-dim', icon: 'text-gold', bar: 'bg-gold' },
}
</script>

<template>
  <Teleport to="body">
    <!-- Desktop: top-right SOUS la navbar (sticky top-0 h-16 z-[200]) — d'où
         top-20 (80px = 64 navbar + 16 margin) + z-[210] pour passer devant
         tout chrome éventuel.
         Mobile: bottom + safe-area. -->
    <div
      role="status"
      aria-live="polite"
      aria-atomic="false"
      class="fixed z-[210] flex flex-col gap-3 pointer-events-none
             top-20 right-4 w-full max-w-sm
             max-sm:top-auto max-sm:right-2 max-sm:left-2 max-sm:max-w-none
             max-sm:bottom-[calc(env(safe-area-inset-bottom)+1rem)]"
    >
      <TransitionGroup
        enter-active-class="transition-all duration-300 ease-out"
        leave-active-class="transition-all duration-200 ease-in"
        enter-from-class="translate-x-full opacity-0 max-sm:translate-x-0 max-sm:translate-y-full"
        enter-to-class="translate-x-0 opacity-100 max-sm:translate-y-0"
        leave-from-class="translate-x-0 opacity-100 max-sm:translate-y-0"
        leave-to-class="translate-x-full opacity-0 max-sm:translate-x-0 max-sm:translate-y-full"
      >
        <div
          v-for="n in notifications"
          :key="n.id"
          :class="[
            'pointer-events-auto rounded-xl bg-surface border border-border-light overflow-hidden',
          ]"
        >
          <div class="flex items-start gap-3 px-4 py-3">
            <div
              :class="[
                'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5',
                colorMap[n.type].bg,
              ]"
            >
              <svg
                class="w-5 h-5"
                :class="colorMap[n.type].icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="iconMap[n.type]" />
              </svg>
            </div>

            <p class="flex-1 text-sm text-text-primary pt-1">{{ n.message }}</p>

            <button
              type="button"
              aria-label="Fermer la notification"
              class="w-6 h-6 flex items-center justify-center rounded text-text-tertiary hover:text-text-primary transition-colors shrink-0"
              @click="remove(n.id)"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="h-1 w-full bg-surface-2">
            <div
              :class="['h-full rounded-r-full', colorMap[n.type].bar]"
              :style="{ animation: `toast-progress ${n.duration}ms linear forwards` }"
            />
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes toast-progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
</style>
