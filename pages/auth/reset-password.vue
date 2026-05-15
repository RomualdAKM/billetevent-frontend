<script setup lang="ts">
definePageMeta({ layout: 'auth', middleware: 'guest' })

const route = useRoute()
const { resetPassword } = useAuthApi()
const { success, error: notifyError } = useNotification()

const tokenParam = (route.query.token as string) || ''
const emailParam = (route.query.email as string) || ''

const newPassword = ref('')
const confirmPassword = ref('')
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const errors = ref({ newPassword: '', confirmPassword: '' })
const loading = ref(false)

const passwordStrength = computed(() => {
  const p = newPassword.value
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

const handleResetPassword = async () => {
  errors.value.newPassword = !newPassword.value ? 'Le mot de passe est requis' : newPassword.value.length < 8 ? 'Le mot de passe doit contenir au moins 8 caractères' : ''
  errors.value.confirmPassword = !confirmPassword.value ? 'La confirmation est requise' : confirmPassword.value !== newPassword.value ? 'Les mots de passe ne correspondent pas' : ''
  if (errors.value.newPassword || errors.value.confirmPassword) {
    notifyError('Veuillez corriger les erreurs du formulaire')
    return
  }
  try {
    loading.value = true
    await resetPassword({
      token: tokenParam,
      email: emailParam,
      password: newPassword.value,
      password_confirmation: confirmPassword.value,
    })
    success('Mot de passe réinitialisé avec succès !')
    await navigateTo('/auth/login')
  } catch (err: any) {
    if (err?.status === 422 && err?.errors) {
      if (err.errors.password) errors.value.newPassword = err.errors.password[0]
      if (err.errors.email) notifyError(err.errors.email[0])
      if (err.errors.token) notifyError('Le lien de réinitialisation est invalide ou expiré')
    } else {
      notifyError(err?.message || err?.data?.message || 'Impossible de réinitialiser le mot de passe')
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
    <div class="w-full max-w-[480px] bg-surface rounded-[20px] border border-border-light px-10 py-11 ">
      <NuxtLink to="/auth/login" class="inline-flex items-center gap-1.5 text-[0.78rem] text-text-tertiary mb-5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Retour à la connexion
      </NuxtLink>
      <div class="inline-flex items-center gap-1.5 bg-orange-dim text-orange-primary rounded-full px-3 py-1 text-[0.72rem] font-bold uppercase tracking-[0.08em] mb-3.5">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        Nouveau mot de passe
      </div>
      <div class="mb-7">
        <div class="font-serif text-[1.6rem] text-text-primary mb-1.5">Réinitialiser le mot de passe</div>
        <div class="text-[0.83rem] text-text-secondary leading-[1.55]">Choisissez un nouveau mot de passe sécurisé pour votre compte.</div>
      </div>
      <div class="mb-4">
        <label class="block text-[0.78rem] font-semibold text-text-secondary mb-1.5 tracking-[0.01em]">
          Nouveau mot de passe <span class="text-orange-primary ml-0.5">*</span>
        </label>
        <div class="relative">
          <input v-model="newPassword" :type="showNewPassword ? 'text' : 'password'" placeholder="Min. 8 caractères" class="w-full px-3.5 py-2.5 pr-[42px] border-[1.5px] rounded-lg font-sans text-[0.87rem] text-text-primary bg-surface outline-none placeholder:text-text-tertiary focus:border-orange-primary transition-colors" :class="errors.newPassword ? 'border-red-error' : 'border-border-light'" @input="errors.newPassword = ''" />
          <button type="button" @click="showNewPassword = !showNewPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary flex items-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        <p v-if="errors.newPassword" class="text-[0.75rem] text-red-error mt-1">{{ errors.newPassword }}</p>
        <div v-if="newPassword && !errors.newPassword" class="mt-2">
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
          <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" placeholder="••••••••" class="w-full px-3.5 py-2.5 pr-[42px] border-[1.5px] rounded-lg font-sans text-[0.87rem] text-text-primary bg-surface outline-none placeholder:text-text-tertiary focus:border-orange-primary transition-colors" :class="errors.confirmPassword ? 'border-red-error' : 'border-border-light'" @input="errors.confirmPassword = ''" />
          <button type="button" @click="showConfirmPassword = !showConfirmPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary flex items-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        <p v-if="errors.confirmPassword" class="text-[0.75rem] text-red-error mt-1">{{ errors.confirmPassword }}</p>
      </div>
      <div class="bg-surface-2 rounded-lg px-3.5 py-3 text-[0.75rem] text-text-tertiary mb-5 leading-[1.7]">
        Au moins <strong class="text-text-secondary">8 caractères</strong> &bull; une <strong class="text-text-secondary">majuscule</strong> &bull; un <strong class="text-text-secondary">chiffre</strong> &bull; un <strong class="text-text-secondary">caractère spécial</strong>
      </div>
      <button
        :disabled="loading"
        class="w-full py-3 bg-orange-primary text-white rounded-lg border-none text-[0.9rem] font-bold font-sans flex items-center justify-center gap-2 hover:bg-orange-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        @click="handleResetPassword"
      >
        <svg v-if="!loading" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        <svg v-else class="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10"/></svg>
        {{ loading ? 'Enregistrement...' : 'Enregistrer le mot de passe' }}
      </button>
      <div class="text-center mt-4">
        <NuxtLink to="/" class="text-sm text-gray-500 hover:text-orange-500 transition-colors">
          Retour à l'accueil
        </NuxtLink>
      </div>
    </div>
  </div>
  </div>
</template>
