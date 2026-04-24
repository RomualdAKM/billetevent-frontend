<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const activeTab = ref('profil')

const tabs = [
  { key: 'profil', label: 'Profil' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'paiements', label: 'Paiements' },
]
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-12">
    <!-- Sidebar tabs (desktop: vertical, mobile: horizontal) -->
    <nav class="flex lg:flex-col gap-1 lg:pt-1">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="text-left text-sm py-2 px-3 rounded-md transition-colors duration-150"
        :class="activeTab === tab.key
          ? 'text-orange-primary font-semibold border-l-2 border-orange-primary lg:border-l-2 lg:rounded-none lg:pl-3'
          : 'text-text-secondary hover:text-text-primary border-l-2 border-transparent lg:rounded-none lg:pl-3'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </nav>

    <!-- Content -->
    <div class="min-w-0">
      <DashboardProfileTab v-if="activeTab === 'profil'" />
      <DashboardNotificationsTab v-if="activeTab === 'notifications'" />
      <DashboardPaymentsTab v-if="activeTab === 'paiements'" />
    </div>
  </div>
</template>
