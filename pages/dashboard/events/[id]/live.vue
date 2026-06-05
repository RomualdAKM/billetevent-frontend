<script setup lang="ts">
/**
 * Live Dashboard jour J — page que l'organisateur ouvre sur son téléphone
 * pendant l'événement. Affiche en quasi-temps réel :
 * - Compteur géant "X / Y entrés"
 * - Vitesse d'entrée (par minute)
 * - Répartition par type de pass
 * - Compteur scans/doublons/invalides
 *
 * Polling 5s. Wake Lock pour empêcher l'écran de s'éteindre.
 */
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const route = useRoute()
const api = useOrganizerApi()
const { error: notifyError } = useNotification()

const eventId = computed(() => route.params.id as string)
const loading = ref(true)
const event = ref<any>(null)
const stats = ref<any>(null)
const validatorSession = ref<any>(null)
const previousScanCount = ref(0)
const scansPerMinute = ref(0)
let pollInterval: ReturnType<typeof setInterval> | null = null
let perMinuteSamples: Array<{ t: number; count: number }> = []
let wakeLock: any = null

// Si l'utilisateur quitte l'onglet, le Wake Lock est relâché par le navigateur.
// On le re-demande quand l'onglet redevient visible.
async function onVisibilityChange() {
  if (document.visibilityState === 'visible' && !wakeLock) {
    await requestWakeLock()
  }
}

async function loadAll() {
  try {
    const [evRes, sessRes] = await Promise.all([
      api.getEvent(eventId.value).catch(() => null),
      api.getValidatorSessions(eventId.value).catch(() => null),
    ])
    event.value = (evRes as any)?.data ?? evRes
    const sess = (sessRes as any)?.data ?? sessRes
    validatorSession.value = sess
    stats.value = sess?.stats || sess?.session?.stats || null
    // Calcul scans/min : on échantillonne toutes les 30s, moyenne sur 5min
    const now = Date.now()
    const total = (stats.value?.checked_in ?? 0)
    perMinuteSamples.push({ t: now, count: total })
    // Garde 10 samples (5 min)
    if (perMinuteSamples.length > 10) perMinuteSamples.shift()
    if (perMinuteSamples.length >= 2) {
      const first = perMinuteSamples[0]
      const last = perMinuteSamples[perMinuteSamples.length - 1]
      const minutes = (last.t - first.t) / 60000
      scansPerMinute.value = minutes > 0 ? Math.round((last.count - first.count) / minutes) : 0
    }
    previousScanCount.value = total
  } catch {
    notifyError('Erreur chargement des données live')
  } finally {
    loading.value = false
  }
}

async function requestWakeLock() {
  if (!import.meta.client) return
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await (navigator as any).wakeLock.request('screen')
    }
  } catch { /* silencieux */ }
}

onMounted(async () => {
  await loadAll()
  // Polling 5s en mode live (acceptable car page dédiée + onglet actif).
  // perMinuteSamples accumule automatiquement via loadAll().
  if (import.meta.client) {
    pollInterval = setInterval(loadAll, 5000)
    await requestWakeLock()
    document.addEventListener('visibilitychange', onVisibilityChange)
  }
})

onBeforeUnmount(() => {
  if (pollInterval) clearInterval(pollInterval)
  if (wakeLock) { try { wakeLock.release() } catch { /* silencieux */ } }
  if (import.meta.client) document.removeEventListener('visibilitychange', onVisibilityChange)
})

// Computed
const totalTickets = computed(() => stats.value?.total_tickets ?? event.value?.total_tickets ?? 0)
const checkedIn = computed(() => stats.value?.checked_in ?? 0)
const remaining = computed(() => Math.max(0, totalTickets.value - checkedIn.value))
const progressPercent = computed(() => totalTickets.value === 0 ? 0 : Math.round((checkedIn.value / totalTickets.value) * 100))
const duplicates = computed(() => stats.value?.duplicates ?? 0)
const invalid = computed(() => stats.value?.invalid ?? 0)
</script>

