<script setup lang="ts">
interface Column {
  key: string
  label: string
  class?: string
  hideOnMobile?: boolean
}

const props = withDefaults(
  defineProps<{
    columns: Column[]
    rows: Array<Record<string, any>>
    loading?: boolean
    emptyTitle?: string
    emptyDescription?: string
  }>(),
  {
    loading: false,
    emptyTitle: 'Aucune donnée',
    emptyDescription: 'Il n\'y a rien à afficher pour le moment.',
  }
)

const emit = defineEmits<{ 'row-click': [row: any] }>()

const hasRowClick = computed(() => {
  const instance = getCurrentInstance()
  return !!(instance?.vnode.props?.['onRow-click'] || instance?.vnode.props?.onRowClick)
})

const skeletonRows = 5
</script>

<template>
  <div class="bg-surface rounded-xl border border-border-light overflow-hidden">
    <!-- Desktop table -->
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="bg-surface-2/50">
            <th
              v-for="col in columns"
              :key="col.key"
              class="text-left text-[11px] font-bold tracking-wider uppercase text-text-tertiary px-4 py-3"
              :class="[col.class, col.hideOnMobile ? 'max-md:hidden' : '']"
            >
              {{ col.label }}
            </th>
            <th
              v-if="$slots.actions"
              class="text-right text-[11px] font-bold tracking-wider uppercase text-text-tertiary px-4 py-3"
            >
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          <!-- Loading skeleton -->
          <template v-if="loading">
            <tr v-for="i in skeletonRows" :key="'skel-' + i" class="border-b border-border-light/60">
              <td
                v-for="col in columns"
                :key="col.key + '-skel'"
                class="px-4 py-4"
                :class="col.hideOnMobile ? 'max-md:hidden' : ''"
              >
                <div class="h-4 rounded skeleton-shimmer" :style="{ width: (40 + Math.random() * 40) + '%' }" />
              </td>
              <td v-if="$slots.actions" class="px-4 py-4">
                <div class="h-4 w-8 rounded skeleton-shimmer ml-auto" />
              </td>
            </tr>
          </template>

          <!-- Data rows -->
          <template v-else-if="rows.length">
            <tr
              v-for="(row, idx) in rows"
              :key="idx"
              class="border-b border-border-light/60 transition-colors"
              :class="hasRowClick ? 'hover:bg-surface-2/30 cursor-pointer' : ''"
              @click="hasRowClick ? emit('row-click', row) : undefined"
            >
              <td
                v-for="col in columns"
                :key="col.key"
                class="px-4 py-4 text-sm text-text-primary"
                :class="[col.class, col.hideOnMobile ? 'max-md:hidden' : '']"
              >
                <slot :name="'cell-' + col.key" :row="row" :value="row[col.key]">
                  {{ row[col.key] }}
                </slot>
              </td>
              <td v-if="$slots.actions" class="px-4 py-4 text-right">
                <slot name="actions" :row="row" />
              </td>
            </tr>
          </template>

          <!-- Empty state -->
          <tr v-else>
            <td :colspan="columns.length + ($slots.actions ? 1 : 0)">
              <UiEmptyState
                :title="emptyTitle ?? 'Aucune donnée'"
                :description="emptyDescription"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
