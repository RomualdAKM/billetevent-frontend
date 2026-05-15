<template>
  <div class="max-w-6xl mx-auto px-4 py-8">
    <div v-if="loading" class="flex items-center justify-center py-20">
      <div class="w-6 h-6 border-2 border-orange-primary border-t-transparent rounded-full animate-spin" />
    </div>
    <template v-else-if="organizer">
    <div class="bg-bg-surface rounded-xl p-8 mb-8">
      <div class="flex flex-col md:flex-row items-center md:items-start gap-6">
        <div class="w-24 h-24 rounded-full bg-orange-primary flex items-center justify-center shrink-0">
          <span class="text-white text-3xl font-bold">{{ organizer.initials || (organizer.display_name || organizer.name)?.substring(0, 2)?.toUpperCase() || 'OR' }}</span>
        </div>
        <div class="flex-1 text-center md:text-left">
          <h1 class="font-serif text-2xl text-text-primary mb-2">{{ organizer.display_name || organizer.name }}</h1>
          <div class="flex items-center justify-center md:justify-start gap-3 text-sm text-text-secondary mb-3">
            <span>{{ organizer.events_count || 0 }} événements</span>
            <span class="w-1 h-1 rounded-full bg-text-tertiary" />
            <span>{{ followersCount }} abonnés</span>
          </div>
          <p class="text-sm text-text-secondary max-w-xl mb-4">
            {{ organizer.description || '' }}
          </p>
          <button
            v-if="showFollowButton"
            :disabled="followLoading"
            class="px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer"
            :class="isFollowing ? 'border border-orange-primary text-orange-primary hover:bg-orange-50' : 'bg-orange-primary text-white hover:bg-orange-600'"
            @click="toggleFollow"
          >
            {{ isFollowing ? 'Suivi' : 'Suivre' }}
          </button>
        </div>
      </div>
    </div>

    <div class="flex gap-6 border-b border-border-light mb-8">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="pb-3 text-sm cursor-pointer bg-transparent border-none border-b-2 transition-colors font-sans"
        :class="activeTab === tab.key ? 'border-orange-primary text-orange-primary font-semibold' : 'border-transparent text-text-tertiary hover:text-text-secondary'"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <div v-if="activeTab === 'upcoming'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
      <NuxtLink
        v-for="evt in upcomingEvents"
        :key="evt.id"
        :to="`/events/${evt.slug || evt.id}`"
        class="no-underline"
      >
        <EventCard
          :title="evt.title || evt.name"
          :date="evt.date_start ? new Date(evt.date_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''"
          :location="[evt.location, evt.city].filter(Boolean).join(', ')"
          :price="evt.min_price ? `À partir de ${new Intl.NumberFormat('fr-FR').format(evt.min_price)} F CFA` : 'Gratuit'"
          :category="evt.category"
          :gradient="evt.gradient || 'from-orange-primary to-orange-light'"
          :event="evt"
        />
      </NuxtLink>
    </div>

    <div v-if="activeTab === 'past'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
      <div
        v-for="evt in pastEvents"
        :key="evt.id"
        class="opacity-70"
      >
        <EventCard
          :title="evt.title || evt.name"
          :date="evt.date_start ? new Date(evt.date_start).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : ''"
          :location="[evt.location, evt.city].filter(Boolean).join(', ')"
          :price="evt.min_price ? `${new Intl.NumberFormat('fr-FR').format(evt.min_price)} F CFA` : 'Gratuit'"
          :category="evt.category"
          :gradient="evt.gradient || 'from-orange-primary/60 to-orange-light/40'"
          :event="evt"
        />
      </div>
    </div>

    <div class="bg-bg-surface rounded-xl p-8 mt-8">
      <h2 class="font-serif text-xl text-text-primary mb-6">Contacter l'organisateur</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <form @submit.prevent="handleContact" class="flex flex-col gap-4">
          <div>
            <label class="block text-sm font-semibold text-text-primary mb-1.5">Votre nom</label>
            <input
              v-model="contactForm.name"
              type="text"
              required
              placeholder="Entrez votre nom"
              class="w-full px-4 py-2.5 rounded-xl border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-[border-color] duration-200 focus:border-orange-primary font-sans"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold text-text-primary mb-1.5">Votre email</label>
            <input
              v-model="contactForm.email"
              type="email"
              required
              placeholder="votre@email.com"
              class="w-full px-4 py-2.5 rounded-xl border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-[border-color] duration-200 focus:border-orange-primary font-sans"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold text-text-primary mb-1.5">Sujet</label>
            <select
              v-model="contactForm.subject"
              class="w-full px-4 py-2.5 rounded-xl border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-[border-color] duration-200 focus:border-orange-primary font-sans appearance-none cursor-pointer"
            >
              <option value="">Sélectionnez un sujet</option>
              <option v-for="s in subjects" :key="s" :value="s">{{ s }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-text-primary mb-1.5">Votre message</label>
            <textarea
              v-model="contactForm.message"
              required
              rows="4"
              placeholder="Écrivez votre message..."
              class="w-full px-4 py-2.5 rounded-xl border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-[border-color] duration-200 focus:border-orange-primary font-sans resize-y"
            />
          </div>
          <label class="flex items-center gap-2 cursor-pointer">
            <input v-model="contactForm.subscribe" type="checkbox" class="w-4 h-4 accent-orange-primary cursor-pointer" />
            <span class="text-sm text-text-secondary">S'abonner aux notifications de cet organisateur</span>
          </label>
          <button
            type="submit"
            class="bg-orange-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border-none transition-colors hover:bg-orange-light"
          >
            Envoyer
          </button>
        </form>
        <div class="flex flex-col gap-5">
          <div v-if="organizer?.phone" class="flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-text-secondary shrink-0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
            <div>
              <div class="text-xs text-text-tertiary">Téléphone</div>
              <div class="text-sm text-text-primary font-semibold">{{ organizer.phone }}</div>
            </div>
          </div>
          <div v-if="organizer?.email" class="flex items-center gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-text-secondary shrink-0"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
            <div>
              <div class="text-xs text-text-tertiary">Email</div>
              <div class="text-sm text-text-primary font-semibold">{{ organizer.email }}</div>
            </div>
          </div>
          <div class="flex flex-col gap-3 mt-4">
            <a v-if="organizer?.phone" :href="`tel:${organizer.phone}`" class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-main text-white text-sm font-semibold no-underline transition-colors hover:opacity-90">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              Appeler
            </a>
            <a v-if="organizer?.email" :href="`mailto:${organizer.email}`" class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-blue-main text-blue-main text-sm font-semibold no-underline transition-colors hover:bg-blue-main/5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              Envoyer un email
            </a>
          </div>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const route = useRoute()
const authStore = useAuthStore()
const { getOrganizerProfile, getOrganizerEvents } = usePublicApi()

const id = String(route.params.id ?? '')

const organizer = ref<any>(null)
const events = ref<any[]>([])
const loading = ref(true)
const activeTab = ref('upcoming')

const tabs = [
  { key: 'upcoming', label: 'Événements à venir' },
  { key: 'past', label: 'Événements passés' }
]

onMounted(async () => {
  loading.value = true
  try {
    const [profileData, eventsData] = await Promise.all([
      getOrganizerProfile(id),
      getOrganizerEvents(id)
    ])
    organizer.value = profileData?.data ?? profileData
    const evtList = eventsData?.data || eventsData || []
    events.value = Array.isArray(evtList) ? evtList : []
  } catch (err) {
    console.error('Erreur chargement profil organisateur:', err)
  } finally {
    loading.value = false
  }
})

const organizerId = computed(() => organizer.value?.id ?? null)
const initialFollowing = computed(() => !!organizer.value?.is_following)
const { isFollowing, followersCount, loading: followLoading, toggleFollow, setFollowersCount } = useFollowOrganizer(organizerId, initialFollowing)

// Synchroniser followersCount quand l'organisateur est chargé
watch(organizer, (org) => {
  if (org) setFollowersCount(org.followers_count || 0)
}, { immediate: true })

// Synchroniser le compteur dans l'objet organizer pour l'affichage
watch(followersCount, (count) => {
  if (organizer.value) organizer.value.followers_count = count
})

// Masquer le bouton si non connecté ou propre profil
const showFollowButton = computed(() => {
  if (!authStore.isLoggedIn) return false
  if (!organizer.value) return false
  const userId = (authStore.user as any)?.id
  return userId !== organizer.value.user_id && userId !== organizer.value.id
})

const now = new Date()
const upcomingEvents = computed(() => events.value.filter(e => !e.date_start || new Date(e.date_start) >= now))
const pastEvents = computed(() => events.value.filter(e => e.date_start && new Date(e.date_start) < now))

const subjects = [
  'Question sur un événement',
  'Proposition de partenariat',
  'Problème technique',
  "Problème d'accès ou de ticket",
  'Question sur le paiement',
  'Autre'
]

const contactForm = ref({
  name: '',
  email: '',
  subject: '',
  message: '',
  subscribe: false
})

const { success: contactSuccess } = useNotification()
const handleContact = () => {
  contactSuccess('Votre message a été envoyé avec succès !')
  contactForm.value = { name: '', email: '', subject: '', message: '', subscribe: false }
}

// SEO dynamique
watchEffect(() => {
  if (!organizer.value) return

  const o = organizer.value
  const rawName = o.organization_name || o.org_name || o.name || `${o.first_name || ''} ${o.last_name || ''}`.trim()
  const name = (rawName && rawName !== 'Mon organisation') ? rawName : `${o.first_name || ''} ${o.last_name || ''}`.trim() || rawName
  const seoTitle = `${name} | BilletEvent`
  const seoDescription = o.description
    ? o.description.substring(0, 160)
    : `Découvrez les événements de ${name} sur BilletEvent`
  const seoImage = o.logo || o.avatar || '/logo.png'
  const seoUrl = `https://billetevent.com/organizers/${o.id}`

  useSeoMeta({
    title: seoTitle,
    ogTitle: seoTitle,
    description: seoDescription,
    ogDescription: seoDescription,
    ogImage: seoImage,
    ogUrl: seoUrl,
    ogType: 'profile',
    ogSiteName: 'BilletEvent',
    twitterCard: 'summary',
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
          '@type': 'Organization',
          name: name,
          description: seoDescription,
          image: seoImage,
          url: seoUrl,
        })
      }
    ]
  })
})
</script>
