<script setup lang="ts">
// IMPORTANT : pas de middleware 'organizer' ici (sinon boucle infinie).
// On vérifie juste l'auth.
definePageMeta({ layout: 'default', middleware: 'auth' })

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { becomeOrganizer } = useAuthApi()
const { error: notifyError } = useNotification()

const loading = ref(false)
const accepted = ref(false)
const errorMsg = ref('')

// Si déjà organizer/admin, rediriger directement
if (authStore.isOrganizer || authStore.isAdmin) {
  const target = (route.query.redirect as string) || '/dashboard'
  navigateTo(target)
}

async function activate() {
  if (!accepted.value) {
    errorMsg.value = "Vous devez accepter les Conditions Générales d'Utilisation Organisateur."
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const response: any = await becomeOrganizer()
    const userData = response?.data?.user ?? response?.user
    if (userData) {
      authStore.setUser(userData)
    }
    // Après activation : onboarding /dashboard/welcome par défaut, sinon redirect explicite
    const target = (route.query.redirect as string) || '/dashboard/welcome'
    await router.push(target)
  } catch (err: any) {
    errorMsg.value = err?.message || "L'activation du compte organisateur a échoué. Veuillez réessayer."
    notifyError(errorMsg.value)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-bg-primary flex items-center justify-center px-4 py-12">
    <div class="max-w-xl w-full bg-surface border border-border-light rounded-2xl p-6 md:p-10 shadow-sm">
      <div class="text-center mb-6">
        <div class="w-14 h-14 rounded-2xl bg-orange-dim flex items-center justify-center mx-auto mb-4">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </div>
        <h1 class="font-serif text-2xl md:text-3xl text-text-primary mb-2">Activez votre compte organisateur</h1>
        <p class="text-sm text-text-secondary">
          Vous êtes connecté en tant qu'acheteur. Pour créer et vendre des événements, votre compte doit être élevé en compte organisateur.
        </p>
      </div>

      <div class="bg-orange-dim/40 border border-orange-primary/30 rounded-lg p-4 mb-6">
        <h2 class="text-sm font-bold text-text-primary mb-2">Ce qui change pour vous</h2>
        <ul class="text-sm text-text-secondary space-y-1.5">
          <li class="flex items-start gap-2"><span class="text-orange-primary mt-0.5">→</span>Vous pourrez créer, publier et vendre des événements</li>
          <li class="flex items-start gap-2"><span class="text-orange-primary mt-0.5">→</span>Vous accédez à votre tableau de bord d'organisateur, à vos statistiques de ventes et à votre portefeuille</li>
          <li class="flex items-start gap-2"><span class="text-orange-primary mt-0.5">→</span>Vous pourrez recevoir les paiements de vos ventes via Wave, Orange Money ou virement bancaire (vérification KYC requise)</li>
          <li class="flex items-start gap-2"><span class="text-orange-primary mt-0.5">→</span>Votre compte acheteur reste actif — vous pourrez toujours acheter des billets</li>
        </ul>
      </div>

      <label class="flex items-start gap-3 cursor-pointer mb-2 select-none">
        <input
          v-model="accepted"
          type="checkbox"
          class="mt-1 w-4 h-4 rounded border-border-light accent-orange-primary cursor-pointer shrink-0"
        />
        <span class="text-sm text-text-secondary leading-relaxed">
          J'ai lu et j'accepte les
          <NuxtLink to="/legal/cgu" target="_blank" class="text-orange-primary hover:underline font-semibold">Conditions Générales d'Utilisation Organisateur</NuxtLink>
          et la
          <NuxtLink to="/legal/privacy" target="_blank" class="text-orange-primary hover:underline font-semibold">politique de traitement des données</NuxtLink>
          spécifiques aux organisateurs.
        </span>
      </label>

      <p v-if="errorMsg" class="text-xs text-red-error mt-1 mb-3">{{ errorMsg }}</p>

      <div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 mt-6">
        <NuxtLink
          to="/account"
          class="flex-1 inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-semibold text-text-secondary bg-surface-2 hover:bg-surface-3 transition-colors"
        >
          Annuler — rester acheteur
        </NuxtLink>
        <button
          type="button"
          :disabled="loading || !accepted"
          class="flex-1 inline-flex items-center justify-center px-5 py-3 rounded-lg text-sm font-bold text-white bg-orange-primary hover:bg-orange-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          @click="activate"
        >
          <svg v-if="loading" class="animate-spin mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" class="opacity-25"/>
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" class="opacity-75"/>
          </svg>
          {{ loading ? 'Activation…' : "Activer mon compte organisateur" }}
        </button>
      </div>
    </div>
  </div>
</template>
