<script setup>
const props = defineProps({
  totalPages: { type: Number, required: true },
  currentPage: { type: Number, default: 1 },
})

const emit = defineEmits(['page-change'])

const pages = computed(() => {
  const total = props.totalPages
  const current = props.currentPage
  const items = []

  if (total <= 7) {
    for (let i = 1; i <= total; i++) items.push(i)
    return items
  }

  items.push(1)

  if (current > 3) items.push('...')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  for (let i = start; i <= end; i++) items.push(i)

  if (current < total - 2) items.push('...')

  items.push(total)

  return items
})

const goToPage = (page) => {
  if (page === '...' || page === props.currentPage) return
  emit('page-change', page)
}
</script>

<template>
  <div class="flex items-center gap-2">
    <button
      class="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer"
      :class="currentPage === 1 ? 'text-text-tertiary cursor-not-allowed opacity-50' : 'bg-surface text-text-primary hover:bg-surface-2'"
      :disabled="currentPage === 1"
      @click="goToPage(currentPage - 1)"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>

    <button
      v-for="(page, index) in pages"
      :key="index"
      class="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-150"
      :class="page === currentPage ? 'bg-orange-primary text-white' : page === '...' ? 'cursor-default text-text-tertiary' : 'bg-surface text-text-primary hover:bg-surface-2 cursor-pointer'"
      :disabled="page === '...'"
      @click="goToPage(page)"
    >
      {{ page }}
    </button>

    <button
      class="w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-150 cursor-pointer"
      :class="currentPage === totalPages ? 'text-text-tertiary cursor-not-allowed opacity-50' : 'bg-surface text-text-primary hover:bg-surface-2'"
      :disabled="currentPage === totalPages"
      @click="goToPage(currentPage + 1)"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </button>
  </div>
</template>
