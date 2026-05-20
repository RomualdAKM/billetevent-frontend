<script setup lang="ts">
definePageMeta({ layout: 'event' })

const route = useRoute()
const { getEvent } = useEventsApi()
const { getOrganizerEvents } = usePublicApi()
const authStore = useAuthStore()
const cartStore = useCartStore()
const { success, info, error: notifyError } = useNotification()

const { initPixels, trackViewContent, cleanup } = useTracking()

const { data: apiData, status } = await useAsyncData(
  `event-${route.params.slug}`,
  () => getEvent(String(route.params.slug))
)

const loading = computed(() => status.value === 'pending')
const event = computed(() => apiData.value?.data ?? null)

// Tracking pixels : initialiser et tracker quand l'événement est chargé
watch(event, async (ev) => {
  if (!ev?.organizer?.id) return
  try {
    await initPixels(ev.organizer.id)
    trackViewContent({
      name: ev.title || '',
      category: ev.category || '',
      value: ev.min_price || 0,
      currency: 'XOF',
    })
  } catch {
    // Silencieux — le tracking ne doit pas bloquer la page
  }
}, { immediate: true })

onBeforeUnmount(() => cleanup())

watch(status, (val) => {
  if (val === 'error' || (val === 'success' && !event.value)) {
    showError({ statusCode: 404, statusMessage: 'Événement introuvable' })
  }
})

const accessMode = computed(() => event.value?.access_mode || 'payant')
const isLibre = computed(() => accessMode.value === 'libre')
const isInscription = computed(() => accessMode.value === 'inscription')

const showFullDesc = ref(false)

const lightboxOpen = ref(false)
const lightboxIndex = ref(0)
const lightboxRef = ref<HTMLElement | null>(null)

watch(lightboxOpen, (val) => {
  if (val) nextTick(() => lightboxRef.value?.focus())
})

function openLightbox(index: number) {
  lightboxIndex.value = index
  lightboxOpen.value = true
}

function lightboxPrev() {
  const gallery = event.value?.gallery ?? []
  if (gallery.length === 0) return
  lightboxIndex.value = (lightboxIndex.value - 1 + gallery.length) % gallery.length
}

function lightboxNext() {
  const gallery = event.value?.gallery ?? []
  if (gallery.length === 0) return
  lightboxIndex.value = (lightboxIndex.value + 1) % gallery.length
}

const defaultFaqs = [
  { q: 'Mon billet est-il remboursable ?', a: 'Oui, un remboursement intégral est possible jusqu\'à 14 jours avant l\'événement depuis votre compte.', open: true },
  { q: 'Comment est-ce que je reçois mon billet ?', a: 'Votre billet est envoyé par email dès la confirmation de l\'achat. Le QR code fonctionne directement depuis votre téléphone à l\'entrée.', open: false },
  { q: 'Puis-je transférer mon billet à quelqu\'un d\'autre ?', a: 'Oui, gratuitement jusqu\'à 48h avant l\'événement depuis votre compte BilletEvent.', open: false }
]

const faqItems = ref<Array<{ q: string; a: string; open: boolean }>>([])

watch(event, (ev) => {
  const apiFaqs = ev?.faqs ?? []
  if (apiFaqs.length) {
    faqItems.value = apiFaqs.map((f: any, i: number) => ({ q: f.question, a: f.answer, open: i === 0 }))
  } else {
    faqItems.value = defaultFaqs.map(f => ({ ...f }))
  }
}, { immediate: true })

function toggleFaq(index: number) {
  const wasOpen = faqItems.value[index].open
  faqItems.value.forEach(item => item.open = false)
  if (!wasOpen) faqItems.value[index].open = true
}

const programme = computed(() => {
  const progs = event.value?.programs ?? []
  const defaultChips = [
    { chipClass: 'bg-bg-primary text-text-secondary border-border-light' },
    { chipClass: 'bg-bg-primary text-text-secondary border-border-light' },
    { chipClass: 'bg-bg-primary text-text-secondary border-border-light' },
    { chipClass: 'bg-bg-primary text-text-secondary border-border-light' },
  ]
  return progs.map((p: any, i: number) => ({
    time: p.start_time ? new Date('1970-01-01T' + p.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
    ampm: p.start_time && parseInt(p.start_time) >= 12 ? 'PM' : 'AM',
    title: p.title,
    sub: p.description ?? '',
    chip: p.title?.split(' ')[0] ?? '',
    chipClass: defaultChips[i % defaultChips.length].chipClass,
    speaker: p.speaker_name,
    speakerPhoto: p.speaker_photo,
  }))
})

const artists = computed(() => {
  const list = event.value?.artists ?? []
  if (list.length) {
    return list.map((a: any) => ({
      name: a.name,
      role: a.role ?? '',
      img: a.image_path ?? '',
    }))
  }
  return (event.value?.programs ?? [])
    .filter((p: any) => p.speaker_name)
    .map((p: any) => ({
      name: p.speaker_name,
      role: p.title ?? '',
      img: p.speaker_photo ?? '',
    }))
})

const orgEvents = ref<any[]>([])

watch(event, async (ev) => {
  if (ev?.organizer?.id) {
    try {
      const res = await getOrganizerEvents(ev.organizer.id)
      const list = res?.data ?? []
      orgEvents.value = list
        .filter((e: any) => e.id !== ev.id)
        .slice(0, 3)
        .map((e: any) => ({
          id: e.id,
          slug: e.slug || e.id,
          title: e.title,
          location: [e.city, e.country].filter(Boolean).join(', '),
          date: e.date_start,
          image: e.flyer_url,
        }))
    } catch (err) {
      console.error('Error loading organizer events:', err)
    }
  }
}, { immediate: true })

const pointsDeVente = computed(() =>
  (event.value?.points_of_sale ?? []).map((p: any) => ({
    name: p.name,
    addr: p.address,
    hours: p.hours,
    type: p.is_active ? 'Ouvert' : 'Fermé',
    typeColor: p.is_active ? 'orange' : 'blue',
  }))
)

const orgFollowId = computed(() => event.value?.organizer?.id ?? null)
const orgInitialFollowing = computed(() => !!event.value?.organizer?.is_following)
const { isFollowing, loading: followLoading, toggleFollow } = useFollowOrganizer(orgFollowId, orgInitialFollowing)

const showFollowButton = computed(() => {
  if (!authStore.isLoggedIn) return false
  if (!event.value?.organizer) return false
  const userId = (authStore.user as any)?.id
  return userId !== event.value.organizer.user_id && userId !== event.value.organizer.id
})

const copyEventLink = () => {
  const url = window.location.href
  navigator.clipboard.writeText(url).then(() => {
    linkCopied.value = true
    success('Lien copié !')
    setTimeout(() => { linkCopied.value = false }, 2500)
  })
}

const shareWhatsApp = () => {
  const url = encodeURIComponent(window.location.href)
  const text = encodeURIComponent('Découvrez cet événement sur BilletEvent !')
  window.open(`https://wa.me/?text=${text}%20${url}`, '_blank')
}

const shareTwitter = () => {
  const url = encodeURIComponent(window.location.href)
  const text = encodeURIComponent('Découvrez cet événement sur BilletEvent !')
  window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
}

const shareLinkedIn = () => {
  const url = encodeURIComponent(window.location.href)
  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank')
}

const shareTelegram = () => {
  const url = encodeURIComponent(window.location.href)
  const text = encodeURIComponent('Découvrez cet événement sur BilletEvent !')
  window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank')
}

const shareEmail = () => {
  const url = window.location.href
  const subject = encodeURIComponent('Découvrez cet événement sur BilletEvent')
  const body = encodeURIComponent(`Je vous recommande cet événement : ${url}`)
  window.open(`mailto:?subject=${subject}&body=${body}`)
}

const extractYoutubeId = (url: string): string | null => {
  if (!url) return null
  const match1 = url.match(/[?&]v=([^&]+)/)
  if (match1?.[1]) return match1[1]
  const match2 = url.match(/youtu\.be\/([^?&]+)/)
  if (match2?.[1]) return match2[1]
  const match3 = url.match(/embed\/([^?&]+)/)
  if (match3?.[1]) return match3[1]
  return null
}

const youtubeEmbedUrl = computed(() => {
  const id = extractYoutubeId(event.value?.video_url)
  return id ? `https://www.youtube.com/embed/${id}` : null
})

const locationCopied = ref(false)
// The embed iframe is loaded only after explicit user action — saves a
// non-trivial 3rd-party request on the critical event page (esp. on 3G).
const mapVisible = ref(false)
const linkCopied = ref(false)
function copyLocation() {
  const addr = [event.value?.address, event.value?.city, event.value?.country].filter(Boolean).join(', ')
  navigator.clipboard.writeText(addr || '').then(() => {
    locationCopied.value = true
    setTimeout(() => { locationCopied.value = false }, 2500)
  })
}

const ticketCategories = computed(() => {
  const passes = event.value?.passes ?? []
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
  return passes.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description || '',
    price: p.price,
    quantity: ticketQuantities.value[p.id] ?? 0,
    remaining: p.available ?? (p.capacity - p.sold_count),
    badge: '',
    badgeType: (p.available ?? (p.capacity - p.sold_count)) < 20 ? 'limited' : 'normal',
    saleStart: formatDate(p.sale_start_date),
    saleEnd: formatDate(p.sale_end_date),
  }))
})

