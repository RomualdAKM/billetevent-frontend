<template>
  <div class="min-h-screen flex bg-bg-primary font-sans">
    <div
      v-if="sidebarOpenMobile"
      class="fixed inset-0 bg-black/40 z-[99] lg:hidden"
      @click="sidebarOpenMobile = false"
    />
    <AdminSidebar
      :collapsed="sidebarCollapsed"
      :open-mobile="sidebarOpenMobile"
      @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
      @close-mobile="sidebarOpenMobile = false"
    />
    <div
      class="flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden transition-[margin-left] duration-250 ease-[cubic-bezier(.4,0,.2,1)]"
      :class="sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'"
    >
      <AdminHeader @toggle-sidebar="sidebarOpenMobile = !sidebarOpenMobile" />
      <div class="flex-1 w-full box-border overflow-x-hidden p-4 sm:p-5 md:p-7">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
const sidebarCollapsed = ref(false)
const sidebarOpenMobile = ref(false)
</script>
