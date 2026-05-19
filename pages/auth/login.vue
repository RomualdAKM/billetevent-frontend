<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })

const { login } = useAuthApi()
const authStore = useAuthStore()
const { success, error: notifyError } = useNotification()
const route = useRoute()
const { getSafeRedirect } = useSafeRedirect()

const showPassword = ref(false)
const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const errors = ref({ email: '', password: '' })
const loading = ref(false)

const validateEmail = (val: string) => {
  if (!val) return 'L\'adresse email est requise'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Format d\'email invalide'
  return ''
}

const handleLogin = async () => {
  errors.value.email = validateEmail(email.value)
  errors.value.password = !password.value ? 'Le mot de passe est requis' : password.value.length < 6 ? 'Le mot de passe doit contenir au moins 6 caractères' : ''
  if (errors.value.email || errors.value.password) {
    notifyError('Veuillez corriger les erreurs du formulaire')
    return
  }
  try {
    loading.value = true
    const response = await login({ email: email.value, password: password.value })
    authStore.setAuth(response.user as Record<string, unknown>, response.token)
    await authStore.fetchUser()
    success('Connexion réussie !')
    await navigateTo(getSafeRedirect(route.query.redirect))
  } catch (err: any) {
    if (err?.status === 422 && err?.errors) {
      if (err.errors.email) errors.value.email = err.errors.email[0]
      if (err.errors.password) errors.value.password = err.errors.password[0]
    } else if (err?.response?.status === 403 || err?.status === 403) {
      const msg = err?.message || err?.data?.message || err?.response?._data?.message || 'Veuillez vérifier votre email'
      notifyError(msg)
      const otpQuery: Record<string, string> = { email: email.value }
      if (typeof route.query.redirect === 'string') otpQuery.redirect = route.query.redirect
      await navigateTo({ path: '/auth/verify-otp', query: otpQuery })
    } else {
      notifyError(err?.message || err?.data?.message || 'Email ou mot de passe incorrect')
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
    <form @submit.prevent="handleLogin" class="w-full max-w-[480px] bg-surface rounded-[20px] border border-border-light px-10 py-11 ">
      <div class="mb-7">
        <div class="font-serif text-[1.6rem] text-text-primary mb-1.5">Bon retour parmi nous</div>
        <div class="text-[0.83rem] text-text-secondary leading-[1.55]">Connectez-vous à votre compte BilletEvent.</div>
      </div>
      <AuthSocialButtons />
      <div class="mb-4">
        <label class="block text-[0.78rem] font-semibold text-text-secondary mb-1.5 tracking-[0.01em]">
          Adresse email <span class="text-orange-primary ml-0.5">*</span>
        </label>
        <input
          v-model="email"
          type="email"
          autocomplete="email"
          inputmode="email"
          autocapitalize="off"
          autocorrect="off"
          spellcheck="false"
          autofocus
          placeholder="you@example.com"
          class="w-full px-3.5 py-2.5 border-[1.5px] rounded-lg font-sans text-[0.87rem] text-text-primary bg-surface outline-none placeholder:text-text-tertiary focus:border-orange-primary transition-colors"
          :class="errors.email ? 'border-red-error' : 'border-border-light'"
          @input="errors.email = ''"
        />
        <p v-if="errors.email" class="text-[0.75rem] text-red-error mt-1">{{ errors.email }}</p>
      </div>
      <div class="mb-4">
        <label class="block text-[0.78rem] font-semibold text-text-secondary mb-1.5 tracking-[0.01em]">
          Mot de passe <span class="text-orange-primary ml-0.5">*</span>
          <NuxtLink to="/auth/forgot-password" class="text-[0.75rem] text-orange-primary font-medium float-right">Mot de passe oublié ?</NuxtLink>
        </label>
        <div class="relative">
          <input
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="••••••••"
            class="w-full px-3.5 py-2.5 pr-[42px] border-[1.5px] rounded-lg font-sans text-[0.87rem] text-text-primary bg-surface outline-none placeholder:text-text-tertiary focus:border-orange-primary transition-colors"
            :class="errors.password ? 'border-red-error' : 'border-border-light'"
            @input="errors.password = ''"
          />
          <button type="button" @click="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary flex items-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        <p v-if="errors.password" class="text-[0.75rem] text-red-error mt-1">{{ errors.password }}</p>
      </div>
      <div class="flex items-start gap-2.5 mb-6">
        <input v-model="rememberMe" type="checkbox" id="remember" class="w-4 h-4 mt-0.5 accent-orange-primary shrink-0" />
        <label for="remember" class="text-[0.78rem] text-text-secondary leading-[1.5]">Se souvenir de moi</label>
      </div>
      <button
        type="submit"
        :disabled="loading"
        class="w-full py-3 bg-orange-primary text-white rounded-lg border-none text-[0.9rem] font-bold font-sans flex items-center justify-center gap-2 hover:bg-orange-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg v-if="!loading" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        <svg v-else class="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        {{ loading ? 'Connexion...' : 'Se connecter' }}
      </button>
      <div class="text-center mt-5 text-[0.8rem] text-text-tertiary">
        Vous n'avez pas de compte ? <NuxtLink :to="{ path: '/auth/register', query: typeof route.query.redirect === 'string' ? { redirect: route.query.redirect } : undefined }" class="text-orange-primary font-semibold">Créer un compte</NuxtLink>
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