<template>
  <div class="max-w-3xl mx-auto px-4 py-4">
    <!-- Header -->
    <div class="mb-4 flex items-center gap-3">
      <NuxtLink :to="`/dashboard/events/${eventId}/validators`" class="text-text-tertiary hover:text-orange-primary">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
      </NuxtLink>
      <div class="flex-1 min-w-0">
        <div class="text-[10px] uppercase tracking-wider text-orange-primary font-bold flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-orange-primary animate-pulse" />
          Live · {{ event?.title || 'Événement' }}
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="space-y-3">
      <div class="h-64 rounded-2xl bg-surface-2 animate-pulse" />
      <div class="grid grid-cols-3 gap-3">
        <div v-for="i in 3" :key="i" class="h-24 rounded-xl bg-surface-2 animate-pulse" />
      </div>
    </div>

    <template v-else>
      <!-- Hero counter -->
      <div class="bg-surface border border-border-light rounded-2xl p-6 text-center mb-4">
        <div class="text-xs uppercase tracking-wider text-text-tertiary font-bold mb-2">Entrées</div>
        <div class="flex items-end justify-center gap-2 mb-3">
          <div class="font-serif text-6xl md:text-7xl text-text-primary leading-none tabular-nums">{{ checkedIn }}</div>
          <div class="text-2xl text-text-tertiary mb-2">/ {{ totalTickets }}</div>
        </div>
        <!-- Progress bar -->
        <div class="h-3 rounded-full bg-surface-2 overflow-hidden mb-3">
          <div class="h-full bg-orange-primary transition-all duration-500" :style="{ width: progressPercent + '%' }" />
        </div>
        <div class="text-sm text-text-secondary">
          <span class="font-bold text-text-primary">{{ progressPercent }} %</span>
          · {{ remaining }} personnes attendues
        </div>
      </div>

      <!-- Stats grid -->
      <div class="grid grid-cols-3 gap-3 mb-4">
        <div class="bg-surface border border-border-light rounded-xl p-4 text-center">
          <div class="text-[10px] uppercase tracking-wider text-text-tertiary font-bold mb-1">Vitesse</div>
          <div class="font-serif text-2xl text-text-primary tabular-nums">{{ scansPerMinute }}</div>
          <div class="text-[10px] text-text-tertiary mt-0.5">scans/min</div>
        </div>
        <div class="bg-surface border border-border-light rounded-xl p-4 text-center">
          <div class="text-[10px] uppercase tracking-wider text-gold font-bold mb-1">Doublons</div>
          <div class="font-serif text-2xl text-text-primary tabular-nums">{{ duplicates }}</div>
          <div class="text-[10px] text-text-tertiary mt-0.5">déjà scannés</div>
        </div>
        <div class="bg-surface border border-border-light rounded-xl p-4 text-center">
          <div class="text-[10px] uppercase tracking-wider text-red-error font-bold mb-1">Invalides</div>
          <div class="font-serif text-2xl text-text-primary tabular-nums">{{ invalid }}</div>
          <div class="text-[10px] text-text-tertiary mt-0.5">refusés</div>
        </div>
      </div>

      <!-- Alertes -->
      <div v-if="invalid > 5" class="bg-red-error/10 border border-red-error/30 rounded-xl p-4 mb-4 flex items-start gap-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-red-error shrink-0 mt-0.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        <div class="text-sm text-text-primary">
          <strong>{{ invalid }} scans invalides détectés.</strong> Vérifiez avec vos validateurs (tentative de fraude ou billet d'un autre événement ?).
        </div>
      </div>

      <!-- Liens utiles -->
      <div class="flex flex-col sm:flex-row gap-2.5">
        <NuxtLink
          :to="`/dashboard/events/${eventId}/validators`"
          class="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold bg-surface border border-border-light text-text-primary hover:border-orange-primary hover:text-orange-primary transition-colors"
        >
          Gérer les validateurs
        </NuxtLink>
        <NuxtLink
          :to="`/dashboard/participants?event=${eventId}`"
          class="flex-1 inline-flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold bg-surface border border-border-light text-text-primary hover:border-orange-primary hover:text-orange-primary transition-colors"
        >
          Liste des participants
        </NuxtLink>
      </div>

      <p class="text-xs text-text-tertiary text-center mt-4">
        Mise à jour automatique toutes les 5 secondes · Écran maintenu allumé
      </p>
    </template>
  </div>
</template>
