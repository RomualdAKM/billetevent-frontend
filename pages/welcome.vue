<script setup lang="ts">
// Onboarding acheteur — affiché une seule fois après l'inscription.
// 3 questions optionnelles (skipable) qui permettent de personnaliser les
// recommandations d'événements ensuite. Stocké en localStorage car les
// champs `city` et `preferences` ne sont pas garantis en DB côté backend
// (étendre PUT /account/profile + colonnes users si besoin futur).
definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const accountApi = useAccountApi()
const { success } = useNotification()

const ONBOARDING_KEY = 'billetevent_buyer_onboarding_v1'

// Si l'utilisateur a déjà fait l'onboarding, le rediriger
if (import.meta.client) {
  try {
    if (localStorage.getItem(ONBOARDING_KEY) === '1') {
      navigateTo((route.query.redirect as string) || '/events')
    }
  } catch { /* silencieux */ }
}

const step = ref<1 | 2 | 3>(1)
const selectedCity = ref('')
const selectedCategories = ref<string[]>([])
const allowNotifications = ref(true)

const cities = ['Dakar', 'Abidjan', 'Cotonou', 'Lomé', 'Douala', 'Bamako', 'Ouagadougou', 'Conakry']
const categories = [
  { slug: 'musique', label: 'Musique', icon: '🎤' },
  { slug: 'business', label: 'Business', icon: '💼' },
  { slug: 'art', label: 'Art & Culture', icon: '🎨' },
  { slug: 'sport', label: 'Sport', icon: '⚽' },
  { slug: 'formation', label: 'Formation', icon: '📚' },
  { slug: 'tech', label: 'Tech', icon: '💻' },
  { slug: 'gastronomie', label: 'Gastronomie', icon: '🍽️' },
  { slug: 'autre', label: 'Autre', icon: '🎉' },
]

function toggleCategory(slug: string) {
  const idx = selectedCategories.value.indexOf(slug)
  if (idx === -1) selectedCategories.value.push(slug)
  else selectedCategories.value.splice(idx, 1)
}

function next() {
  if (step.value < 3) step.value = (step.value + 1) as 1 | 2 | 3
}

function back() {
  if (step.value > 1) step.value = (step.value - 1) as 1 | 2 | 3
}

async function finish() {
  // Persist localement (l'utilisateur ne sera pas re-prompté)
  if (import.meta.client) {
    try {
      localStorage.setItem(ONBOARDING_KEY, '1')
      localStorage.setItem('billetevent_buyer_city', selectedCity.value)
      localStorage.setItem('billetevent_buyer_categories', JSON.stringify(selectedCategories.value))
    } catch { /* silencieux */ }
  }
  // Best-effort : push ville côté backend si l'utilisateur en a sélectionné une
  if (selectedCity.value && authStore.user && !(authStore.user as any).city) {
    try {
      await accountApi.updateProfile({ city: selectedCity.value })
      // Refresh local user
      await authStore.fetchUser()
    } catch { /* silencieux : non bloquant */ }
  }
  success('Bienvenue sur BilletEvent ! On vous a préparé une sélection.')
  // Rediriger vers le catalogue avec les filtres si renseignés
  const query: Record<string, string> = {}
  if (selectedCity.value) query.city = selectedCity.value
  if (selectedCategories.value.length === 1) query.cat = categories.find(c => c.slug === selectedCategories.value[0])?.label || ''
  router.push({ path: (route.query.redirect as string) || '/events', query })
}

function skipAll() {
  if (import.meta.client) {
    try { localStorage.setItem(ONBOARDING_KEY, '1') } catch { /* silencieux */ }
  }
  navigateTo((route.query.redirect as string) || '/events')
}
</script>

