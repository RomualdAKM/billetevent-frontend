<script setup lang="ts">
definePageMeta({ layout: 'account', middleware: 'auth' })

const api = useAccountApi()
const authStore = useAuthStore()
const { success, error: showError } = useNotification()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const savingPassword = ref(false)
const deleting = ref(false)
const uploadingAvatar = ref(false)
const fieldErrors = ref<Record<string, string>>({})

const firstName = ref('')
const lastName = ref('')
const email = ref('')
const phone = ref('')
const birthDate = ref('')
const city = ref('')
const avatarFile = ref<File | null>(null)
const avatarFileName = ref('')
const avatarUrl = computed(() => (authStore.user as any)?.avatar || '')

const initials = computed(() => {
  const f = firstName.value.charAt(0)
  const l = lastName.value.charAt(0)
  const result = (f + l).toUpperCase()
  return result || '?'
})

const fileInput = ref<HTMLInputElement | null>(null)
const triggerUpload = () => fileInput.value?.click()

const onFileSelect = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  avatarFile.value = file
  avatarFileName.value = file.name
  uploadingAvatar.value = true
  try {
    const formData = new FormData()
    formData.append('avatar', file)
    await api.uploadAvatar(formData)
    await authStore.fetchUser()
    success('Photo de profil mise à jour')
  } catch (err: any) {
    showError(err?.message || err?.errors?.avatar?.[0] || 'Erreur lors du téléchargement de l\'avatar')
  } finally {
    uploadingAvatar.value = false
  }
}

const populateFromUser = (data: Record<string, any>) => {
  firstName.value = data.first_name || data.firstName || ''
  lastName.value = data.last_name || data.lastName || ''
  email.value = data.email || ''
  phone.value = data.phone || ''
  birthDate.value = data.birth_date || data.birthDate || ''
  city.value = data.city || ''
}

const loadProfile = async () => {
  loading.value = true
  try {
    const res = await api.getProfile()
    const data = res.data ?? res
    populateFromUser(data)
  } catch {
    showError('Impossible de charger le profil')
  } finally {
    loading.value = false
  }
}

if (authStore.user) {
  populateFromUser(authStore.user)
}

onMounted(loadProfile)

const saveProfile = async () => {
  fieldErrors.value = {}
  if (!firstName.value.trim() || !lastName.value.trim()) {
    showError('Veuillez remplir tous les champs obligatoires')
    return
  }
  if (!phone.value.trim()) {
    showError('Le numéro de téléphone est requis')
    return
  }
  saving.value = true
  try {
    await api.updateProfile({
      first_name: firstName.value,
      last_name: lastName.value,
      phone: phone.value,
      birth_date: birthDate.value,
      city: city.value,
    })
    await authStore.fetchUser()
    success('Profil mis à jour avec succès')
  } catch (err: any) {
    if (err?.status === 422 && err?.errors) {
      fieldErrors.value = Object.fromEntries(
        Object.entries(err.errors).map(([k, v]: [string, any]) => [k, Array.isArray(v) ? v[0] : v])
      )
    } else {
      showError(err?.message || err?.data?.message || 'Erreur lors de la mise à jour du profil')
    }
  } finally {
    saving.value = false
  }
}

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

const updatePassword = async () => {
  fieldErrors.value = {}
  if (!currentPassword.value) {
    showError('Veuillez entrer votre mot de passe actuel')
    return
  }
  if (newPassword.value.length < 8) {
    showError('Le nouveau mot de passe doit contenir au moins 8 caractères')
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    showError('Les mots de passe ne correspondent pas')
    return
  }
  savingPassword.value = true
  try {
    await api.changePassword({
      current_password: currentPassword.value,
      password: newPassword.value,
      password_confirmation: confirmPassword.value,
    })
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    success('Mot de passe mis à jour avec succès')
  } catch (err: any) {
    if (err?.status === 422 && err?.errors) {
      const msg = err.errors.current_password?.[0] || err.errors.password?.[0] || 'Erreur de validation'
      showError(msg)
    } else {
      showError(err?.message || err?.data?.message || 'Erreur lors du changement de mot de passe')
    }
  } finally {
    savingPassword.value = false
  }
}

