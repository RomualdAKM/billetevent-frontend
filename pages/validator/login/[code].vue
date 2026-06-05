<template>
  <div class="min-h-screen flex flex-col lg:flex-row">
    <div class="hidden lg:flex lg:w-1/2 bg-blue-main relative overflow-hidden items-center justify-center">
      <div class="absolute inset-0 opacity-5">
        <div class="grid grid-cols-6 gap-8 p-8 rotate-12 scale-125">
          <svg v-for="n in 48" :key="n" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1" class="opacity-30">
            <path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
          </svg>
        </div>
      </div>
      <div class="relative z-10 flex flex-col items-center text-center px-12">
        <div class="w-32 h-32 mb-8 rounded-full bg-white/10 flex items-center justify-center">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            <circle cx="12" cy="16" r="1"/>
          </svg>
        </div>
        <h1 class="font-serif text-3xl text-white mb-4">Espace Validateur</h1>
        <p class="text-white/70 text-lg leading-relaxed max-w-sm">
          Accédez à l'interface de validation pour scanner les billets des participants le jour de l'événement.
        </p>
      </div>
    </div>

    <div class="flex-1 flex items-center justify-center p-6 lg:p-12 bg-bg-primary">
      <div class="w-full max-w-md">
        <div class="text-center mb-8 lg:hidden">
          <img src="/logo.png" alt="BilletEvent" class="h-10 mx-auto mb-4" />
        </div>

        <h2 class="font-serif text-2xl text-blue-main mb-2">Authentification validateur</h2>
        <p class="text-text-secondary text-sm mb-8">Entrez le code d'accès fourni par l'organisateur</p>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1.5">Code d'accès</label>
            <input
              v-model="code"
              name="access_code"
              type="text"
              required
              autocomplete="one-time-code"
              autocapitalize="characters"
              autocorrect="off"
              spellcheck="false"
              placeholder="Code reçu sur WhatsApp"
              class="w-full border border-border-light rounded-xl px-4 py-3 text-base font-mono font-semibold tracking-wider bg-white text-text-primary placeholder:text-text-tertiary placeholder:font-sans placeholder:tracking-normal placeholder:font-normal focus:outline-none focus:border-orange-primary focus:ring-2 focus:ring-orange-primary/20 transition-all"
              :class="codeError ? 'border-red-error' : ''"
            />
            <p class="text-text-tertiary text-xs mt-1.5">Vous pouvez aussi coller le lien complet — le code sera extrait automatiquement.</p>
            <p v-if="codeError" class="text-red-error text-xs mt-1.5">{{ codeError }}</p>
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="bg-orange-primary text-white w-full py-3 rounded-xl text-lg font-semibold cursor-pointer transition-all duration-150 hover:bg-orange-light disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg v-if="loading" class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>

        <p class="text-text-tertiary text-xs mt-6 leading-relaxed text-center">
          En vous connectant en tant que validateur, vous acceptez notre
          <NuxtLink to="/legal/privacy" class="text-orange-primary hover:underline">politique de confidentialité</NuxtLink>
          et nos
          <NuxtLink to="/legal/cgv" class="text-orange-primary hover:underline">conditions générales de vente</NuxtLink>.
        </p>

        <div class="text-center mt-8">
          <NuxtLink to="/" class="text-orange-primary text-sm font-medium hover:underline inline-flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
            Retour à l'accueil
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'validator' })

const route = useRoute()
const api = useValidatorApi()
const { error: notifyError } = useNotification()

const code = ref('')
const codeError = ref('')
const loading = ref(false)

// Si l'utilisateur arrive depuis un lien WhatsApp qui contient déjà le code
// dans l'URL (path param `[code]`), pré-remplir le champ. Le validateur n'a
// plus qu'à cliquer "Se connecter". Réduit la friction de saisie sur smartphone.
onMounted(() => {
  const fromUrl = route.params.code as string
  if (fromUrl && fromUrl !== 'enter' && fromUrl.length > 4) {
    code.value = fromUrl
  }
  // Autofocus du champ après mount (les attrs HTML ne suffisent pas avec Nuxt SSR)
  nextTick(() => {
    const input = document.querySelector<HTMLInputElement>('input[name="access_code"]')
    input?.focus()
  })
})

// Si l'utilisateur colle une URL complète (ex : https://billetevent.com/validator/scan/ABC123),
// on extrait le code automatiquement.
watch(code, (val) => {
  if (typeof val !== 'string') return
  const m = val.match(/\/validator\/(?:login|scan)\/([A-Za-z0-9_-]+)/)
  if (m && m[1]) {
    code.value = m[1]
  }
})

const handleLogin = async () => {
  codeError.value = ''

  if (!code.value.trim()) {
    codeError.value = 'Veuillez entrer un code d\'accès'
    return
  }

  loading.value = true
  try {
    const response = await api.login({
      session_code: route.params.code as string,
      access_code: code.value.trim(),
    })
    const token = response?.token || response?.data?.token
    if (token) {
      localStorage.setItem('validator_token', token)
    }
    navigateTo('/validator/scan/' + route.params.code)
  } catch (err: any) {
    const message = err?.message || err?.data?.message || 'Code d\'accès invalide'
    codeError.value = message
    notifyError(message)
  } finally {
    loading.value = false
  }
}
</script>
