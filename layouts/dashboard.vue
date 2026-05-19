<template>
  <div class="min-h-screen flex bg-bg-primary font-sans">
    <!-- Backdrop mobile -->
    <Transition name="backdrop">
      <div
        v-if="sidebarOpenMobile"
        class="fixed inset-0 bg-black/50 z-[99] lg:hidden backdrop-blur-[2px]"
        @click="sidebarOpenMobile = false"
      />
    </Transition>

    <!-- Sidebar -->
    <DashboardSidebar
      :collapsed="sidebarCollapsed"
      :open-mobile="sidebarOpenMobile"
      @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
      @close-mobile="sidebarOpenMobile = false"
    />

    <!-- Main area -->
    <div
      class="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden transition-all duration-250 ease-[cubic-bezier(.4,0,.2,1)]"
      :class="sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'"
    >
      <DashboardHeader @toggle-sidebar="sidebarOpenMobile = !sidebarOpenMobile" />
      <main id="main" class="flex-1 w-full box-border overflow-x-hidden p-6 md:p-8">
        <div class="max-w-7xl mx-auto">
          <slot />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
const sidebarCollapsed = ref(false)
const sidebarOpenMobile = ref(false)
</script>

<style scoped>
.backdrop-enter-active,
.backdrop-leave-active {
  transition: opacity 0.25s ease;
}
.backdrop-enter-from,
.backdrop-leave-to {
  opacity: 0;
}
</style>
