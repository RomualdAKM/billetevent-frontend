<script setup lang="ts">
definePageMeta({ layout: 'landing' })

const route = useRoute()
const { getEvent } = useEventsApi()
const cartStore = useCartStore()
const { initPixels, trackViewContent, cleanup } = useTracking()
const { success } = useNotification()

const { data: apiData, status } = await useAsyncData(
  `landing-${route.params.slug}`,
  () => getEvent(String(route.params.slug)),
)

const event = computed(() => apiData.value?.data ?? null)
const loading = computed(() => status.value === 'pending')

watch(status, (val) => {
  if (val === 'error' || (val === 'success' && !event.value)) {
    showError({ statusCode: 404, statusMessage: 'Événement introuvable' })
  }
})

const accessMode = computed(() => event.value?.access_mode || 'payant')
const isInscription = computed(() => accessMode.value === 'inscription')
const isLibre = computed(() => accessMode.value === 'libre')

// ── Pixels (organizer-defined Facebook/Google tracking) ────────
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
    // Tracking must never block the page
  }
}, { immediate: true })

onBeforeUnmount(() => cleanup())

// ── Formatting ─────────────────────────────────────────────────
const formatPrice = (price: number) => price === 0 ? 'Gratuit' : new Intl.NumberFormat('fr-FR').format(price) + ' F CFA'

const eventDateLong = computed(() => {
  if (!event.value?.date_start) return ''
  return new Date(event.value.date_start).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
})

const eventTime = computed(() => {
  if (!event.value?.date_start) return ''
  const d = new Date(event.value.date_start)
  return d.getHours().toString().padStart(2, '0') + 'h' + d.getMinutes().toString().padStart(2, '0')
})

const eventLocation = computed(() =>
  [event.value?.venue || event.value?.location, event.value?.city, event.value?.country]
    .filter(Boolean)
    .join(', '),
)

// ── Countdown ──────────────────────────────────────────────────
const now = ref(Date.now())
let countdownTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  countdownTimer = setInterval(() => { now.value = Date.now() }, 60_000)
})
onBeforeUnmount(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})

const countdown = computed(() => {
  if (!event.value?.date_start) return null
  const diff = new Date(event.value.date_start).getTime() - now.value
  if (diff <= 0) return null
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  return { days, hours, minutes }
})

// ── Tickets ────────────────────────────────────────────────────
const ticketQuantities = ref<Record<number | string, number>>({})

const passes = computed(() => {
  const list = event.value?.passes ?? []
  return list.map((p: any) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    quantity: ticketQuantities.value[p.id] ?? 0,
    remaining: p.available ?? Math.max(0, (p.capacity ?? 0) - (p.sold_count ?? 0)),
  }))
})

const totalQuantity = computed(() =>
  passes.value.reduce((sum: number, t: any) => sum + t.quantity, 0),
)
const totalPrice = computed(() =>
  passes.value.reduce((sum: number, t: any) => sum + t.price * t.quantity, 0),
)

function decrease(p: any) {
  if ((ticketQuantities.value[p.id] ?? 0) > 0) {
    ticketQuantities.value[p.id] = (ticketQuantities.value[p.id] ?? 0) - 1
  }
}
function increase(p: any) {
  const current = ticketQuantities.value[p.id] ?? 0
  if (current < 10 && current < p.remaining) {
    ticketQuantities.value[p.id] = current + 1
  }
}

const totalRemaining = computed(() =>
  passes.value.reduce((sum: number, p: any) => sum + Math.max(0, p.remaining || 0), 0),
)

const minPrice = computed(() => {
  const prices = passes.value
    .filter((p: any) => typeof p.price === 'number')
    .map((p: any) => p.price)
  return prices.length ? Math.min(...prices) : 0
})

const isSoldOut = computed(() =>
  event.value && passes.value.length > 0 && totalRemaining.value === 0,
)

const isPast = computed(() => {
  const start = event.value?.date_start
  if (!start) return false
  return new Date(start).getTime() < Date.now()
})

// ── Checkout navigation ────────────────────────────────────────
const checkoutLoading = ref(false)