const ticketQuantities = ref<Record<number | string, number>>({})

const formatPrice = (price: number) => price === 0 ? 'Gratuit' : new Intl.NumberFormat('fr-FR').format(price) + ' F CFA'

const formatEventDate = (iso: string) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

const formatTime = (iso: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.getHours().toString().padStart(2, '0') + 'h' + d.getMinutes().toString().padStart(2, '0')
}

const formatDateShort = (iso: string) => {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

const formattedDateRange = computed(() => {
  const start = event.value?.date_start
  if (!start) return ''
  const end = event.value?.date_end
  const dStart = new Date(start)
  const startDate = dStart.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const startTime = formatTime(start)
  if (!end) return `${startDate} à ${startTime}`
  const dEnd = new Date(end)
  const sameDay = dStart.toDateString() === dEnd.toDateString()
  const endTime = formatTime(end)
  if (sameDay) {
    if (startTime === endTime) return `${startDate} à ${startTime}`
    return `${startDate}, ${startTime} — ${endTime}`
  }
  return `Du ${formatDateShort(start)} à ${startTime} au ${formatDateShort(end)} à ${endTime}`
})

const isMultiDay = computed(() => {
  const start = event.value?.date_start
  const end = event.value?.date_end
  if (!start || !end) return false
  return new Date(start).toDateString() !== new Date(end).toDateString()
})

const totalQuantity = computed(() => ticketCategories.value.reduce((sum: number, t: any) => sum + t.quantity, 0))
const totalPrice = computed(() => ticketCategories.value.reduce((sum: number, t: any) => sum + t.price * t.quantity, 0))
const selectedItems = computed(() => ticketCategories.value.filter((t: any) => t.quantity > 0))

function decreaseQty(ticket: any) {
  if ((ticketQuantities.value[ticket.id] ?? 0) > 0) {
    ticketQuantities.value[ticket.id] = (ticketQuantities.value[ticket.id] ?? 0) - 1
  }
}
function increaseQty(ticket: any) {
  const current = ticketQuantities.value[ticket.id] ?? 0
  const maxPerOrder = 10
  const stockCap = typeof ticket.remaining === 'number' ? ticket.remaining : Number.POSITIVE_INFINITY
  if (current < maxPerOrder && current < stockCap) {
    ticketQuantities.value[ticket.id] = current + 1
  }
}

const registrationData = ref({
  guest_name: '',
  guest_email: '',
  guest_phone: '',
  guest_company: ''
})

const registrationErrors = ref<Record<string, string>>({})

function validateRegistration(): boolean {
  const errors: Record<string, string> = {}
  const fields = event.value?.registration_fields ?? []
  if (fields.includes('full_name') && !registrationData.value.guest_name.trim()) {
    errors.guest_name = 'Veuillez saisir votre nom complet'
  }
  if (fields.includes('email') && !registrationData.value.guest_email.trim()) {
    errors.guest_email = 'Veuillez saisir votre email'
  } else if (fields.includes('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registrationData.value.guest_email)) {
    errors.guest_email = 'Adresse email invalide'
  }
  if (fields.includes('phone') && !registrationData.value.guest_phone.trim()) {
    errors.guest_phone = 'Veuillez saisir votre num\u00e9ro de t\u00e9l\u00e9phone'
  }
  if (fields.includes('company') && !registrationData.value.guest_company.trim()) {
    errors.guest_company = 'Veuillez saisir le nom de votre entreprise'
  }
  registrationErrors.value = errors
  return Object.keys(errors).length === 0
}

const hasCoupon = ref(false)
const couponCode = ref('')
const checkoutLoading = ref(false)

async function goToCheckout() {
  if (!event.value) return

  checkoutLoading.value = true
  try {
    cartStore.clearCart()
    cartStore.eventId = event.value.id

    selectedItems.value.forEach((t: any) => {
      cartStore.addItem({ id: t.id, name: t.name, price: t.price }, t.quantity)
    })

    // Valider le formulaire d'inscription si nécessaire
    if (isInscription.value && event.value?.registration_fields?.length) {
      if (!validateRegistration()) return
    }

    await navigateTo({
      path: '/checkout',
      state: {
        eventId: event.value.id,
        eventSlug: event.value.slug || null,
        eventName: event.value.title,
        eventDate: formatEventDate(event.value.date_start),
        eventLocation: [event.value.location, event.value.city].filter(Boolean).join(', '),
        couponCode: hasCoupon.value ? couponCode.value : null,
        accessMode: accessMode.value,
        guestName: registrationData.value.guest_name || null,
        guestEmail: registrationData.value.guest_email || null,
        guestPhone: registrationData.value.guest_phone || null,
        guestCompany: registrationData.value.guest_company || null
      }
    })
  } finally {
    checkoutLoading.value = false
  }
}

function scrollToBillets() {
  document.getElementById('billets')?.scrollIntoView({ behavior: 'smooth' })
}

// SEO dynamique
watchEffect(() => {
  if (!event.value) return

  const e = event.value
  const seoTitle = `${e.title} | BilletEvent`
  const seoDescription = e.description
    ? e.description.replace(/<[^>]*>/g, '').substring(0, 160)
    : `Découvrez ${e.title} sur BilletEvent`
  const seoImage = e.flyer_url || e.cover_image || e.image || '/logo.png'
  const seoUrl = `https://billetevent.com/events/${e.slug || e.id}`

  useSeoMeta({
    title: seoTitle,
    ogTitle: seoTitle,
    description: seoDescription,
    ogDescription: seoDescription,
    ogImage: seoImage,
    ogUrl: seoUrl,
    ogType: 'website',
    ogSiteName: 'BilletEvent',
    twitterCard: 'summary_large_image',
    twitterTitle: seoTitle,
    twitterDescription: seoDescription,
    twitterImage: seoImage,
  })

  useHead({
    script: [
      {
        type: 'application/ld+json',
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: e.title,
          description: seoDescription,
          image: seoImage,
          startDate: e.date_start,
          endDate: e.date_end,
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: e.event_type === 'enligne'
            ? 'https://schema.org/OnlineEventAttendanceMode'
            : e.event_type === 'hybride'
              ? 'https://schema.org/MixedEventAttendanceMode'
              : 'https://schema.org/OfflineEventAttendanceMode',
          location: {
            '@type': 'Place',
            name: e.location || e.city,
            address: {
              '@type': 'PostalAddress',
              addressLocality: e.city,
              addressCountry: e.country,
              streetAddress: e.address,
            }
          },
          organizer: {
            '@type': 'Organization',
            name: e.organizer?.display_name || e.organizer?.name || e.organizer?.first_name,
          },
          offers: e.passes?.length ? {
            '@type': 'AggregateOffer',
            lowPrice: Math.min(...e.passes.map((p: any) => p.price || 0)),
            highPrice: Math.max(...e.passes.map((p: any) => p.price || 0)),
            priceCurrency: 'XOF',
            availability: 'https://schema.org/InStock',
          } : undefined,
        })
      }
    ]
  })
})
</script>

