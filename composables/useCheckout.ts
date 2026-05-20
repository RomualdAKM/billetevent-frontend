import type {
  PaymentState,
  CheckoutPayload,
  CheckoutResponse,
  FormErrors,
} from '~/types/payment'

const PAYMENT_TIMEOUT_MS = 30_000

export const useCheckout = () => {
  const { success: notifySuccess, error: notifyError } = useNotification()
  const cartStore = useCartStore()
  const authStore = useAuthStore()
  const { submitCheckout, confirmWizall, validatePromo } = useCheckoutApi()

  const { countries: paymentCountries, fetchOperators, getOperatorsForCountry, getCountryInfo } = usePaymentOperators()

  // Fetch operators on composable init (cached, only one call)
  fetchOperators()

  // ── Buyer identity (guest checkout) ──
  // When the user is not logged in, the backend auto-creates a buyer account
  // from these fields and links the order to it.
  const isGuest = computed(() => !authStore.isLoggedIn)
  const guestInfo = ref({
    name: '',
    email: '',
    phone: '',
  })

  // ── Registration data (inscription mode) ──
  const registrationData = ref({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    guest_company: ''
  })

  // ── Event context ──
  const eventId = ref<string | number | null>(null)
  const eventSlug = ref<string | null>(null)
  const eventName = ref('')
  const eventDate = ref('')
  const eventLocation = ref('')
  const eventData = ref<any>(null)

  const accessMode = computed<'payant' | 'inscription' | 'libre'>(() => eventData.value?.access_mode || 'payant')
  const isLibre = computed(() => accessMode.value === 'libre')
  const isInscription = computed(() => accessMode.value === 'inscription')

  const isFreeEvent = computed(() => {
    if (isInscription.value) return true
    const passes = eventData.value?.passes
    if (!passes?.length) return false
    return passes.every((p: any) => !p.price || p.price === 0)
  })

  // ── Payment state machine ──
  const paymentState = ref<PaymentState>('idle')

  const isProcessing = computed(() =>
    paymentState.value === 'validating' || paymentState.value === 'processing',
  )

  // ── Form fields ──
  // Default to mobile money — dominant payment method in target markets (SN/CI/BJ/CM)
  const paymentMode = ref<'mobile' | 'card' | ''>('mobile')
  const selectedCountry = ref('')
  const selectedOperator = ref('')
  const mobileNumber = ref('')
  const cardNumber = ref('')
  const cardExpiry = ref('')
  const cardCvv = ref('')
  const cardName = ref('')
  const formErrors = ref<FormErrors>({})

  // ── Promo ──
  const promoInput = ref('')
  const promoLoading = ref(false)
  const promoApplied = ref(false)
  const promoError = ref('')

  // ── Wizall OTP ──
  const wizallOrderId = ref<number | string | null>(null)
  const wizallOrderReference = ref<string | null>(null)
  const wizallCode = ref('')
  const wizallLoading = ref(false)

  // ── Pending message ──
  const pendingMessage = ref('')

  // ── Computed: pricing ──
  const items = computed(() => cartStore.items)
  const subtotal = computed(() => cartStore.subtotal)
  const serviceFee = computed(() => 0)
  const promoDiscount = computed(() => cartStore.discount)
  const totalTTC = computed(() => Math.max(0, subtotal.value - promoDiscount.value))

  // ── Computed: country/operator ──
  const activeCountry = computed(() => getCountryInfo(selectedCountry.value))
  const countryOperators = computed(() => getOperatorsForCountry(selectedCountry.value))
  const countryDialCode = computed(() => activeCountry.value?.prefix ?? '')

  // ── Watchers: reset dependent fields ──
  watch(selectedCountry, () => {
    selectedOperator.value = ''
    mobileNumber.value = ''
  })

  watch(paymentMode, () => {
    selectedCountry.value = ''
    selectedOperator.value = ''
    mobileNumber.value = ''
    cardNumber.value = ''
    cardExpiry.value = ''
    cardCvv.value = ''
    cardName.value = ''
    formErrors.value = {}
  })

  // ── Init: restore event context from history state ──
  function initFromHistoryState() {
    if (!import.meta.client) return

    const s = window.history.state
    if (s?.eventName) eventName.value = s.eventName
    if (s?.eventDate) eventDate.value = s.eventDate
    if (s?.eventLocation) eventLocation.value = s.eventLocation
    if (s?.eventId) eventId.value = s.eventId
    if (s?.eventSlug) eventSlug.value = s.eventSlug

    if (s?.accessMode) {
      // Pre-set accessMode from history state for immediate UI
      if (!eventData.value) eventData.value = { access_mode: s.accessMode }
      else if (!eventData.value.access_mode) eventData.value.access_mode = s.accessMode
    }

    // Restore registration data
    if (s?.guestName) registrationData.value.guest_name = s.guestName
    if (s?.guestEmail) registrationData.value.guest_email = s.guestEmail
    if (s?.guestPhone) registrationData.value.guest_phone = s.guestPhone
    if (s?.guestCompany) registrationData.value.guest_company = s.guestCompany

    if (!eventId.value && cartStore.eventId) {
      eventId.value = cartStore.eventId
    }

    // Prefill guest identity from the authenticated profile when possible
    if (authStore.isLoggedIn && authStore.user) {
      const u = authStore.user as Record<string, any>
      const fullName = [u.first_name, u.last_name].filter(Boolean).join(' ').trim()
      if (fullName && !guestInfo.value.name) guestInfo.value.name = fullName
      if (u.email && !guestInfo.value.email) guestInfo.value.email = String(u.email)
      if (u.phone && !guestInfo.value.phone) guestInfo.value.phone = String(u.phone)
    }
  }

  async function loadEventDetails() {
    if (eventName.value && eventDate.value) return
    if (!eventId.value) return

    try {
      const { getEvent } = useEventsApi()
      const res = await getEvent(String(eventId.value))
      const data = (res as any)?.data ?? res
      if (!data) return

      eventData.value = data
      if (!eventSlug.value && data.slug) eventSlug.value = data.slug
      if (!eventName.value) eventName.value = data.title || ''
      if (!eventDate.value && data.date_start) {
        eventDate.value = new Date(data.date_start).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      }
      if (!eventLocation.value) {
        eventLocation.value = [data.location, data.city].filter(Boolean).join(', ')
      }
    } catch {
      // Event details are non-critical — UI still works without them
    }
  }

  // ── Validation ──
  function validate(): boolean {
    const errors: FormErrors = {}

    if (cartStore.isEmpty) {
      errors.cart = 'Votre panier est vide'
    }

    // Guest buyers must fill identity fields
    if (isGuest.value) {
      if (!guestInfo.value.name.trim()) {
        errors.guestName = 'Veuillez saisir votre nom complet'
      }
      const email = guestInfo.value.email.trim()
      if (!email) {
        errors.guestEmail = 'Veuillez saisir votre adresse email'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.guestEmail = 'Adresse email invalide'
      }
      if (!guestInfo.value.phone.trim()) {
        errors.guestPhone = 'Veuillez saisir votre numéro de téléphone'
      }
    }

    if (!isFreeEvent.value) {
      if (!paymentMode.value) {
        errors.paymentMode = 'Veuillez choisir un moyen de paiement'
      }

      if (paymentMode.value === 'mobile') {
        if (!selectedCountry.value) errors.country = 'Veuillez sélectionner votre pays'
        if (!selectedOperator.value) errors.operator = 'Veuillez choisir un opérateur'
        if (!mobileNumber.value.trim()) {
          errors.phone = 'Veuillez saisir votre numéro de téléphone'
        } else if (mobileNumber.value.replace(/\s/g, '').length < 7) {
          errors.phone = 'Numéro de téléphone invalide'
        }
      }
    }

    formErrors.value = errors
    return Object.keys(errors).length === 0
  }

  // ── Resolve operator key for backend ──
  function resolveOperatorKey(): string | undefined {
    if (paymentMode.value !== 'mobile') return undefined
    // selectedOperator already stores the API key directly (e.g. "orange_money_sn")
    return selectedOperator.value || undefined
  }

  // ── Build checkout payload ──
  function buildPayload(): CheckoutPayload {
    const payload: CheckoutPayload = {
      event_id: eventId.value!,
      items: items.value.map(i => ({ pass_id: i.id, quantity: i.quantity })),
      payment_method: isFreeEvent.value
        ? 'free'
        : (paymentMode.value === 'card' ? 'card' : 'mobile_money'),
    }

    if (!isFreeEvent.value && paymentMode.value === 'mobile') {
      payload.operator_key = resolveOperatorKey()
      // Strip spaces/dashes — backend regex is /^\d{7,15}$/ and would 422 on "77 123 45 67"
      payload.phone_number = mobileNumber.value.replace(/[\s-]/g, '')
      payload.country_code = selectedCountry.value
    }

    if (cartStore.promoCode) {
      payload.promo_code = cartStore.promoCode
    }

    // Signal to backend that the buyer is in the marketing landing flow
    // (no BilletEvent chrome). Backend uses this to:
    //   - append ?from=landing to the guest_view_url (success / pending)
    //   - append ?from=landing to the PayDunya return_url
    if (import.meta.client && typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (url.searchParams.get('from') === 'landing') {
        (payload as any).from_landing = true
      }
    }

    // Include registration data for inscription / free events
    if (isInscription.value || isFreeEvent.value) {
      if (registrationData.value.guest_name) payload.guest_name = registrationData.value.guest_name
      if (registrationData.value.guest_email) payload.guest_email = registrationData.value.guest_email
      if (registrationData.value.guest_phone) payload.guest_phone = registrationData.value.guest_phone
      if (registrationData.value.guest_company) payload.guest_company = registrationData.value.guest_company
    }

    // Unauthenticated buyer: pass identity so the backend can provision or attach an account
    if (isGuest.value) {
      if (!payload.guest_name) payload.guest_name = guestInfo.value.name.trim()
      if (!payload.guest_email) payload.guest_email = guestInfo.value.email.trim()
      if (!payload.guest_phone) payload.guest_phone = guestInfo.value.phone.trim()
    }

    return payload
  }

  // ── Handle checkout response ──
  function handleCheckoutResponse(data: CheckoutResponse) {
    const payment = data.payment_response ?? {}

    if (payment.payment_url) {
      // Order is created server-side and we're handing off to the gateway —
      // free the cart so a back-button or refresh doesn't re-submit the same items
      cartStore.clearCart()
      if (import.meta.client) window.location.href = payment.payment_url
      return
    }

    if (payment.client_secret) {
      cartStore.clearCart()
      notifySuccess('Redirection vers Stripe...')
      return
    }

    if (payment.requires_confirmation || selectedOperator.value === 'Wizall') {
      paymentState.value = 'awaiting_confirmation'
      wizallOrderId.value = data.order_id ?? null
      // Stash the reference too — that's what /orders/[id] expects in the URL
      // for the post-confirm navigation (works for both auth and guest paths).
      wizallOrderReference.value = data.reference ?? null
      // Hold the cart until Wizall confirmation succeeds (cleared in confirmWizallCode)
      return
    }

    if (data.payment_status === 'pending' || payment.status === 'pending') {
      paymentState.value = 'pending'
      pendingMessage.value = 'Veuillez valider le paiement sur votre téléphone. Vérifiez vos notifications.'
      // Keep the cart populated while the buyer confirms on their phone —
      // clearing it now makes the page flash "Votre panier est vide" before
      // the pending state takes over. The cart is cleared on the order
      // confirmation page (/orders/REF) instead.
      return
    }

    paymentState.value = 'success'
    notifySuccess('Paiement effectué avec succès !')
    cartStore.clearCart()
    // Guests get a signed URL so they can land on the confirmation page without a session
    let target = (data as any).guest_view_url || `/orders/${data.reference || data.order_id}`
    // Preserve the landing layout flag through to the order confirmation
    if (import.meta.client && new URL(window.location.href).searchParams.get('from') === 'landing') {
      target += (target.includes('?') ? '&' : '?') + 'from=landing'
    }
    navigateTo(target)
  }

  // ── Main pay action ──
  async function pay() {
    paymentState.value = 'validating'

    if (!validate()) {
      paymentState.value = 'idle'
      const firstError = Object.values(formErrors.value)[0]
      if (firstError) notifyError(firstError)
      return
    }

    paymentState.value = 'processing'

    let timeoutId: ReturnType<typeof setTimeout> | null = null

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('__timeout__'))
        }, PAYMENT_TIMEOUT_MS)
      })

      const checkoutPromise = submitCheckout(buildPayload())

      const res = await Promise.race([checkoutPromise, timeoutPromise])
      const data: CheckoutResponse = (res as any)?.data ?? res

      handleCheckoutResponse(data)
    } catch (err: any) {
      if (err?.message === '__timeout__') {
        paymentState.value = 'timeout'
        pendingMessage.value = 'Le paiement prend plus de temps que prévu. Veuillez patienter ou vérifier votre téléphone.'
        return
      }

      paymentState.value = 'failed'
      const msg = err?.data?.message || err?.message || 'Échec du paiement'
      notifyError(msg)
    } finally {
      if (timeoutId) clearTimeout(timeoutId)
      if (paymentState.value === 'processing') {
        paymentState.value = 'idle'
      }
    }
  }

  // ── Promo code ──
  async function applyPromo() {
    if (!promoInput.value.trim() || !eventId.value) return

    promoLoading.value = true
    promoError.value = ''

    try {
      const res = await validatePromo({ code: promoInput.value.trim(), event_id: eventId.value })
      const discount = (res as any)?.data?.discount ?? (res as any)?.discount ?? 0
      cartStore.applyPromo(promoInput.value.trim(), discount)
      promoApplied.value = true
      notifySuccess('Code promo appliqué !')
    } catch (err: any) {
      promoError.value = err?.data?.message || err?.message || 'Code promo invalide'
      notifyError(promoError.value)
    } finally {
      promoLoading.value = false
    }
  }

  // ── Wizall OTP confirmation ──
  async function confirmWizallCode() {
    if (!wizallCode.value.trim() || !wizallOrderId.value) return

    wizallLoading.value = true

    try {
      await confirmWizall({
        order_id: wizallOrderId.value,
        authorization_code: wizallCode.value.trim(),
      })
      paymentState.value = 'success'
      notifySuccess('Paiement Wizall confirmé !')
      cartStore.clearCart()
      // Prefer the human-readable reference (which is what /orders/[id]/index
      // expects). Falls back to numeric id thanks to the OrderController fix
      // that now accepts both lookup keys.
      const target = wizallOrderReference.value || wizallOrderId.value
      navigateTo(`/orders/${target}`)
    } catch (err: any) {
      notifyError(err?.data?.message || 'Code Wizall invalide')
    } finally {
      wizallLoading.value = false
    }
  }

  // ── Format helpers ──
  function formatPrice(price: number): string {
    if (price === 0) return 'Gratuit'
    return new Intl.NumberFormat('fr-FR').format(price) + ' F CFA'
  }

  return {
    // Event context
    eventId,
    eventSlug,
    eventName,
    eventDate,
    eventLocation,
    eventData,
    accessMode,
    isLibre,
    isInscription,
    isFreeEvent,
    initFromHistoryState,
    loadEventDetails,
    registrationData,

    // Guest buyer identity
    isGuest,
    guestInfo,

    // Payment state
    paymentState,
    isProcessing,

    // Form fields
    paymentMode,
    selectedCountry,
    selectedOperator,
    mobileNumber,
    cardNumber,
    cardExpiry,
    cardCvv,
    cardName,
    formErrors,

    // Promo
    promoInput,
    promoLoading,
    promoApplied,
    promoError,

    // Wizall
    wizallOrderId,
    wizallCode,
    wizallLoading,

    // Pending
    pendingMessage,

    // Pricing
    items,
    subtotal,
    serviceFee,
    promoDiscount,
    totalTTC,

    // Country / operator
    countries: paymentCountries,
    activeCountry,
    countryOperators,
    countryDialCode,

    // Actions
    pay,
    applyPromo,
    confirmWizallCode,
    formatPrice,
  }
}