async function goToCheckout() {
  if (!event.value || totalQuantity.value === 0) return
  checkoutLoading.value = true
  try {
    cartStore.clearCart()
    cartStore.eventId = event.value.id
    passes.value
      .filter((p: any) => p.quantity > 0)
      .forEach((p: any) => cartStore.addItem({ id: p.id, name: p.name, price: p.price }, p.quantity))

    await navigateTo({
      path: '/checkout',
      state: {
        eventId: event.value.id,
        eventSlug: event.value.slug || null,
        eventName: event.value.title,
        eventDate: eventDateLong.value,
        eventLocation: eventLocation.value,
        accessMode: accessMode.value,
      },
    })
  } finally {
    checkoutLoading.value = false
  }
}

function scrollToTickets() {
  if (typeof document !== 'undefined') {
    document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// ── Share ──────────────────────────────────────────────────────
const linkCopied = ref(false)
const shareUrl = computed(() => {
  if (typeof window !== 'undefined') return window.location.href
  return ''
})

const copyShareLink = () => {
  if (typeof navigator === 'undefined' || !navigator.clipboard) return
  navigator.clipboard.writeText(shareUrl.value).then(() => {
    linkCopied.value = true
    success('Lien copié !')
    setTimeout(() => { linkCopied.value = false }, 2500)
  })
}

const shareWhatsApp = () => {
  if (typeof window === 'undefined') return
  const text = encodeURIComponent(`Découvrez cet événement : ${event.value?.title}`)
  window.open(`https://wa.me/?text=${text}%20${encodeURIComponent(shareUrl.value)}`, '_blank')
}

// ── SEO / OG ───────────────────────────────────────────────────
watchEffect(() => {
  if (!event.value) return
  const e = event.value
  const title = `${e.title} — Billets`
  const description = e.description
    ? e.description.replace(/<[^>]*>/g, '').slice(0, 160)
    : `Réservez vos billets pour ${e.title}`
  const image = e.flyer_url || e.cover_image || e.image || '/logo.png'

  useSeoMeta({
    title,
    ogTitle: title,
    description,
    ogDescription: description,
    ogImage: image,
    ogType: 'website',
  })
})
</script>

<template>
  <div v-if="loading" class="min-h-screen flex items-center justify-center">
    <div class="w-6 h-6 border-2 border-orange-primary border-t-transparent rounded-full animate-spin" />
  </div>

  <div v-else-if="event" class="pb-24 md:pb-0">

    <!-- ─── Sticky mini-header ──────────────────────────────── -->
    <header class="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-border-light">
      <div class="max-w-[1080px] mx-auto px-5 py-3 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-lg overflow-hidden shrink-0 bg-bg-secondary">
            <NuxtImg
              v-if="event.flyer_url || event.cover_image"
              :src="event.flyer_url || event.cover_image"
              :alt="event.title"
              :width="36"
              :height="36"
              class="w-full h-full object-cover"
            />
          </div>
          <div class="min-w-0">
            <div class="font-serif text-[0.95rem] text-text-primary truncate">{{ event.title }}</div>
            <div class="text-[0.7rem] text-text-tertiary truncate">{{ event.organizer?.name || event.organizer?.company_name || 'Événement' }}</div>
          </div>
        </div>
        <button
          v-if="!isPast && !isSoldOut"
          type="button"
          class="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-orange-primary text-white text-sm font-bold hover:bg-orange-light transition-colors whitespace-nowrap shrink-0"
          @click="scrollToTickets"
        >
          {{ isInscription ? 'S\'inscrire' : 'Acheter mon billet' }}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </header>

    <!-- ─── HERO ───────────────────────────────────────────── -->
    <section class="relative overflow-hidden bg-blue-main">
      <NuxtImg
        v-if="event.flyer_url || event.cover_image"
        :src="event.flyer_url || event.cover_image"
        :alt="event.title"
        preload
        class="absolute inset-0 w-full h-full object-cover opacity-40"
      />
      <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/85" />
      <div class="relative max-w-[1080px] mx-auto px-5 py-16 md:py-24 text-white">
        <div class="inline-flex items-center gap-2 bg-orange-primary text-white text-[0.7rem] font-bold uppercase tracking-[0.15em] rounded-full px-3 py-1 mb-5">
          <span class="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span v-if="isPast">Événement passé</span>
          <span v-else-if="isSoldOut">Complet</span>
          <span v-else-if="countdown && countdown.days === 0">Aujourd'hui</span>
          <span v-else-if="countdown && countdown.days < 7">Cette semaine</span>
          <span v-else>Billets disponibles</span>
        </div>

        <h1 class="font-serif text-[2.4rem] md:text-[3.6rem] leading-[1.05] max-w-[820px] mb-6">{{ event.title }}</h1>

        <div class="flex flex-wrap items-center gap-x-7 gap-y-3 text-base mb-8">
          <div v-if="eventDateLong" class="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span class="capitalize">{{ eventDateLong }}</span>
            <span v-if="eventTime" class="text-white/70">· {{ eventTime }}</span>
          </div>
          <div v-if="eventLocation" class="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <span>{{ eventLocation }}</span>
          </div>
        </div>

        <!-- Countdown blocks -->
        <div v-if="countdown && !isPast && !isSoldOut" class="flex gap-3 mb-8">
          <div class="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-3 text-center min-w-[68px]">
            <div class="font-serif text-[1.6rem] leading-none">{{ countdown.days }}</div>
            <div class="text-[0.65rem] uppercase tracking-wider text-white/70 mt-1">jour{{ countdown.days > 1 ? 's' : '' }}</div>
          </div>
          <div class="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-3 text-center min-w-[68px]">
            <div class="font-serif text-[1.6rem] leading-none">{{ countdown.hours }}</div>
            <div class="text-[0.65rem] uppercase tracking-wider text-white/70 mt-1">heure{{ countdown.hours > 1 ? 's' : '' }}</div>
          </div>
          <div class="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-3 text-center min-w-[68px]">
            <div class="font-serif text-[1.6rem] leading-none">{{ countdown.minutes }}</div>
            <div class="text-[0.65rem] uppercase tracking-wider text-white/70 mt-1">min</div>
          </div>
        </div>

        <!-- Hero CTA + price -->
        <div class="flex flex-wrap items-center gap-4">
          <button
            v-if="!isPast && !isSoldOut"
            type="button"
            class="inline-flex items-center gap-2 px-7 py-4 rounded-full bg-orange-primary text-white text-base font-bold hover:bg-orange-light transition-colors shadow-lg shadow-orange-primary/30"
            @click="scrollToTickets"
          >
            {{ isInscription ? 'S\'inscrire gratuitement' : 'Acheter mes billets' }}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <div v-if="!isPast && minPrice > 0" class="text-white/85">
            <div class="text-[0.7rem] uppercase tracking-wider text-white/60">À partir de</div>
            <div class="font-serif text-[1.4rem]">{{ formatPrice(minPrice) }}</div>
          </div>
          <div v-if="isPast" class="px-6 py-3 rounded-full bg-white/10 border border-white/15 text-white/90 text-sm font-medium">
            Cet événement est terminé
          </div>
          <div v-else-if="isSoldOut" class="px-6 py-3 rounded-full bg-white/10 border border-white/15 text-white/90 text-sm font-medium">
            Complet — Plus de places disponibles
          </div>
        </div>

        <!-- Urgency cue -->
        <div v-if="!isPast && !isSoldOut && totalRemaining > 0 && totalRemaining < 50" class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white">
          <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Plus que {{ totalRemaining }} place{{ totalRemaining > 1 ? 's' : '' }} disponible{{ totalRemaining > 1 ? 's' : '' }}
        </div>
      </div>
    </section>

    <!-- ─── DESCRIPTION ────────────────────────────────────── -->
    <!-- Rendered as plain text via {{ }} (NOT v-html) to prevent XSS through
         the organiser-provided description on a public, paid-traffic landing.
         whitespace-pre-line preserves paragraphs. -->
    <section v-if="event.description" class="bg-bg-primary py-12 px-5">
      <div class="max-w-[720px] mx-auto">
        <h2 class="font-serif text-[1.6rem] text-text-primary mb-5">À propos</h2>
        <p class="prose prose-sm text-text-secondary leading-relaxed whitespace-pre-line">{{ event.description }}</p>
      </div>
    </section>

    <!-- ─── TICKETS ────────────────────────────────────────── -->
    <section id="tickets" class="bg-surface py-12 px-5 scroll-mt-24" v-if="!isPast">
      <div class="max-w-[720px] mx-auto">
        <h2 class="font-serif text-[1.6rem] text-text-primary mb-2">{{ isInscription ? 'Inscription' : 'Choisissez vos billets' }}</h2>
        <p class="text-sm text-text-tertiary mb-6">{{ isInscription ? 'Inscription rapide et gratuite.' : 'Sélectionnez la quantité par catégorie de billet.' }}</p>

        <div v-if="isSoldOut" class="rounded-xl border border-border-light bg-bg-primary px-5 py-8 text-center">
          <div class="font-serif text-lg text-text-primary mb-1">Événement complet</div>
          <p class="text-sm text-text-tertiary">Toutes les places ont été vendues.</p>
        </div>

        <div v-else-if="passes.length === 0" class="rounded-xl border border-border-light bg-bg-primary px-5 py-8 text-center">
          <p class="text-sm text-text-tertiary">Aucun billet n'est disponible pour le moment.</p>
        </div>

        <div v-else class="flex flex-col gap-3">
          <div
            v-for="p in passes"
            :key="p.id"
            class="rounded-xl border border-border-light bg-bg-primary p-5 flex items-center justify-between gap-4 flex-wrap"
          >
            <div class="flex-1 min-w-0">
              <div class="text-sm font-bold text-text-primary mb-0.5">{{ p.name }}</div>
              <div v-if="p.description" class="text-xs text-text-tertiary mb-1.5 line-clamp-2">{{ p.description }}</div>
              <div class="font-serif text-[1.1rem] text-text-primary">{{ formatPrice(p.price) }}</div>
              <div v-if="p.remaining > 0 && p.remaining < 20" class="text-[0.7rem] text-orange-primary font-semibold mt-1">
                Plus que {{ p.remaining }} restant{{ p.remaining > 1 ? 's' : '' }}
              </div>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                aria-label="Diminuer la quantité"
                class="w-11 h-11 rounded-lg border border-border-light bg-surface flex items-center justify-center cursor-pointer transition-colors text-lg text-text-secondary hover:border-orange-primary hover:text-orange-primary disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="p.quantity === 0"
                @click="decrease(p)"
              >−</button>
              <span class="w-9 text-center font-bold text-base text-text-primary tabular-nums" aria-live="polite">{{ p.quantity }}</span>
              <button
                type="button"
                aria-label="Augmenter la quantité"
                class="w-11 h-11 rounded-lg border border-border-light bg-surface flex items-center justify-center cursor-pointer transition-colors text-lg text-text-secondary hover:border-orange-primary hover:text-orange-primary disabled:opacity-30 disabled:cursor-not-allowed"
                :disabled="p.quantity >= 10 || p.quantity >= p.remaining"
                @click="increase(p)"
              >+</button>
            </div>
          </div>
        </div>

        <!-- Inline summary + CTA (desktop) -->
        <div
          v-if="totalQuantity > 0"
          class="hidden md:flex items-center justify-between gap-4 mt-6 rounded-xl border-2 border-orange-primary bg-orange-dim/40 px-5 py-4"
        >
          <div>
            <div class="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-0.5">{{ totalQuantity }} billet{{ totalQuantity > 1 ? 's' : '' }}</div>
            <div class="font-serif text-[1.4rem] text-text-primary">{{ formatPrice(totalPrice) }}</div>
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-orange-primary text-white font-bold text-sm hover:bg-orange-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            :disabled="checkoutLoading"
            @click="goToCheckout"
          >
            <svg v-if="checkoutLoading" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" class="opacity-75"/></svg>
            <template v-else>{{ isInscription ? 'Confirmer mon inscription' : 'Continuer vers le paiement' }}</template>
          </button>
        </div>
      </div>
    </section>

    <!-- ─── ORGANIZER + SHARE ──────────────────────────────── -->
    <section class="bg-bg-primary py-12 px-5">
      <div class="max-w-[720px] mx-auto grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
        <div class="flex items-center gap-4">
          <NuxtImg
            v-if="event.organizer?.avatar || event.organizer?.logo"
            :src="event.organizer.avatar || event.organizer.logo"
            :alt="event.organizer.name || ''"
            :width="56"
            :height="56"
            class="w-14 h-14 rounded-full object-cover bg-bg-secondary"
            loading="lazy"
          />
          <div v-else class="w-14 h-14 rounded-full bg-orange-dim text-orange-primary flex items-center justify-center font-bold text-lg">
            {{ (event.organizer?.name || event.organizer?.company_name || '?').charAt(0).toUpperCase() }}
          </div>
          <div>
            <div class="text-xs text-text-tertiary uppercase tracking-wider mb-0.5">Organisé par</div>
            <div class="font-serif text-base text-text-primary">{{ event.organizer?.company_name || event.organizer?.name || 'Organisateur' }}</div>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            aria-label="Partager sur WhatsApp"
            class="w-11 h-11 rounded-full bg-surface border border-border-light flex items-center justify-center text-text-secondary hover:border-orange-primary hover:text-orange-primary transition-colors"
            @click="shareWhatsApp"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </button>
          <button
            type="button"
            :aria-label="linkCopied ? 'Lien copié' : 'Copier le lien'"
            class="inline-flex items-center gap-2 h-11 px-4 rounded-full bg-surface border border-border-light text-sm font-semibold transition-colors"
            :class="linkCopied ? 'border-green-dark text-green-dark' : 'text-text-secondary hover:border-orange-primary hover:text-orange-primary'"
            @click="copyShareLink"
          >
            <svg v-if="!linkCopied" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            {{ linkCopied ? 'Copié' : 'Copier le lien' }}
          </button>
        </div>
      </div>
    </section>

    <!-- ─── Sticky bottom CTA (mobile) ─────────────────────── -->
    <div
      v-if="!isPast && !isSoldOut && totalQuantity === 0"
      class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border-light px-4 py-3 flex items-center justify-between gap-3"
    >
      <div class="min-w-0">
        <div class="text-[0.65rem] uppercase tracking-wider text-text-tertiary">{{ minPrice > 0 ? 'À partir de' : '' }}</div>
        <div class="font-serif text-base text-text-primary">{{ minPrice > 0 ? formatPrice(minPrice) : (isInscription ? 'Gratuit' : '—') }}</div>
      </div>
      <button
        type="button"
        class="flex-1 max-w-[260px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-orange-primary text-white text-sm font-bold hover:bg-orange-light transition-colors"
        @click="scrollToTickets"
      >
        {{ isInscription ? 'S\'inscrire' : 'Acheter mes billets' }}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>

    <!-- ─── Sticky bottom: validate selection (mobile) ─────── -->
    <div
      v-if="!isPast && !isSoldOut && totalQuantity > 0"
      class="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border-light px-4 py-3 flex items-center justify-between gap-3"
    >
      <div class="min-w-0">
        <div class="text-[0.65rem] uppercase tracking-wider text-text-tertiary">{{ totalQuantity }} billet{{ totalQuantity > 1 ? 's' : '' }}</div>
        <div class="font-serif text-base text-text-primary">{{ formatPrice(totalPrice) }}</div>
      </div>
      <button
        type="button"
        class="flex-1 max-w-[260px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-orange-primary text-white text-sm font-bold hover:bg-orange-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        :disabled="checkoutLoading"
        @click="goToCheckout"
      >
        <svg v-if="checkoutLoading" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" class="opacity-75"/></svg>
        <template v-else>
          {{ isInscription ? 'Confirmer' : 'Payer' }}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </template>
      </button>
    </div>
  </div>
</template>
