<script setup lang="ts">
/**
 * Quick Create — création d'événement en 1 écran (60 secondes).
 * MVP : titre, date, lieu, type d'accès (gratuit/payant + prix unique + capacité),
 * visuel optionnel. Crée un draft via /organizer/events puis renvoie vers le
 * wizard complet pour enrichir si besoin.
 *
 * Conçu pour le DJ ou la productrice qui veut publier une soirée vendredi en
 * 2 min, sans naviguer dans 13 étapes optionnelles.
 */
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const router = useRouter()
const api = useOrganizerApi()
const { success, error: notifyError } = useNotification()
const { scrollToFirstError } = useFormErrors()

const title = ref('')
const dateStart = ref('')
const venue = ref('')
const city = ref('')
const accessMode = ref<'gratuit' | 'payant'>('payant')
const price = ref<number | null>(null)
const capacity = ref<number | null>(null)
const category = ref('autre')
const flyer = ref<File | null>(null)
const flyerInput = ref<HTMLInputElement | null>(null)
const saving = ref(false)
const errors = ref<Record<string, string>>({})

const categories = [
  { slug: 'musique', label: 'Musique' },
  { slug: 'business', label: 'Business' },
  { slug: 'art', label: 'Art & Culture' },
  { slug: 'sport', label: 'Sport' },
  { slug: 'formation', label: 'Formation' },
  { slug: 'tech', label: 'Tech' },
  { slug: 'gastronomie', label: 'Gastronomie' },
  { slug: 'autre', label: 'Autre' },
]