const showDeleteModal = ref(false)
const deletePassword = ref('')
const deletePasswordError = ref('')
const confirmDelete = async () => {
  if (!deletePassword.value) {
    deletePasswordError.value = 'Saisissez votre mot de passe pour confirmer.'
    return
  }
  deletePasswordError.value = ''
  deleting.value = true
  try {
    // Backend requires the current password as confirmation — without it,
    // the request 422s silently. See AccountController::deleteAccount.
    await api.deleteAccount(deletePassword.value)
    showDeleteModal.value = false
    authStore.logout()
    router.replace('/')
  } catch (err: any) {
    if (err?.status === 422 && err?.errors?.password) {
      deletePasswordError.value = err.errors.password[0]
    } else {
      showError(err?.message || 'Erreur lors de la suppression du compte')
    }
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="font-serif text-2xl text-text-primary">Mon profil</h1>
      <p class="text-text-secondary mt-1">Gérer vos informations personnelles</p>
    </div>

    <div class="flex items-center gap-5 mb-8">
      <NuxtImg
        v-if="avatarUrl"
        :src="avatarUrl"
        alt="Avatar"
        :width="96"
        :height="96"
        class="w-24 h-24 rounded-full object-cover shrink-0 bg-surface-2"
      />
      <div v-else class="w-24 h-24 rounded-full bg-orange-primary text-white text-2xl font-semibold flex items-center justify-center shrink-0">
        {{ initials }}
      </div>
      <div>
        <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileSelect" />
        <button
          type="button"
          :disabled="uploadingAvatar"
          class="px-4 py-2 rounded-lg text-sm font-medium bg-surface-2 text-text-primary hover:bg-surface-3 transition-colors disabled:opacity-60"
          @click="triggerUpload"
        >
          {{ uploadingAvatar ? 'Envoi…' : 'Changer la photo' }}
        </button>
        <p v-if="avatarFileName && !uploadingAvatar" class="text-sm text-text-tertiary mt-2">{{ avatarFileName }}</p>
      </div>
    </div>

    <div class="bg-surface rounded-xl p-6 sm:p-8">
      <h2 class="text-lg font-semibold text-text-primary mb-6">Informations personnelles</h2>
      <form @submit.prevent="saveProfile">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1.5">Prénom</label>
            <input
              v-model="firstName"
              type="text"
              class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-orange-primary/30 focus:border-orange-primary transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1.5">Nom</label>
            <input
              v-model="lastName"
              type="text"
              class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-orange-primary/30 focus:border-orange-primary transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
            <input
              :value="email"
              type="email"
              disabled
              class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-surface-2 text-text-tertiary text-sm cursor-not-allowed"
            />
            <p class="text-xs text-text-tertiary mt-1">L'email ne peut pas être modifié</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1.5">Téléphone</label>
            <input
              v-model="phone"
              type="tel"
              class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-orange-primary/30 focus:border-orange-primary transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1.5">Date de naissance</label>
            <input
              v-model="birthDate"
              type="date"
              class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-orange-primary/30 focus:border-orange-primary transition"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-secondary mb-1.5">Ville</label>
            <input
              v-model="city"
              type="text"
              class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-bg-primary text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-orange-primary/30 focus:border-orange-primary transition"
            />
          </div>
        </div>
        <div class="mt-6 flex justify-end">
          <button
            type="submit"
            class="px-6 py-2.5 rounded-lg text-sm font-medium bg-orange-primary text-white hover:bg-orange-light transition-colors"
          >
            Enregistrer
          </button>
        </div>
      </form>
    </div>

    <div class="bg-surface rounded-xl p-6 sm:p-8 mt-6">
      <h2 class="text-lg font-semibold text-text-primary mb-6">Changer le mot de passe</h2>
      <form @submit.prevent="updatePassword" class="max-w-md space-y-4">
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1.5">Mot de passe actuel</label>
          <div class="relative">
            <input
              v-model="currentPassword"
              :type="showCurrentPassword ? 'text' : 'password'"
              class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-bg-primary text-text-primary text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-orange-primary/30 focus:border-orange-primary transition"
            />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary" @click="showCurrentPassword = !showCurrentPassword">
              <svg v-if="!showCurrentPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1.5">Nouveau mot de passe</label>
          <div class="relative">
            <input
              v-model="newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-bg-primary text-text-primary text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-orange-primary/30 focus:border-orange-primary transition"
            />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary" @click="showNewPassword = !showNewPassword">
              <svg v-if="!showNewPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            </button>
          </div>
          <p v-if="newPassword && newPassword.length < 8" class="text-xs text-red-error mt-1">8 caractères minimum</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1.5">Confirmer le nouveau mot de passe</label>
          <div class="relative">
            <input
              v-model="confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              class="w-full px-4 py-2.5 rounded-lg border border-border-light bg-bg-primary text-text-primary text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-orange-primary/30 focus:border-orange-primary transition"
            />
            <button type="button" class="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary" @click="showConfirmPassword = !showConfirmPassword">
              <svg v-if="!showConfirmPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            </button>
          </div>
          <p v-if="confirmPassword && confirmPassword !== newPassword" class="text-xs text-red-error mt-1">Les mots de passe ne correspondent pas</p>
        </div>
        <div class="pt-2">
          <button
            type="submit"
            class="px-6 py-2.5 rounded-lg text-sm font-medium bg-blue-main text-white hover:bg-blue-main/90 transition-colors"
          >
            Mettre à jour
          </button>
        </div>
      </form>
    </div>

    <div class="border border-red-error/20 rounded-xl p-6 sm:p-8 mt-6">
      <h2 class="text-lg font-semibold text-red-error mb-2">Zone de danger</h2>
      <p class="text-sm text-text-secondary mb-4">
        La suppression de votre compte est définitive. Toutes vos données, billets et historique de commandes seront perdus.
      </p>
      <button
        type="button"
        class="px-5 py-2.5 rounded-lg text-sm font-medium bg-red-error text-white hover:bg-red-error/90 transition-colors"
        @click="showDeleteModal = true"
      >
        Supprimer mon compte
      </button>
    </div>

    <UiConfirmModal
      :is-open="showDeleteModal"
      title="Supprimer le compte"
      message="Cette action est irréversible. Toutes vos données seront supprimées."
      confirm-text="Supprimer"
      cancel-text="Annuler"
      variant="danger"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>
