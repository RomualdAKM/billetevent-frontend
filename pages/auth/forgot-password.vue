<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })

const route = useRoute()
const { forgotPassword } = useAuthApi()
const { success, error: notifyError } = useNotification()

// Pre-fill from ?email=... so that the GuestAccountWelcome mail link drops
// users straight into "send me a reset email"
const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const emailError = ref('')
const loading = ref(false)
const sent = ref(false)

const handleForgotPassword = async () => {
  if (!email.value) {
    emailError.value = 'L\'adresse email est requise'
    notifyError('Veuillez entrer votre adresse email')
    return
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    emailError.value = 'Format d\'email invalide'
    notifyError('Veuillez entrer un email valide')
    return
  }
  try {
    loading.value = true
    await forgotPassword({ email: email.value })
    sent.value = true
    success('Lien de réinitialisation envoyé à votre email')
  } catch (err: any) {
    if (err?.status === 422 && err?.errors) {
      if (err.errors.email) emailError.value = err.errors.email[0]
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
    <form @submit.prevent="handleForgotPassword" class="w-full max-w-[480px] bg-surface rounded-[20px] border border-border-light px-10 py-11 ">
      <NuxtLink to="/auth/login" class="inline-flex items-center gap-1.5 text-[0.78rem] text-text-tertiary mb-5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Retour à la connexion
      </NuxtLink>
      <div class="w-16 h-16 rounded-full bg-orange-dim flex items-center justify-center mx-auto mb-5 text-orange-primary">
        <svg v-if="!sent" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
        <svg v-else width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
      </div>
      <div v-if="!sent" class="mb-7 text-center">
        <div class="font-serif text-[1.6rem] text-text-primary mb-1.5">Mot de passe oublié ?</div>
        <div class="text-[0.83rem] text-text-secondary leading-[1.55]">Entrez votre adresse email. Nous vous enverrons un lien pour réinitialiser votre mot de passe.</div>
      </div>
      <div v-else class="mb-7 text-center">
        <div class="font-serif text-[1.6rem] text-text-primary mb-1.5">Email envoyé !</div>
        <div class="text-[0.83rem] text-text-secondary leading-[1.55]">Un lien de réinitialisation a été envoyé à <strong class="text-text-primary">{{ email }}</strong>. Vérifiez votre boîte de réception.</div>
      </div>
      <template v-if="!sent">
        <div class="mb-4">
          <label class="block text-[0.78rem] font-semibold text-text-secondary mb-1.5 tracking-[0.01em]">
            Adresse email <span class="text-orange-primary ml-0.5">*</span>
          </label>
          <input v-model="email" type="email" autocomplete="email" inputmode="email" autocapitalize="off" autocorrect="off" spellcheck="false" autofocus placeholder="vous@exemple.com" class="w-full px-3.5 py-2.5 border-[1.5px] rounded-lg font-sans text-[0.87rem] text-text-primary bg-surface outline-none placeholder:text-text-tertiary focus:border-orange-primary transition-colors" :class="emailError ? 'border-red-error' : 'border-border-light'" @input="emailError = ''" />
          <p v-if="emailError" class="text-[0.75rem] text-red-error mt-1">{{ emailError }}</p>
        </div>
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-3 bg-orange-primary text-white rounded-lg border-none text-[0.9rem] font-bold font-sans flex items-center justify-center gap-2 mt-2 hover:bg-orange-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg v-if="!loading" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          <svg v-else class="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
          {{ loading ? 'Envoi...' : 'Envoyer le lien' }}
        </button>
      </template>
      <template v-else>
        <button type="button" class="w-full py-3 bg-orange-primary text-white rounded-lg border-none text-[0.9rem] font-bold font-sans flex items-center justify-center gap-2 mt-2 hover:bg-orange-light transition-colors" @click="sent = false">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          Renvoyer l'email
        </button>
      </template>
      <div class="text-center mt-4">
        <NuxtLink to="/" class="text-sm text-gray-500 hover:text-orange-500 transition-colors">
          Retour à l'accueil
        </NuxtLink>
      </div>
    </form>
  </div>
  </div>
</template>