// Date/heure mini = maintenant + 1h (pas de création d'event "dans le passé" ni
// "dans 5 min" qui n'aurait pas le temps d'être promu).
const minDateTimeIso = computed(() => {
  const d = new Date(Date.now() + 60 * 60 * 1000) // +1h
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day}T${h}:${min}`
})

function onFlyerSelect(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (f) flyer.value = f
}

function validate(): boolean {
  errors.value = {}
  if (!title.value.trim() || title.value.trim().length < 4) errors.value.title = 'Titre requis (min. 4 caractères)'
  if (!dateStart.value) errors.value.date_start = 'Date et heure requises'
  else if (new Date(dateStart.value).getTime() < Date.now()) errors.value.date_start = 'La date doit être dans le futur'
  if (!venue.value.trim()) errors.value.venue = 'Lieu requis'
  if (!city.value.trim()) errors.value.city = 'Ville requise'
  if (!capacity.value || capacity.value < 1) errors.value.capacity = 'Capacité requise (≥ 1)'
  if (accessMode.value === 'payant' && (price.value === null || price.value < 0)) errors.value.price = 'Prix requis'
  return Object.keys(errors.value).length === 0
}

async function submit(publishNow: boolean = true) {
  if (!validate()) {
    notifyError('Vérifiez les champs requis')
    scrollToFirstError(errors.value)
    return
  }
  saving.value = true
  try {
    const fd = new FormData()
    fd.append('title', title.value.trim())
    fd.append('description', `${title.value.trim()} — événement créé via Création rapide.`)
    fd.append('category', category.value)
    fd.append('date_start', dateStart.value)
    fd.append('venue', venue.value.trim())
    fd.append('city', city.value.trim())
    fd.append('country', 'SN') // default ; modifiable ensuite dans le wizard
    fd.append('max_capacity', String(capacity.value))
    fd.append('access_mode', accessMode.value)
    fd.append('status', 'draft')
    if (flyer.value) fd.append('flyer', flyer.value)
    // Pass unique pour démarrer (l'organisateur peut en ajouter plus dans le wizard)
    if (accessMode.value === 'payant') {
      fd.append('passes[0][name]', 'Pass standard')
      fd.append('passes[0][price]', String(price.value || 0))
      fd.append('passes[0][quantity]', String(capacity.value))
    } else {
      fd.append('passes[0][name]', 'Inscription gratuite')
      fd.append('passes[0][price]', '0')
      fd.append('passes[0][quantity]', String(capacity.value))
    }
    // Le backend (EventController:226) lit `publish=1` et passe le status à
    // Published si au moins un pass est attaché — ce qui est notre cas.
    if (publishNow) fd.append('publish', '1')

    const res: any = await api.createEvent(fd)
    const created = res?.data ?? res
    if (publishNow) {
      success('Événement créé et publié.')
      // Direction : hub event pour pouvoir partager le lien tout de suite
      router.push(`/dashboard/events/${created.id}`)
    } else {
      success('Brouillon créé. Vous pourrez le publier après l\'avoir enrichi.')
      router.push(`/dashboard/events/create?edit=${created.id}`)
    }
  } catch (err: any) {
    if (err?.errors) {
      errors.value = Object.fromEntries(Object.entries(err.errors).map(([k, v]: any) => [k, Array.isArray(v) ? v[0] : v]))
      scrollToFirstError(errors.value)
    }
    notifyError(err?.message || 'Erreur lors de la création')
  } finally {
    saving.value = false
  }
}

const inputBase = 'w-full border-[1.5px] rounded-lg px-3.5 py-2.5 text-sm bg-white outline-none focus:border-orange-primary transition-colors'
function cls(field: string) {
  return [inputBase, errors.value[field] ? 'border-red-error' : 'border-border-light']
}
</script>

<template>
  <div class="max-w-xl mx-auto px-4 py-6">
    <div class="mb-5">
      <div class="text-sm font-semibold text-orange-primary mb-1.5">Création rapide</div>
      <h1 class="font-serif text-2xl text-text-primary mb-1">Publiez en 2 minutes</h1>
      <p class="text-sm text-text-secondary">L'essentiel pour démarrer. Vous pourrez enrichir après (programme, artistes, FAQ…).</p>
    </div>

    <form class="bg-surface border border-border-light rounded-2xl p-5 space-y-5" @submit.prevent="submit">
      <!-- Titre -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wide text-text-tertiary mb-1.5">Titre de l'événement *</label>
        <input v-model="title" name="title" type="text" autocomplete="off" placeholder="Ex : Soirée Afrobeats au Rooftop" :class="cls('title')" @input="errors.title = ''" />
        <p v-if="errors.title" class="text-xs text-red-error mt-1">{{ errors.title }}</p>
      </div>

      <!-- Date + Capacité -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wide text-text-tertiary mb-1.5">Date et heure *</label>
          <input v-model="dateStart" name="date_start" type="datetime-local" :min="minDateTimeIso" :class="cls('date_start')" @input="errors.date_start = ''" />
          <p v-if="errors.date_start" class="text-xs text-red-error mt-1">{{ errors.date_start }}</p>
        </div>
        <div>
          <label class="block text-xs font-bold uppercase tracking-wide text-text-tertiary mb-1.5">Capacité *</label>
          <input v-model.number="capacity" name="capacity" type="number" min="1" placeholder="Ex : 200" :class="cls('capacity')" @input="errors.capacity = ''" />
          <p v-if="errors.capacity" class="text-xs text-red-error mt-1">{{ errors.capacity }}</p>
        </div>
      </div>

      <!-- Lieu -->
      <div class="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr] gap-3">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wide text-text-tertiary mb-1.5">Lieu *</label>
          <input v-model="venue" name="venue" type="text" autocomplete="off" placeholder="Ex : Sky Bar Almadies" :class="cls('venue')" @input="errors.venue = ''" />
          <p v-if="errors.venue" class="text-xs text-red-error mt-1">{{ errors.venue }}</p>
        </div>
        <div>
          <label class="block text-xs font-bold uppercase tracking-wide text-text-tertiary mb-1.5">Ville *</label>
          <input v-model="city" name="city" type="text" autocomplete="address-level2" placeholder="Dakar" :class="cls('city')" @input="errors.city = ''" />
          <p v-if="errors.city" class="text-xs text-red-error mt-1">{{ errors.city }}</p>
        </div>
      </div>

      <!-- Catégorie -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wide text-text-tertiary mb-1.5">Catégorie</label>
        <select v-model="category" name="category" :class="cls('category')">
          <option v-for="c in categories" :key="c.slug" :value="c.slug">{{ c.label }}</option>
        </select>
      </div>

      <!-- Accès payant / gratuit -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wide text-text-tertiary mb-2">Accès</label>
        <div class="grid grid-cols-2 gap-2 mb-3">
          <button type="button" class="px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors" :class="accessMode === 'payant' ? 'bg-orange-primary text-white border-orange-primary' : 'bg-surface border-border-light text-text-primary'" @click="accessMode = 'payant'">Payant</button>
          <button type="button" class="px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors" :class="accessMode === 'gratuit' ? 'bg-orange-primary text-white border-orange-primary' : 'bg-surface border-border-light text-text-primary'" @click="accessMode = 'gratuit'">Gratuit (inscription)</button>
        </div>
        <div v-if="accessMode === 'payant'">
          <label class="block text-xs font-bold uppercase tracking-wide text-text-tertiary mb-1.5">Prix unique (F CFA) *</label>
          <input v-model.number="price" name="price" type="number" min="0" placeholder="5000" :class="cls('price')" @input="errors.price = ''" />
          <p v-if="errors.price" class="text-xs text-red-error mt-1">{{ errors.price }}</p>
        </div>
      </div>

      <!-- Visuel -->
      <div>
        <label class="block text-xs font-bold uppercase tracking-wide text-text-tertiary mb-1.5">Visuel (optionnel)</label>
        <input ref="flyerInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onFlyerSelect" />
        <button type="button" class="w-full border-2 border-dashed border-border-medium rounded-lg px-4 py-6 text-center hover:border-orange-primary transition-colors" @click="flyerInput?.click()">
          <div v-if="flyer" class="text-sm text-orange-primary font-semibold">{{ flyer.name }}</div>
          <div v-else class="text-sm text-text-tertiary">+ Ajouter une image (JPG, PNG)</div>
        </button>
      </div>

      <!-- Submit -->
      <div class="flex flex-col-reverse sm:flex-row gap-2.5 pt-3">
        <NuxtLink to="/dashboard/events/create" class="flex-1 inline-flex items-center justify-center px-5 py-3 rounded-full text-sm font-semibold bg-surface-2 text-text-secondary hover:bg-surface-3 transition-colors">
          J'ai besoin d'options avancées
        </NuxtLink>
        <button type="submit" :disabled="saving" class="flex-[2] inline-flex items-center justify-center px-5 py-3 rounded-full text-sm font-bold bg-orange-primary text-white hover:bg-orange-light transition-colors disabled:opacity-60">
          {{ saving ? 'Création…' : 'Créer le brouillon' }}
        </button>
      </div>
    </form>
  </div>
</template>
