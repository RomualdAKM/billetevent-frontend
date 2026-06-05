<script setup lang="ts">
/**
 * Onglet Sécurité — changement de mot de passe + déconnexion globale.
 * MVP : pas encore de 2FA ni de liste de sessions actives.
 */
const { success, error: notifyError } = useNotification()
const { changePassword } = useAccountApi()
const { logout: apiLogout } = useAuthApi()
const authStore = useAuthStore()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const saving = ref(false)
const errors = ref<Record<string, string>>({})

async function submitChangePassword() {
  errors.value = {}
  if (!currentPassword.value) {
    errors.value.current_password = 'Veuillez saisir votre mot de passe actuel'
    return
  }
  if (!newPassword.value || newPassword.value.length < 8) {
    errors.value.new_password = 'Minimum 8 caractères'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    errors.value.confirm_password = 'Les deux mots de passe ne correspondent pas'
    return
  }
  saving.value = true
  try {
    await changePassword({
      current_password: currentPassword.value,
      password: newPassword.value,
      password_confirmation: confirmPassword.value,
    })
    success('Mot de passe modifié avec succès')
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
  } catch (err: any) {
    if (err?.errors) {
      errors.value = Object.fromEntries(
        Object.entries(err.errors).map(([k, v]: any) => [k, Array.isArray(v) ? v[0] : v])
      )
    } else {
      notifyError(err?.message || 'Impossible de modifier le mot de passe')
    }
  } finally {
    saving.value = false
  }
}

const showLogoutConfirm = ref(false)
const loggingOut = ref(false)

async function logoutAllSessions() {
  // MVP : on déconnecte juste la session courante. Backend /auth/logout
  // peut être étendu plus tard pour revoke tous les tokens Sanctum.
  loggingOut.value = true
  try {
    await apiLogout()
    authStore.logout()
    navigateTo('/auth/login')
  } catch {
    notifyError('Erreur lors de la déconnexion')
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div class="space-y-8 max-w-2xl">
    <!-- Changement de mot de passe -->
    <section>
      <h2 class="font-serif text-lg text-text-primary mb-1">Mot de passe</h2>
      <p class="text-sm text-text-secondary mb-5">Utilisez un mot de passe fort, différent de ceux de vos autres comptes.</p>

      <form class="space-y-4" @submit.prevent="submitChangePassword">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wide text-text-tertiary mb-1.5">Mot de passe actuel</label>
          <input
            v-model="currentPassword"
            name="current_password"
            type="password"
            autocomplete="current-password"
            class="w-full border-[1.5px] rounded-lg px-3.5 py-2.5 text-sm bg-white outline-none focus:border-orange-primary transition-colors"
            :class="errors.current_password ? 'border-red-error' : 'border-border-light'"
            @input="errors.current_password = ''"
          />
          <p v-if="errors.current_password" class="text-xs text-red-error mt-1">{{ errors.current_password }}</p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wide text-text-tertiary mb-1.5">Nouveau mot de passe</label>
            <input
              v-model="newPassword"
              name="new_password"
              type="password"
              autocomplete="new-password"
              placeholder="Min. 8 caractères"
              class="w-full border-[1.5px] rounded-lg px-3.5 py-2.5 text-sm bg-white outline-none focus:border-orange-primary transition-colors"
              :class="errors.new_password || errors.password ? 'border-red-error' : 'border-border-light'"
              @input="errors.new_password = ''; errors.password = ''"
            />
            <p v-if="errors.new_password || errors.password" class="text-xs text-red-error mt-1">{{ errors.new_password || errors.password }}</p>
          </div>
          <div>
            <label class="block text-xs font-bold uppercase tracking-wide text-text-tertiary mb-1.5">Confirmer</label>
            <input
              v-model="confirmPassword"
              name="confirm_password"
              type="password"
              autocomplete="new-password"
              class="w-full border-[1.5px] rounded-lg px-3.5 py-2.5 text-sm bg-white outline-none focus:border-orange-primary transition-colors"
              :class="errors.confirm_password ? 'border-red-error' : 'border-border-light'"
              @input="errors.confirm_password = ''"
            />
            <p v-if="errors.confirm_password" class="text-xs text-red-error mt-1">{{ errors.confirm_password }}</p>
          </div>
        </div>
        <button
          type="submit"
          :disabled="saving"
          class="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold bg-orange-primary text-white hover:bg-orange-light transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {{ saving ? 'Modification…' : 'Mettre à jour le mot de passe' }}
        </button>
      </form>
    </section>

    <!-- Déconnexion -->
    <section class="border-t border-border-light pt-8">
      <h2 class="font-serif text-lg text-text-primary mb-1">Session</h2>
      <p class="text-sm text-text-secondary mb-5">Vous êtes actuellement connecté en tant que <strong class="text-text-primary">{{ (authStore.user as any)?.email }}</strong>.</p>
      <button
        type="button"
        :disabled="loggingOut"
        class="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-bold bg-red-error text-white hover:bg-red-error/90 transition-colors disabled:opacity-60"
        @click="showLogoutConfirm = true"
      >
        {{ loggingOut ? 'Déconnexion…' : 'Se déconnecter' }}
      </button>
    </section>

    <UiConfirmModal
      :is-open="showLogoutConfirm"
      title="Se déconnecter ?"
      message="Vous devrez vous reconnecter pour accéder à votre compte."
      confirm-text="Oui, déconnecter"
      cancel-text="Annuler"
      variant="warning"
      @confirm="logoutAllSessions"
      @cancel="showLogoutConfirm = false"
    />
  </div>
</template>
