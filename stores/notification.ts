export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)

  function setUnreadCount(count: number) { unreadCount.value = count }
  function decrement() { if (unreadCount.value > 0) unreadCount.value-- }
  function reset() { unreadCount.value = 0 }

  return { unreadCount, setUnreadCount, decrement, reset }
})
