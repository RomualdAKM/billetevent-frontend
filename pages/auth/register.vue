<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })

const { register } = useAuthApi()
const authStore = useAuthStore()
const { success, error: notifyError } = useNotification()
const route = useRoute()

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const acceptTerms = ref(false)
const errors = ref({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', terms: '' })
const loading = ref(false)

const passwordStrength = computed(() => {
  const p = password.value
  if (!p) return { level: 0, label: '', color: '' }
  let score = 0
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  if (score <= 1) return { level: 1, label: 'Faible', color: 'bg-red-error' }
  if (score <= 2) return { level: 2, label: 'Moyen', color: 'bg-gold' }
  if (score <= 3) return { level: 3, label: 'Bon', color: 'bg-gold' }
  return { level: 4, label: 'Fort', color: 'bg-green-dark' }
})

const validateEmail = (val: string) => {
  if (!val) return 'L\'adresse email est requise'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Format d\'email invalide'
  return ''
}

const handleRegister = async () => {
  errors.value.firstName = !firstName.value.trim() ? 'Le prénom est requis' : ''
  errors.value.lastName = !lastName.value.trim() ? 'Le nom est requis' : ''
  errors.value.email = validateEmail(email.value)
  errors.value.password = !password.value ? 'Le mot de passe est requis' : password.value.length < 8 ? 'Le mot de passe doit contenir au moins 8 caractères' : ''
  errors.value.confirmPassword = !confirmPassword.value ? 'La confirmation est requise' : confirmPassword.value !== password.value ? 'Les mots de passe ne correspondent pas' : ''
  errors.value.terms = !acceptTerms.value ? 'Vous devez accepter les Conditions Générales' : ''
  const hasErrors = Object.values(errors.value).some(e => e)
  if (hasErrors) {
    notifyError('Veuillez corriger les erreurs du formulaire')
    return
  }
  try {
    loading.value = true
    const response = await register({
      first_name: firstName.value,
      last_name: lastName.value,
      email: email.value,
      password: password.value,
      password_confirmation: confirmPassword.value,
      accept_terms: true,
    })
    success('Compte créé avec succès ! Vérifiez votre email.')
    const otpQuery: Record<string, string> = { email: email.value }
    if (typeof route.query.redirect === 'string') otpQuery.redirect = route.query.redirect
    await navigateTo({ path: '/auth/verify-otp', query: otpQuery })
  } catch (err: any) {
    if (err?.status === 422 && err?.errors) {
      const serverErrors = err.errors
      if (serverErrors.first_name) errors.value.firstName = serverErrors.first_name[0]
      if (serverErrors.last_name) errors.value.lastName = serverErrors.last_name[0]
      if (serverErrors.email) errors.value.email = serverErrors.email[0]
      if (serverErrors.password) errors.value.password = serverErrors.password[0]
      if (serverErrors.accept_terms) errors.value.terms = serverErrors.accept_terms[0]
    } else {
      notifyError(err?.message || err?.data?.message || 'Une erreur est survenue')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="contents">
  <AuthAuthPanel />
  <div class="flex-1 flex items-center justify-center px-6 py-10 lg:px-12 bg-bg-primary">
    <form @submit.prevent="handleRegister" class="w-full max-w-[480px] bg-surface rounded-[20px] border border-border-light px-10 py-11 ">
      <div class="mb-7">
        <div class="font-serif text-[1.6rem] text-text-primary mb-1.5">Créer un compte</div>
        <div class="text-[0.83rem] text-text-secondary leading-[1.55]">Créez votre espace organisateur et commencez à vendre des billets.</div>
      </div>
      <AuthSocialButtons />
      <div class="grid grid-cols-2 gap-3">
        <div class="mb-4">
          <label class="block text-[0.78rem] font-semibold text-text-secondary mb-1.5 tracking-[0.01em]">
            Prénom <span class="text-orange-primary ml-0.5">*</span>
          </label>
          <input v-model="firstName" type="text" autocomplete="given-name" autocapitalize="words" autofocus placeholder="Awa" class="w-full px-3.5 py-2.5 border-[1.5px] rounded-lg font-sans text-[0.87rem] text-text-primary bg-surface outline-none placeholder:text-text-tertiary focus:border-orange-primary transition-colors" :class="errors.firstName ? 'border-red-error' : 'border-border-light'" @input="errors.firstName = ''" />
          <p v-if="errors.firstName" class="text-[0.75rem] text-red-error mt-1">{{ errors.firstName }}</p>
        </div>
        <div class="mb-4">
          <label class="block text-[0.78rem] font-semibold text-text-secondary mb-1.5 tracking-[0.01em]">
            Nom <span class="text-orange-primary ml-0.5">*</span>
          </label>
          <input v-model="lastName" type="text" autocomplete="family-name" autocapitalize="words" placeholder="Diallo" class="w-full px-3.5 py-2.5 border-[1.5px] rounded-lg font-sans text-[0.87rem] text-text-primary bg-surface outline-none placeholder:text-text-tertiary focus:border-orange-primary transition-colors" :class="errors.lastName ? 'border-red-error' : 'border-border-light'" @input="errors.lastName = ''" />
          <p v-if="errors.lastName" class="text-[0.75rem] text-red-error mt-1">{{ errors.lastName }}</p>
        </div>
      </div>
      <div class="mb-4">
        <label class="block text-[0.78rem] font-semibold text-text-secondary mb-1.5 tracking-[0.01em]">
          Adresse email <span class="text-orange-primary ml-0.5">*</span>
        </label>
        <input v-model="email" type="email" autocomplete="email" inputmode="email" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="you@example.com" class="w-full px-3.5 py-2.5 border-[1.5px] rounded-lg font-sans text-[0.87rem] text-text-primary bg-surface outline-none placeholder:text-text-tertiary focus:border-orange-primary transition-colors" :class="errors.email ? 'border-red-error' : 'border-border-light'" @input="errors.email = ''" />
        <p v-if="errors.email" class="text-[0.75rem] text-red-error mt-1">{{ errors.email }}</p>
      </div>
      <div class="mb-4">
        <label class="block text-[0.78rem] font-semibold text-text-secondary mb-1.5 tracking-[0.01em]">
          Mot de passe <span class="text-orange-primary ml-0.5">*</span>
        </label>
        <div class="relative">
          <input v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="Min. 8 caractères" class="w-full px-3.5 py-2.5 pr-[42px] border-[1.5px] rounded-lg font-sans text-[0.87rem] text-text-primary bg-surface outline-none placeholder:text-text-tertiary focus:border-orange-primary transition-colors" :class="errors.password ? 'border-red-error' : 'border-border-light'" @input="errors.password = ''" />
          <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary flex items-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        <p v-if="errors.password" class="text-[0.75rem] text-red-error mt-1">{{ errors.password }}</p>
        <div v-if="password && !errors.password" class="mt-2">
          <div class="flex gap-1 mb-1">
            <div v-for="i in 4" :key="i" class="flex-1 h-[3px] rounded-sm" :class="i <= passwordStrength.level ? passwordStrength.color : 'bg-border-light'"></div>
          </div>
          <div class="text-[0.7rem] text-text-tertiary">{{ passwordStrength.label }}</div>
        </div>
      </div>
      <div class="mb-4">
        <label class="block text-[0.78rem] font-semibold text-text-secondary mb-1.5 tracking-[0.01em]">
          Confirmer le mot de passe <span class="text-orange-primary ml-0.5">*</span>
        </label>
        <div class="relative">
          <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="••••••••" class="w-full px-3.5 py-2.5 pr-[42px] border-[1.5px] rounded-lg font-sans text-[0.87rem] text-text-primary bg-surface outline-none placeholder:text-text-tertiary focus:border-orange-primary transition-colors" :class="errors.confirmPassword ? 'border-red-error' : 'border-border-light'" @input="errors.confirmPassword = ''" />
          <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary flex items-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        <p v-if="errors.confirmPassword" class="text-[0.75rem] text-red-error mt-1">{{ errors.confirmPassword }}</p>
      </div>
      <div class="flex items-start gap-2.5 mb-5">
        <input v-model="acceptTerms" type="checkbox" id="cgu" class="w-4 h-4 mt-0.5 accent-orange-primary shrink-0" @change="errors.terms = ''" />
        <label for="cgu" class="text-[0.78rem] text-text-secondary leading-[1.5]">J'accepte les <NuxtLink to="/legal/cgu" target="_blank" class="text-orange-primary font-medium hover:underline">Conditions Générales</NuxtLink> et la <NuxtLink to="/legal/privacy" target="_blank" class="text-orange-primary font-medium hover:underline">Politique de Confidentialité</NuxtLink> de BilletEvent.</label>
      </div>
      <p v-if="errors.terms" class="text-[0.75rem] text-red-error -mt-3 mb-4">{{ errors.terms }}</p>
      <button
        type="submit"
        :disabled="loading"
        class="w-full py-3 bg-orange-primary text-white rounded-lg border-none text-[0.9rem] font-bold font-sans flex items-center justify-center gap-2 hover:bg-orange-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg v-if="!loading" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        <svg v-else class="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        {{ loading ? 'Création...' : 'Créer mon compte' }}
      </button>
      <div class="text-center mt-5 text-[0.8rem] text-text-tertiary">
        Déjà un compte ? <NuxtLink :to="{ path: '/auth/login', query: typeof route.query.redirect === 'string' ? { redirect: route.query.redirect } : undefined }" class="text-orange-primary font-semibold">Se connecter</NuxtLink>
      </div>
      <div class="text-center mt-4">
        <NuxtLink to="/" class="text-sm text-gray-500 hover:text-orange-500 transition-colors">
          Retour à l'accueil
        </NuxtLink>
      </div>
    </form>
  </div>
  </div>
</template>