<template>
  <div>
    <div v-if="loading" class="w-full h-[420px] bg-gray-200 animate-pulse max-sm:h-[280px]" />
    <div v-else-if="event" class="w-full overflow-x-hidden">
      <div class="w-full h-[420px] flex items-center justify-center relative overflow-hidden bg-bg-secondary max-sm:h-[280px]">
        <NuxtImg v-if="event.flyer_url" :src="event.flyer_url" :alt="event.title" class="w-full h-full object-cover" preload />
        <div v-else class="flex flex-col items-center gap-3 text-center px-6 py-10">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-text-tertiary"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <div class="font-serif text-2xl text-text-secondary tracking-tight">Bannière de l'événement</div>
          <div class="text-sm text-text-tertiary">L'image ajoutée lors de la création apparaîtra ici</div>
        </div>
      </div>
    </div>

    <div class="bg-surface border-b border-border-light overflow-x-auto">
      <div class="max-w-[1160px] mx-auto px-10 flex items-center max-md:px-5 max-sm:flex-col max-sm:px-3 max-sm:items-stretch">
        <div class="inline-flex items-center gap-2 border-r border-border-light px-5 py-3 whitespace-nowrap max-sm:border-r-0 max-sm:border-b max-sm:px-4 max-sm:py-2.5 max-sm:justify-start">
          <span v-if="event?.event_type === 'enligne'" class="inline-flex items-center gap-1.5 px-3 py-[5px] rounded-full text-[0.73rem] font-bold tracking-wide bg-blue-50 text-blue-600">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"/></svg>
            En ligne
          </span>
          <span v-else-if="event?.event_type === 'hybride'" class="inline-flex items-center gap-1.5 px-3 py-[5px] rounded-full text-[0.73rem] font-bold tracking-wide bg-purple-50 text-purple-600">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Hybride
          </span>
          <span v-else class="inline-flex items-center gap-1.5 px-3 py-[5px] rounded-full text-[0.73rem] font-bold tracking-wide bg-orange-dim text-orange-primary">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Présentiel
          </span>
          <span v-if="event?.is_private" class="inline-flex items-center gap-1.5 px-3 py-[5px] rounded-full text-[0.73rem] font-bold tracking-wide bg-purple/10 text-purple">
            Événement privé
          </span>
        </div>
        <div class="flex items-start gap-2.5 px-6 py-3.5 border-r border-border-light max-sm:whitespace-normal max-sm:px-4 max-sm:py-3 max-sm:border-r-0 max-sm:border-b max-sm:w-full">
          <div class="w-8 h-8 rounded-lg bg-bg-primary flex items-center justify-center shrink-0 mt-0.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div>
          <div class="min-w-0"><div class="text-xs text-text-secondary uppercase tracking-widest mb-px">Date</div><div class="text-sm font-semibold text-text-primary break-words">{{ event ? formattedDateRange : '' }}</div></div>
        </div>
        <div class="flex items-start gap-2.5 px-6 py-3.5 border-r border-border-light max-sm:whitespace-normal max-sm:px-4 max-sm:py-3 max-sm:border-b max-sm:border-r-0 max-sm:w-full">
          <div class="w-8 h-8 rounded-lg bg-bg-primary flex items-center justify-center shrink-0 mt-0.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
          <div class="min-w-0"><div class="text-xs text-text-secondary uppercase tracking-widest mb-px">Lieu</div><div class="text-sm font-semibold text-text-primary break-words">{{ event ? [event.venue || event.location, event.city].filter(Boolean).join(', ') : '' }}</div></div>
        </div>
        <div class="flex items-start gap-2.5 px-6 py-3.5 border-r border-border-light max-sm:whitespace-normal max-sm:px-4 max-sm:py-3 max-sm:border-b max-sm:border-r-0 max-sm:w-full">
          <div class="w-8 h-8 rounded-lg bg-bg-primary flex items-center justify-center shrink-0 mt-0.5"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          <div class="min-w-0"><div class="text-xs text-text-secondary uppercase tracking-widest mb-px">Participants</div><div class="text-sm font-semibold text-text-primary">{{ event?.max_capacity ? new Intl.NumberFormat('fr-FR').format(event.max_capacity) : '—' }}</div></div>
        </div>
        <div class="flex items-start gap-2.5 px-6 py-3.5 max-sm:whitespace-normal max-sm:px-4 max-sm:py-3 max-sm:w-full">
          <div class="w-8 h-8 rounded-lg bg-bg-primary flex items-center justify-center shrink-0"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><line x1="9" y1="9" x2="9" y2="15"/></svg></div>
          <div class="min-w-0"><div class="text-xs text-text-secondary uppercase tracking-widest mb-px">{{ isLibre ? 'Accès' : 'À partir de' }}</div><div class="text-sm font-semibold text-text-primary">{{ isLibre ? 'Entrée libre' : (event?.min_price != null ? formatPrice(event.min_price) : '—') }}</div></div>
        </div>
      </div>
    </div>

    <div class="max-w-[1160px] mx-auto px-10 py-12 grid grid-cols-[1fr_340px] gap-10 items-start max-md:grid-cols-1 max-md:px-5 max-md:py-7 max-md:gap-6 max-sm:px-4 max-sm:py-4 max-sm:gap-[18px]">
      <div class="flex flex-col gap-7">
        <div>
          <div class="flex items-center justify-between flex-wrap gap-3 mb-3.5 max-sm:flex-col max-sm:items-start max-sm:gap-2.5">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-full bg-orange-primary flex items-center justify-center text-xl border-2 border-border-light">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <div class="text-xs text-text-tertiary mb-0.5">Organisé par</div>
                <div class="text-sm font-semibold text-text-primary">{{ event?.organizer?.display_name || event?.organizer?.name || '' }}</div>
              </div>
            </div>
            <button v-if="showFollowButton" :disabled="followLoading" class="px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-colors" :class="isFollowing ? 'border border-orange-primary text-orange-primary hover:bg-orange-50' : 'bg-orange-primary text-white hover:bg-orange-600'" @click="toggleFollow">{{ isFollowing ? 'Suivi' : 'Suivre' }}</button>
          </div>
          <h1 class="font-serif text-[clamp(1.5rem,3.5vw,2.3rem)] leading-[1.15] text-text-primary max-sm:text-[clamp(1.3rem,5vw,1.7rem)] break-words">{{ event?.title ?? '' }}</h1>
        </div>

        <div class="bg-surface border border-border-light rounded-xl p-7  max-sm:p-4">
          <h2 class="font-serif text-lg font-normal mb-4 text-text-primary">À propos de cet événement</h2>
          <div class="relative" :class="{ 'max-h-[120px] overflow-hidden': !showFullDesc }">
            <div class="text-sm text-ink2 leading-relaxed mb-3 whitespace-pre-line">{{ event?.description ?? '' }}</div>
            <div v-if="!showFullDesc" class="absolute bottom-0 left-0 right-0 h-[50px] bg-gradient-to-t from-surface to-transparent"></div>
          </div>
          <button v-if="!showFullDesc" class="text-sm font-semibold text-orange-primary cursor-pointer inline-flex items-center gap-1 mt-2.5 border-none bg-transparent font-sans transition-all hover:gap-2" @click="showFullDesc = true">Lire la suite →</button>
          <div class="flex items-center gap-2 flex-wrap mt-5 pt-5 border-t border-border-light">
            <span class="text-xs text-text-tertiary">Thèmes:</span>
            <span v-if="event?.category" class="bg-bg-primary border border-border-light rounded-full px-3 py-1 text-xs font-medium text-ink2">{{ event.category }}</span>
          </div>
        </div>

        <div v-if="youtubeEmbedUrl" id="video" class="bg-surface border border-border-light rounded-xl p-7 max-sm:p-4">
          <h2 class="font-serif text-lg font-normal mb-4 text-text-primary">Vidéo</h2>
          <div class="relative w-full rounded-lg overflow-hidden" style="padding-bottom: 56.25%;">
            <iframe
              :src="youtubeEmbedUrl"
              class="absolute top-0 left-0 w-full h-full border-0"
              loading="lazy"
              allowfullscreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            ></iframe>
          </div>
        </div>

        <div id="programme" class="bg-surface border border-border-light rounded-xl p-7 max-sm:p-4 overflow-hidden">
          <h2 class="font-serif text-lg font-normal mb-4 text-text-primary">Programme du jour</h2>
          <div v-if="programme.length === 0" class="text-sm text-text-tertiary italic py-4">Aucun programme n'a été ajouté pour cet événement.</div>
          <div v-else class="flex flex-col">
            <div v-for="(item, i) in programme" :key="i" class="grid grid-cols-[64px_1fr_auto] items-center gap-4 py-[15px] px-1.5 border-b border-border-light rounded-lg transition-colors hover:bg-bg-primary last:border-b-0 max-sm:grid-cols-[44px_1fr_auto] max-sm:gap-2 max-sm:px-0">
              <div class="text-center bg-bg-primary rounded-lg py-2 px-1">
                <div class="font-serif text-[1.05rem] text-text-primary leading-none max-sm:text-[0.9rem]">{{ item.time }}</div>
                <div class="text-[0.62rem] text-text-tertiary uppercase tracking-wide">{{ item.ampm }}</div>
              </div>
              <div class="min-w-0">
                <div class="text-sm font-semibold text-text-primary mb-[3px] break-words">{{ item.title }}</div>
                <div class="text-[0.77rem] text-text-tertiary break-words">{{ item.sub }}</div>
              </div>
              <span class="px-2 py-1 rounded-full text-[0.67rem] font-bold tracking-wide uppercase whitespace-nowrap border max-sm:text-[0.6rem] max-sm:px-1.5 shrink-0" :class="item.chipClass">{{ item.chip }}</span>
            </div>
          </div>
        </div>

        <section v-if="event?.gallery?.length" id="galerie" class="bg-surface border border-border-light rounded-xl p-7 max-sm:p-4 overflow-hidden">
          <h2 class="font-serif text-lg font-normal mb-4 text-text-primary">Galerie photos</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <div v-for="(img, i) in event.gallery" :key="i"
                 class="aspect-[4/3] rounded-xl overflow-hidden cursor-pointer transition-opacity hover:opacity-85"
                 @click="openLightbox(i)">
              <NuxtImg :src="img" :alt="`Photo ${i + 1}`" class="w-full h-full object-cover" loading="lazy" :placeholder="[20, 20]" />
            </div>
          </div>
        </section>

        <div id="artistes" class="bg-surface border border-border-light rounded-xl p-7 max-sm:p-4 overflow-hidden">
          <h2 class="font-serif text-lg font-normal mb-4 text-text-primary break-words">Artistes &amp; Intervenants</h2>
          <div v-if="artists.length === 0" class="text-sm text-text-tertiary italic py-4">Aucun artiste n'a été annoncé pour cet événement.</div>
          <div v-else class="grid grid-cols-3 gap-4 max-sm:grid-cols-2">
            <div v-for="(artist, i) in artists" :key="i" class="flex flex-col items-center text-center p-4 pb-4 border border-border-light rounded-xl bg-surface transition-colors hover:border-orange-primary max-sm:p-3">
              <div class="w-24 h-24 rounded-full mb-3.5 shrink-0 overflow-hidden border-[3px] border-border-light bg-[#e8e4dc] max-sm:w-16 max-sm:h-16 max-sm:mb-2.5">
                <NuxtImg :src="artist.img" :alt="artist.name" class="w-full h-full object-cover block" :width="96" :height="96" loading="lazy" :placeholder="[20, 20]" />
              </div>
              <div class="font-serif text-base text-text-primary mb-1.5 break-words w-full leading-snug max-sm:text-sm max-sm:leading-tight">{{ artist.name }}</div>
              <div class="inline-block text-xs font-bold tracking-wide uppercase bg-bg-primary text-text-tertiary px-3 py-1 rounded-full max-w-full leading-tight truncate">{{ artist.role }}</div>
            </div>
          </div>
        </div>

        <div class="bg-surface border border-border-light rounded-xl p-7  max-sm:p-4">
          <h2 class="font-serif text-lg font-normal mb-4 text-text-primary">Infos pratiques</h2>
          <div class="flex flex-col">
            <div class="flex items-center justify-between py-3.5 border-b border-border-light gap-3">
              <div class="flex items-center gap-2.5"><span class="text-base w-5 text-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></span><span class="text-[0.83rem] text-text-tertiary">Accès</span></div>
              <span class="text-[0.85rem] font-bold text-text-primary">{{ event?.is_private ? 'Sur invitation' : 'Ouvert à tous' }}</span>
            </div>
            <div class="flex items-center justify-between py-3.5 border-b border-border-light gap-3">
              <div class="flex items-center gap-2.5"><span class="text-base w-5 text-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></span><span class="text-[0.83rem] text-text-tertiary">Format</span></div>
              <span class="text-[0.85rem] font-bold text-text-primary">{{ event?.event_type === 'enligne' ? 'En ligne' : event?.event_type === 'hybride' ? 'Hybride' : 'Présentiel' }}</span>
            </div>
            <div class="flex items-center justify-between py-3.5 border-b border-border-light gap-3">
              <div class="flex items-center gap-2.5"><span class="text-base w-5 text-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg></span><span class="text-[0.83rem] text-text-tertiary">Ticket</span></div>
              <span class="text-[0.85rem] font-bold text-text-primary">Mobile · PDF</span>
            </div>
            <div v-if="isMultiDay" class="flex items-center justify-between py-3.5 border-b border-border-light gap-3">
              <div class="flex items-center gap-2.5"><span class="text-base w-5 text-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></span><span class="text-[0.83rem] text-text-tertiary">Dates</span></div>
              <span class="text-[0.85rem] font-bold text-text-primary text-right">Du {{ formatDateShort(event?.date_start) }}<br/>au {{ formatDateShort(event?.date_end) }}</span>
            </div>
            <div class="flex items-center justify-between py-3.5 gap-3" :class="{ 'border-b border-border-light': event?.online_link && (event?.event_type === 'enligne' || event?.event_type === 'hybride') }">
              <div class="flex items-center gap-2.5"><span class="text-base w-5 text-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg></span><span class="text-[0.83rem] text-text-tertiary">Remboursement</span></div>
              <span class="text-[0.85rem] font-bold text-text-primary">{{ event?.refund_policy_label || 'Non remboursable' }}</span>
            </div>
            <div v-if="event?.online_link && (event?.event_type === 'enligne' || event?.event_type === 'hybride')" class="flex items-start gap-3 py-3.5">
              <span class="text-base w-5 text-center shrink-0 mt-0.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-text-tertiary"><path d="M15 10l4.553-2.276A1 1 0 0 1 21 8.618v6.764a1 1 0 0 1-1.447.894L15 14M5 18h8a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z"/></svg>
              </span>
              <div class="flex-1 min-w-0">
                <div class="text-[0.83rem] font-medium text-text-primary">{{ event.online_platform || 'Événement en ligne' }}</div>
                <a :href="event.online_link" target="_blank" rel="noopener" class="text-[0.83rem] text-orange-primary hover:underline break-all">{{ event.online_link }}</a>
              </div>
            </div>
          </div>
        </div>

        <div id="emplacement" class="bg-surface border border-border-light rounded-xl p-7 max-sm:p-4 overflow-hidden">
          <h2 class="font-serif text-lg font-normal mb-4 text-text-primary">Lieu &amp; Accès</h2>
          <div class="rounded-lg overflow-hidden border border-border-light">
            <div v-if="event?.latitude && event?.longitude" class="w-full h-[200px] max-sm:h-[140px]">
              <iframe
                v-if="mapVisible"
                :src="`https://www.openstreetmap.org/export/embed.html?bbox=${event.longitude-0.01},${event.latitude-0.01},${event.longitude+0.01},${event.latitude+0.01}&layer=mapnik&marker=${event.latitude},${event.longitude}`"
                class="w-full h-full border-0"
                loading="lazy"
                title="Carte du lieu"
              ></iframe>
              <button
                v-else
                type="button"
                class="w-full h-full bg-bg-secondary flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-bg-primary transition-colors"
                @click="mapVisible = true"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-text-tertiary"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span class="text-sm font-medium text-text-secondary">Afficher la carte</span>
                <span class="text-xs text-text-tertiary">Cliquez pour charger</span>
              </button>
            </div>
            <div v-else class="w-full h-[200px] max-sm:h-[140px] bg-bg-secondary flex items-center justify-center cursor-pointer">
              <div class="text-center">
                <div class="flex justify-center mb-2.5"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-text-tertiary"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg></div>
                <span class="inline-flex items-center gap-1.5 bg-surface border border-border-light rounded-full px-[18px] py-2 text-[0.78rem] font-semibold text-text-primary ">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Voir sur la carte
                </span>
              </div>
            </div>
            <div class="p-5 flex flex-col gap-3.5">
              <div class="font-serif text-[1.1rem] text-text-primary">{{ event?.venue || event?.location || '' }}</div>
              <div class="text-[0.8rem] text-text-tertiary leading-[1.7] border-l-[3px] border-orange-primary pl-3">{{ event?.address ?? '' }}<br/>{{ [event?.city, event?.country].filter(Boolean).join(', ') }}</div>
              <div v-if="event?.transport_options?.length" class="flex gap-2 flex-wrap">
                <span v-for="opt in event.transport_options" :key="opt" class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-bg-primary border border-border-light text-[0.78rem] font-semibold text-ink2">{{ opt }}</span>
              </div>
              <div v-if="event?.access_instructions" class="mt-4">
                <h4 class="text-sm font-semibold text-text-primary mb-2">Comment accéder</h4>
                <p class="text-sm text-text-secondary leading-relaxed whitespace-pre-line">{{ event.access_instructions }}</p>
              </div>
              <div class="flex gap-2.5 flex-wrap">
                <a v-if="event?.latitude && event?.longitude" :href="`https://www.google.com/maps?q=${event.latitude},${event.longitude}`" target="_blank" rel="noopener" class="inline-flex items-center gap-2 px-[18px] py-2.5 rounded-full bg-orange-primary text-white text-[0.78rem] font-bold no-underline transition-all hover:bg-orange-light">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Voir sur Google Maps
                </a>
                <a v-else :href="`https://maps.google.com/?q=${encodeURIComponent([event?.location, event?.address, event?.city, event?.country].filter(Boolean).join(', '))}`" target="_blank" rel="noopener" class="inline-flex items-center gap-2 px-[18px] py-2.5 rounded-full bg-orange-primary text-white text-[0.78rem] font-bold no-underline transition-all hover:bg-orange-light">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Ouvrir dans Google Maps
                </a>
                <button class="inline-flex items-center gap-2 px-[18px] py-2.5 rounded-full bg-surface border-[1.5px] border-border-light text-ink2 text-[0.78rem] font-bold cursor-pointer transition-all font-sans" :class="locationCopied ? 'border-green-dark text-green-dark' : 'hover:border-orange-primary hover:text-orange-primary'" @click="copyLocation">
                  <svg v-if="!locationCopied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {{ locationCopied ? 'Copié !' : 'Copier l\'adresse' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-5 sticky top-[72px] max-md:static max-md:top-auto">
        <!-- Encart Entrée libre -->
        <div v-if="isLibre" id="billets" class="bg-white rounded-xl p-6 ">
          <div class="flex flex-col items-center text-center py-4">
            <div class="w-14 h-14 rounded-full bg-bg-primary flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="text-text-secondary"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="font-serif text-lg text-text-primary mb-2">Entrée libre</div>
            <div class="text-sm text-text-secondary leading-relaxed">Cet événement est en accès libre. Aucune inscription ni billet requis.</div>
          </div>
        </div>

        <div v-else id="billets" class="bg-surface border border-border-light rounded-xl  overflow-hidden">
          <div class="px-6 pt-5 pb-4">
            <div class="text-xs font-bold tracking-[0.12em] uppercase text-text-tertiary mb-1">{{ isInscription ? "S'inscrire" : 'Réserver ma place' }}</div>
            <div class="font-serif text-base text-text-primary">{{ isInscription ? 'Inscription gratuite' : 'Choisissez vos billets' }}</div>
          </div>
          <div class="h-px bg-border-light"></div>

          <div v-if="event?.is_invitation_only" class="px-5 py-8 text-center">
            <div class="w-12 h-12 rounded-full bg-purple/10 flex items-center justify-center mx-auto mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-purple"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            </div>
            <div class="text-base font-bold text-text-primary mb-1">Sur invitation uniquement</div>
            <div class="text-sm text-text-tertiary">Cet événement est accessible uniquement sur invitation de l'organisateur.</div>
          </div>

          <template v-else>

          <div v-for="ticket in ticketCategories" :key="ticket.id" class="px-5 py-4 border-b border-border-light last:border-b-0">
            <div class="flex items-start justify-between gap-3 mb-2">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-sm font-bold text-text-primary">{{ ticket.name }}</span>
                  <span v-if="ticket.badgeType === 'limited'" class="text-xs font-medium text-text-tertiary">
                    {{ ticket.remaining }} restants
                  </span>
                </div>
                <div v-if="ticket.description" class="text-xs text-text-tertiary mb-1 line-clamp-2">{{ ticket.description }}</div>
                <div class="font-serif text-[1.05rem] text-text-primary">{{ formatPrice(ticket.price) }}</div>
                <div class="text-xs text-text-tertiary">{{ ticket.remaining }} restant{{ ticket.remaining > 1 ? 's' : '' }}</div>
                <div v-if="ticket.saleStart || ticket.saleEnd" class="text-xs text-text-tertiary mt-1">
                  <span v-if="ticket.saleStart">Vente à partir du {{ ticket.saleStart }}</span>
                  <span v-if="ticket.saleStart && ticket.saleEnd"> — </span>
                  <span v-if="ticket.saleEnd">Jusqu'au {{ ticket.saleEnd }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                <button type="button" aria-label="Diminuer la quantité" class="w-11 h-11 rounded-lg border border-border-light bg-bg-primary flex items-center justify-center cursor-pointer transition-colors font-sans text-lg text-text-secondary hover:border-orange-primary hover:text-orange-primary disabled:opacity-30 disabled:cursor-not-allowed" :disabled="ticket.quantity === 0" @click="decreaseQty(ticket)">−</button>
                <span class="w-9 text-center font-bold text-base text-text-primary tabular-nums" aria-live="polite">{{ ticket.quantity }}</span>
                <button type="button" aria-label="Augmenter la quantité" class="w-11 h-11 rounded-lg border border-border-light bg-bg-primary flex items-center justify-center cursor-pointer transition-colors font-sans text-lg text-text-secondary hover:border-orange-primary hover:text-orange-primary disabled:opacity-30 disabled:cursor-not-allowed" :disabled="ticket.quantity >= 10" @click="increaseQty(ticket)">+</button>
              </div>
            </div>
          </div>

          <div v-if="totalQuantity > 0" class="px-5 pt-4 pb-2 border-t border-border-light">
            <div class="text-sm font-bold text-text-primary mb-2">Votre commande</div>
            <div v-for="item in selectedItems" :key="item.id" class="flex justify-between text-sm text-text-secondary py-1">
              <span>{{ item.quantity }} x {{ item.name }}</span>
              <span class="font-semibold text-text-primary">{{ formatPrice(item.price * item.quantity) }}</span>
            </div>
            <div class="h-px bg-border-light my-2.5"></div>
            <div class="flex justify-between items-center">
              <span class="text-sm font-bold text-text-primary">Total</span>
              <span class="font-bold text-xl text-text-primary">{{ formatPrice(totalPrice) }}</span>
            </div>
          </div>

          <!-- Formulaire d'inscription -->
          <div v-if="isInscription && event?.registration_fields?.length" class="px-5 pt-4 pb-2">
            <div class="text-xs font-semibold text-text-secondary mb-3">Informations d'inscription</div>
            <div class="flex flex-col gap-2.5">
              <div v-if="event.registration_fields.includes('full_name')">
                <input v-model="registrationData.guest_name" type="text" autocomplete="name" autocapitalize="words"
                  class="w-full px-3.5 py-2.5 rounded-xl border bg-bg-primary text-sm text-text-primary font-sans outline-none transition-colors focus:border-orange-primary"
                  :class="registrationErrors.guest_name ? 'border-red-400' : 'border-border-light'"
                  placeholder="Nom complet" />
                <p v-if="registrationErrors.guest_name" class="text-xs text-red-500 mt-1">{{ registrationErrors.guest_name }}</p>
              </div>
              <div v-if="event.registration_fields.includes('email')">
                <input v-model="registrationData.guest_email" type="email" autocomplete="email" inputmode="email" autocapitalize="off" autocorrect="off" spellcheck="false"
                  class="w-full px-3.5 py-2.5 rounded-xl border bg-bg-primary text-sm text-text-primary font-sans outline-none transition-colors focus:border-orange-primary"
                  :class="registrationErrors.guest_email ? 'border-red-400' : 'border-border-light'"
                  placeholder="votre@email.com" />
                <p v-if="registrationErrors.guest_email" class="text-xs text-red-500 mt-1">{{ registrationErrors.guest_email }}</p>
              </div>
              <div v-if="event.registration_fields.includes('phone')">
                <input v-model="registrationData.guest_phone" type="tel" autocomplete="tel" inputmode="tel"
                  class="w-full px-3.5 py-2.5 rounded-xl border bg-bg-primary text-sm text-text-primary font-sans outline-none transition-colors focus:border-orange-primary"
                  :class="registrationErrors.guest_phone ? 'border-red-400' : 'border-border-light'"
                  placeholder="+229 XX XX XX XX" />
                <p v-if="registrationErrors.guest_phone" class="text-xs text-red-500 mt-1">{{ registrationErrors.guest_phone }}</p>
              </div>
              <div v-if="event.registration_fields.includes('company')">
                <input v-model="registrationData.guest_company" type="text" autocomplete="organization"
                  class="w-full px-3.5 py-2.5 rounded-xl border bg-bg-primary text-sm text-text-primary font-sans outline-none transition-colors focus:border-orange-primary"
                  :class="registrationErrors.guest_company ? 'border-red-400' : 'border-border-light'"
                  placeholder="Nom de votre entreprise" />
                <p v-if="registrationErrors.guest_company" class="text-xs text-red-500 mt-1">{{ registrationErrors.guest_company }}</p>
              </div>
            </div>
          </div>

          <div v-if="totalQuantity > 0" class="px-5 pt-3 pb-5">
            <div class="flex flex-col gap-2.5">
              <label class="flex items-center gap-2 cursor-pointer">
                <input v-model="hasCoupon" type="checkbox" class="w-4 h-4 accent-orange-primary cursor-pointer" />
                <span class="text-sm text-text-secondary">J'ai un code promo</span>
              </label>
              <input v-if="hasCoupon" v-model="couponCode" type="text" placeholder="Entrez votre code promo" class="w-full px-3.5 py-2.5 rounded-xl border border-border-light bg-bg-primary text-sm text-text-primary font-sans outline-none transition-colors focus:border-orange-primary" />
            </div>
            <button class="flex items-center justify-center gap-2 w-full bg-orange-primary text-white py-3.5 rounded-xl text-sm font-bold border-none cursor-pointer transition-colors hover:bg-orange-light font-sans mt-4 disabled:opacity-60 disabled:cursor-not-allowed" :disabled="checkoutLoading" @click="goToCheckout">
              <svg v-if="checkoutLoading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>
              {{ checkoutLoading ? 'Traitement...' : (isInscription ? "S'inscrire" : 'Continuer') }}
            </button>
          </div>

          <div v-if="totalQuantity === 0" class="px-5 pt-3 pb-5">
            <div class="flex justify-center gap-3.5 flex-wrap">
              <span class="flex items-center gap-[5px] text-[0.7rem] text-text-tertiary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Paiement sécurisé
              </span>
              <span class="flex items-center gap-[5px] text-[0.7rem] text-text-tertiary">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                Réception instantanée
              </span>
              <span class="flex items-center gap-[5px] text-[0.7rem] text-text-tertiary">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Remboursable
              </span>
            </div>
          </div>
          </template>
        </div>


        <div class="bg-surface border border-border-light rounded-xl p-5 ">
          <div class="text-xs font-bold tracking-[0.1em] uppercase text-text-tertiary mb-3">Partager cet événement</div>
          <div class="flex gap-2 flex-wrap">
            <button class="flex-1 min-w-[70px] flex items-center justify-center gap-[5px] border border-border-light rounded-lg py-[9px] px-1.5 text-xs font-semibold text-ink2 cursor-pointer bg-bg-primary transition-all font-sans hover:border-orange-primary hover:text-orange-primary" :class="linkCopied ? 'border-green-dark text-green-dark' : ''" @click="copyEventLink">
              <svg v-if="!linkCopied" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              {{ linkCopied ? 'Copié !' : 'Lien' }}
            </button>
            <button class="flex-1 min-w-[70px] flex items-center justify-center gap-[5px] border border-border-light rounded-lg py-[9px] px-1.5 text-xs font-semibold text-ink2 cursor-pointer bg-bg-primary transition-all font-sans hover:border-orange-primary hover:text-orange-primary" @click="shareWhatsApp">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              WhatsApp
            </button>
            <button class="flex-1 min-w-[70px] flex items-center justify-center gap-[5px] border border-border-light rounded-lg py-[9px] px-1.5 text-xs font-semibold text-ink2 cursor-pointer bg-bg-primary transition-all font-sans hover:border-orange-primary hover:text-orange-primary" @click="shareTwitter">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>
              Twitter
            </button>
            <button class="flex-1 min-w-[70px] flex items-center justify-center gap-[5px] border border-border-light rounded-lg py-[9px] px-1.5 text-xs font-semibold text-ink2 cursor-pointer bg-bg-primary transition-all font-sans hover:border-orange-primary hover:text-orange-primary" @click="shareLinkedIn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
              LinkedIn
            </button>
            <button class="flex-1 min-w-[70px] flex items-center justify-center gap-[5px] border border-border-light rounded-lg py-[9px] px-1.5 text-xs font-semibold text-ink2 cursor-pointer bg-bg-primary transition-all font-sans hover:border-orange-primary hover:text-orange-primary" @click="shareTelegram">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              Telegram
            </button>
            <button class="flex-1 min-w-[70px] flex items-center justify-center gap-[5px] border border-border-light rounded-lg py-[9px] px-1.5 text-xs font-semibold text-ink2 cursor-pointer bg-bg-primary transition-all font-sans hover:border-orange-primary hover:text-orange-primary" @click="shareEmail">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              Email
            </button>
          </div>
        </div>

        <div v-if="pointsDeVente.length > 0" class="bg-surface border border-border-light rounded-xl p-5 ">
          <div class="text-xs font-bold tracking-[0.12em] uppercase text-text-tertiary mb-3.5">Où acheter votre billet en personne</div>
          <div class="flex flex-col gap-3">
            <div v-for="(pdv, i) in pointsDeVente" :key="i" class="flex items-start gap-3.5 p-3.5 bg-bg-primary rounded-lg border border-border-light">
              <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" :class="pdv.typeColor === 'orange' ? 'bg-orange-dim text-orange-primary' : 'bg-blue-dim text-ink2'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-bold text-text-primary mb-[3px]">{{ pdv.name }}</div>
                <div class="text-xs text-ink2 mb-0.5">{{ pdv.addr }}</div>
                <div class="text-xs text-text-tertiary">{{ pdv.hours }}</div>
              </div>
              <div class="text-xs font-bold rounded-full px-2.5 py-1 whitespace-nowrap shrink-0" :class="pdv.typeColor === 'orange' ? 'text-orange-primary bg-orange-dim' : 'text-ink2 bg-blue-dim'">{{ pdv.type }}</div>
            </div>
            <div class="text-center text-xs text-text-tertiary py-1.5">Vous pouvez aussi acheter votre billet en ligne — paiement instantané.</div>
            <div class="text-center pt-2">
              <NuxtLink to="/points-de-vente" class="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-primary hover:underline">
                Voir tous les points de vente
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </NuxtLink>
            </div>
          </div>
        </div>

        <div id="faq" class="bg-surface border border-border-light rounded-xl p-5 ">
          <div class="text-xs font-bold tracking-[0.12em] uppercase text-text-tertiary mb-3.5">Questions fréquentes</div>
          <div v-for="(item, i) in faqItems" :key="i" class="border-b border-border-light last:border-b-0">
            <button class="w-full bg-transparent border-none text-left py-[13px] cursor-pointer flex justify-between items-center font-sans text-[0.84rem] font-medium text-text-primary gap-2.5" :aria-expanded="item.open" @click="toggleFaq(i)">
              {{ item.q }}
              <span class="text-orange-primary text-[1.1rem] shrink-0 transition-transform" :class="{ 'rotate-45': item.open }">+</span>
            </button>
            <div class="text-[0.8rem] text-text-tertiary leading-[1.7] overflow-hidden transition-all" :class="item.open ? 'max-h-[500px] pb-[13px]' : 'max-h-0'">{{ item.a }}</div>
          </div>
        </div>
      </div>
    </div>

    <section v-if="orgEvents.length > 0" class="bg-bg-secondary py-16 px-10 border-t border-border-light max-md:py-12 max-md:px-6 max-sm:py-9 max-sm:px-4">
      <div class="max-w-[1100px] mx-auto">
        <div class="flex items-center justify-between mb-8 flex-wrap gap-4 max-sm:flex-col max-sm:items-start">
          <div class="flex items-center gap-4">
            <div class="w-[48px] h-[48px] rounded-full bg-orange-primary flex items-center justify-center shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            </div>
            <div>
              <div class="text-xs font-semibold text-text-tertiary mb-0.5">Organisateur</div>
              <div class="font-serif text-lg text-text-primary leading-tight">{{ event?.organizer?.display_name || event?.organizer?.name || '' }}</div>
            </div>
          </div>
          <NuxtLink to="/events" class="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary border border-border-light px-5 py-2 rounded-full transition-all whitespace-nowrap hover:text-orange-primary hover:border-orange-primary">
            Voir tous les evenements
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </NuxtLink>
        </div>

        <div class="grid grid-cols-3 gap-5 max-md:grid-cols-1 max-md:gap-4">
          <NuxtLink v-for="evt in orgEvents" :key="evt.id" :to="`/events/${evt.slug || evt.id}`" class="bg-white border border-border-light rounded-xl overflow-hidden flex flex-col transition-all duration-200 cursor-pointer no-underline hover:bg-gray-50">
            <div class="h-[120px] relative overflow-hidden shrink-0 bg-bg-secondary">
              <NuxtImg v-if="evt.image" :src="evt.image" :alt="evt.title" class="w-full h-full object-cover" loading="lazy" :placeholder="[20, 20]" />
              <div v-else class="w-full h-full flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="text-text-tertiary"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
            </div>
            <div class="p-4 flex flex-col gap-2 flex-1">
              <div class="text-sm font-semibold text-text-primary leading-snug">{{ evt.title }}</div>
              <div class="flex flex-wrap gap-2.5">
                <span class="flex items-center gap-1 text-xs text-text-tertiary">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {{ evt.location }}
                </span>
              </div>
              <div class="flex items-center justify-between mt-auto pt-2 border-t border-border-light">
                <span class="text-sm font-bold text-text-primary">{{ evt.date ? new Date(evt.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '' }}</span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <footer class="bg-white border-t border-border-light py-8 px-5 text-center">
      <p class="text-sm text-gray-500 mb-1">{{ event?.organizer?.display_name || event?.organizer?.name || '' }} &copy; {{ new Date().getFullYear() }} All rights reserved.</p>
      <p class="text-xs text-gray-400">Powered by <a href="https://billetevent.com" target="_blank" rel="noopener" class="text-gray-500 hover:text-gray-700 transition-colors no-underline font-medium">BilletEvent</a></p>
    </footer>

    <!-- Lightbox galerie -->
    <Teleport to="body">
      <div v-if="lightboxOpen && event?.gallery?.length" ref="lightboxRef" role="dialog" aria-modal="true" tabindex="0" class="fixed inset-0 z-[500] bg-black/90 flex items-center justify-center p-4" @click.self="lightboxOpen = false" @keydown.esc="lightboxOpen = false">
        <button class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-2xl transition-colors cursor-pointer border-none z-10" aria-label="Fermer" @click="lightboxOpen = false">&times;</button>
        <button v-if="event.gallery.length > 1" class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition-colors cursor-pointer border-none z-10" aria-label="Photo précédente" @click.stop="lightboxPrev">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button v-if="event.gallery.length > 1" class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xl transition-colors cursor-pointer border-none z-10" aria-label="Photo suivante" @click.stop="lightboxNext">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <NuxtImg :src="event.gallery[lightboxIndex]" :alt="`Photo ${lightboxIndex + 1}`" class="max-w-full max-h-[90vh] rounded-lg object-contain" :placeholder="[20, 20]" />
        <div v-if="event.gallery.length > 1" class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white/70 text-xs font-medium px-3 py-1.5 rounded-full">{{ lightboxIndex + 1 }} / {{ event.gallery.length }}</div>
      </div>
    </Teleport>

    <!-- Bouton flottant Acheter un billet -->
    <a
      v-if="event && !event.is_invitation_only && !isLibre && totalQuantity === 0"
      href="#billets"
      class="fixed bottom-6 right-6 z-[150] px-5 py-3 rounded-full text-sm font-semibold bg-orange-primary text-white hover:bg-orange-light transition-all flex items-center gap-2 animate-fade-in-up"
      @click.prevent="scrollToBillets"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
      </svg>
      {{ isInscription ? "S'inscrire" : 'Acheter un billet' }}
    </a>

    <div v-if="totalQuantity > 0" class="fixed bottom-0 left-0 right-0 z-[300] bg-surface border-t border-border-light px-5 py-3 flex items-center justify-between gap-3  md:hidden" @click="scrollToBillets">
      <div>
        <div class="text-sm font-bold text-text-primary">{{ totalQuantity }} ticket{{ totalQuantity > 1 ? 's' : '' }}</div>
        <div class="text-sm font-bold text-orange-primary">{{ formatPrice(totalPrice) }}</div>
      </div>
      <button class="bg-orange-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold border-none cursor-pointer font-sans">
        Voir les billets
      </button>
    </div>
  </div>
</template>
