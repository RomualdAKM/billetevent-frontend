<script setup lang="ts">
const props = defineProps({
  title: { type: String, required: true },
  date: { type: String, required: true },
  location: { type: String, default: '' },
  price: { type: String, default: '' },
  category: { type: String, default: '' },
  image: { type: String, default: '' },
  gradient: { type: String, default: 'from-orange-primary to-orange-light' },
  event: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['toggle-favorite'])

const isVerified = computed(() => props.event?.isVerified ?? false)
const isFavorite = computed(() => props.event?.isFavorite ?? false)
const organizer = computed(() => props.event?.organizer ?? null)
const salesCount = computed(() => props.event?.salesCount ?? 0)
const country = computed(() => props.event?.country ?? '')
const eventType = computed(() => props.event?.event_type ?? 'presentiel')

const toggleFavorite = () => {
  emit('toggle-favorite', props.event?.id)
}

const { toggleFollowOrganizer } = usePublicApi()
const { success, error: notifyError } = useNotification()
const authStore = useAuthStore()

// Initial state MUST come from the server-provided flag (EventResource exposes
// `organizer.is_following`) — otherwise the button shows "S'abonner" for orgs
// the user already follows, and the first click silently UNFOLLOWS them.
const isFollowing = ref(!!props.event?.organizer?.is_following)

// Keep ref in sync if the event prop changes (e.g. parent re-fetches).
watch(() => props.event?.organizer?.is_following, (val) => {
  isFollowing.value = !!val
})

const followLoading = ref(false)
const followOrganizer = async () => {
  if (!organizer.value?.id) return
  if (!authStore.isLoggedIn) {
    notifyError('Connectez-vous pour vous abonner à un organisateur')
    return
  }
  if (followLoading.value) return
  followLoading.value = true
  try {
    const res: any = await toggleFollowOrganizer(organizer.value.id)
    // Backend (PublicOrganizerController::toggleFollow) returns `{following: bool}`.
    // We also accept `is_following` for future-proofing, and fall back to a
    // local toggle ONLY if neither field is present (defensive — should not
    // happen with the current backend contract).
    const next =
      typeof res?.following === 'boolean' ? res.following
      : typeof res?.data?.following === 'boolean' ? res.data.following
      : typeof res?.is_following === 'boolean' ? res.is_following
      : typeof res?.data?.is_following === 'boolean' ? res.data.is_following
      : !isFollowing.value
    isFollowing.value = !!next
    success(isFollowing.value ? 'Abonné' : 'Désabonné')
  } catch {
    notifyError('Impossible de mettre à jour l\'abonnement')
  } finally {
    followLoading.value = false
  }
}
</script>

<template>
  <div class="bg-white rounded-xl border border-border-light overflow-hidden transition-all duration-200 hover:border-orange-primary cursor-pointer group">
    <div class="relative h-44 overflow-hidden">
      <NuxtImg v-if="image" :src="image" :alt="title" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" :placeholder="[20, 20]" />
      <div v-else :class="['w-full h-full bg-gradient-to-br', gradient]" />
      <span v-if="category" class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-text-primary text-xs font-bold px-2.5 py-1 rounded-full">{{ category }}</span>
      <span v-if="eventType === 'enligne'" class="absolute bottom-3 left-3 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">En ligne</span>
      <span v-else-if="eventType === 'hybride'" class="absolute bottom-3 left-3 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">Hybride</span>
      <button
        v-if="event?.id"
        class="absolute top-3 right-3 bg-white/80 backdrop-blur w-9 h-9 flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-white cursor-pointer"
        @click.stop.prevent="toggleFavorite"
      >
        <svg v-if="isFavorite" width="18" height="18" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-text-secondary">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    </div>
    <div class="p-5">
      <div class="flex items-center gap-1.5 mb-1.5">
        <h3 class="font-serif text-base text-text-primary leading-tight line-clamp-1">{{ title }}</h3>
        <svg v-if="isVerified" width="20" height="20" viewBox="0 0 24 24" fill="none" class="text-blue-light shrink-0">
          <circle cx="12" cy="12" r="10" fill="currentColor" />
          <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>
      <div class="flex items-start gap-1.5 text-xs text-text-tertiary mb-1">
        <svg class="shrink-0 mt-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        {{ date }}
      </div>
      <div v-if="location" class="flex items-start gap-1.5 text-xs text-text-tertiary mb-1">
        <svg class="shrink-0 mt-0.5" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span v-if="country">{{ country }}</span> {{ location }}
      </div>

      <div v-if="organizer" class="flex items-center gap-2 mb-2">
        <NuxtLink :to="`/organizers/${organizer.id}`" class="flex items-center gap-2 no-underline" @click.stop>
          <span class="w-6 h-6 rounded-full bg-orange-primary text-white text-xs flex items-center justify-center font-semibold shrink-0">{{ organizer.initials }}</span>
          <span class="text-sm text-text-tertiary hover:text-orange-primary transition-colors">{{ organizer.display_name || organizer.name }}</span>
        </NuxtLink>
        <button :disabled="followLoading" class="text-xs text-orange-primary hover:underline cursor-pointer ml-auto disabled:opacity-60" @click.stop.prevent="followOrganizer">{{ isFollowing ? 'Abonné' : "S'abonner" }}</button>
      </div>

      <div v-if="salesCount > 0" class="flex items-center gap-1.5 text-xs text-text-tertiary mb-2">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12h5l3-9 4 18 3-9h5"/></svg>
        {{ salesCount }} ventes
      </div>

      <div v-if="price" class="flex items-center justify-between mt-3 pt-3 border-t border-border-light">
        <span class="font-serif text-lg text-orange-primary">{{ price }}</span>
        <span class="text-xs font-bold text-text-tertiary uppercase tracking-wide">Acheter</span>
      </div>
    </div>
  </div>
</template>
