import type { CartItem } from '~/types/payment'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([])
  const eventId = ref<string | number | null>(null)
  const promoCode = ref<string | null>(null)
  const discount = ref(0)
  // Persisted via pinia-plugin-persistedstate (plugins/pinia-persist.client.ts).
  // Survives full-page refresh + leaving the app to confirm mobile-money payment.

  const subtotal = computed(() =>
    items.value.reduce((sum, item) => sum + item.price * item.quantity, 0),
  )

  const total = computed(() => Math.max(0, subtotal.value - discount.value))

  const itemCount = computed(() =>
    items.value.reduce((sum, item) => sum + item.quantity, 0),
  )

  const isEmpty = computed(() => items.value.length === 0)

  function addItem(pass: { id: string | number; name: string; price: number }, quantity: number) {
    const existing = items.value.find(i => i.id === pass.id)
    if (existing) {
      existing.quantity += quantity
    } else {
      items.value.push({ id: pass.id, name: pass.name, price: pass.price, quantity })
    }
  }

  function removeItem(passId: string | number) {
    items.value = items.value.filter(i => i.id !== passId)
  }

  function updateQuantity(passId: string | number, quantity: number) {
    const item = items.value.find(i => i.id === passId)
    if (!item) return
    if (quantity <= 0) {
      removeItem(passId)
    } else {
      item.quantity = quantity
    }
  }

  function applyPromo(code: string, discountAmount: number) {
    promoCode.value = code
    discount.value = discountAmount
  }

  function clearCart() {
    items.value = []
    eventId.value = null
    promoCode.value = null
    discount.value = 0
  }

  return {
    items,
    eventId,
    promoCode,
    discount,
    subtotal,
    total,
    itemCount,
    isEmpty,
    addItem,
    removeItem,
    updateQuantity,
    applyPromo,
    clearCart,
  }
}, {
  persist: true,
})