<template>
  <div class="min-h-screen bg-bg-primary flex items-center justify-center px-4 py-12">
    <div class="max-w-xl w-full bg-surface border border-border-light rounded-2xl p-6 md:p-10 shadow-sm">
      <!-- Progress -->
      <div class="flex items-center gap-2 mb-8">
        <div v-for="i in 3" :key="i" class="flex-1 h-1 rounded-full transition-colors" :class="i <= step ? 'bg-orange-primary' : 'bg-surface-2'" />
      </div>

      <!-- Étape 1 : Ville -->
      <div v-if="step === 1">
        <h1 class="font-serif text-2xl text-text-primary mb-2">Vous êtes où ?</h1>
        <p class="text-sm text-text-secondary mb-6">On vous montrera en priorité les événements près de chez vous.</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
          <button
            v-for="city in cities"
            :key="city"
            type="button"
            class="px-4 py-3 rounded-lg text-sm font-semibold border transition-colors"
            :class="selectedCity === city ? 'bg-orange-primary text-white border-orange-primary' : 'bg-surface border-border-light text-text-primary hover:border-orange-primary'"
            @click="selectedCity = city"
          >
            {{ city }}
          </button>
        </div>
        <div class="flex items-center justify-between">
          <button type="button" class="text-sm text-text-tertiary hover:text-orange-primary" @click="skipAll">Passer cette étape</button>
          <button type="button" class="px-6 py-2.5 rounded-full text-sm font-bold bg-orange-primary text-white hover:bg-orange-light transition-colors" @click="next">Suivant →</button>
        </div>
      </div>

      <!-- Étape 2 : Centres d'intérêt -->
      <div v-else-if="step === 2">
        <h1 class="font-serif text-2xl text-text-primary mb-2">Qu'est-ce qui vous intéresse ?</h1>
        <p class="text-sm text-text-secondary mb-6">Sélectionnez vos catégories préférées. Vous pouvez changer plus tard.</p>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-6">
          <button
            v-for="cat in categories"
            :key="cat.slug"
            type="button"
            class="px-4 py-3 rounded-lg text-sm font-semibold border transition-colors flex items-center gap-2"
            :class="selectedCategories.includes(cat.slug) ? 'bg-orange-primary text-white border-orange-primary' : 'bg-surface border-border-light text-text-primary hover:border-orange-primary'"
            @click="toggleCategory(cat.slug)"
          >
            <span>{{ cat.icon }}</span>
            <span>{{ cat.label }}</span>
          </button>
        </div>
        <div class="flex items-center justify-between">
          <button type="button" class="text-sm text-text-tertiary hover:text-orange-primary" @click="back">← Retour</button>
          <button type="button" class="px-6 py-2.5 rounded-full text-sm font-bold bg-orange-primary text-white hover:bg-orange-light transition-colors" @click="next">Suivant →</button>
        </div>
      </div>

      <!-- Étape 3 : Notifications -->
      <div v-else>
        <h1 class="font-serif text-2xl text-text-primary mb-2">Restez informé des bons plans</h1>
        <p class="text-sm text-text-secondary mb-6">Recevez par email les événements correspondant à vos centres d'intérêt + un rappel la veille de votre événement.</p>
        <label class="flex items-start gap-3 p-4 border rounded-xl cursor-pointer mb-6 select-none" :class="allowNotifications ? 'border-orange-primary bg-orange-dim/30' : 'border-border-light bg-surface'">
          <input
            v-model="allowNotifications"
            type="checkbox"
            class="mt-1 w-5 h-5 rounded border-border-light accent-orange-primary cursor-pointer shrink-0"
          />
          <span>
            <span class="block text-sm font-semibold text-text-primary mb-0.5">Oui, envoyez-moi les bons plans</span>
            <span class="block text-xs text-text-tertiary">Pas plus de 2 emails par semaine. Désabonnement en 1 clic.</span>
          </span>
        </label>
        <div class="flex flex-col sm:flex-row gap-2.5">
          <button type="button" class="flex-1 px-6 py-3 rounded-full text-sm font-semibold border border-border-light text-text-secondary hover:border-orange-primary transition-colors" @click="back">← Retour</button>
          <button type="button" class="flex-[2] px-6 py-3 rounded-full text-sm font-bold bg-orange-primary text-white hover:bg-orange-light transition-colors" @click="finish">C'est parti, montrez-moi les événements →</button>
        </div>
      </div>
    </div>
  </div>
</template>
