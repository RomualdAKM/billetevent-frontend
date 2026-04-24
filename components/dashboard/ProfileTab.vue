<script setup lang="ts">
const api = useOrganizerApi()
const { success, error } = useNotification()

const loading = ref(false)
const saving = ref(false)

const orgName = ref('')
const orgEmail = ref('')
const orgPhone = ref('')
const orgDescription = ref('')
const orgWebsite = ref('')
const orgFacebook = ref('')
const orgInstagram = ref('')
const orgTwitter = ref('')
const logoFile = ref<File | null>(null)
const logoFileName = ref('')
const logoInput = ref<HTMLInputElement | null>(null)

const triggerLogoUpload = () => logoInput.value?.click()
const onLogoSelect = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    logoFile.value = file
    logoFileName.value = file.name
  }
}


async function loadProfile() {
  loading.value = true
  try {
    const res = await api.getProfile()
    const data = (res as any).data ?? res
    orgName.value = data.org_name || data.name || data.organization_name || ''
    orgEmail.value = data.org_email || data.email || data.contact_email || ''
    orgPhone.value = data.org_phone || data.phone || data.contact_phone || ''
    orgDescription.value = data.description || ''
    orgWebsite.value = data.website || ''
    orgFacebook.value = data.facebook || ''
    orgInstagram.value = data.instagram || ''
    orgTwitter.value = data.twitter || ''
  } catch {
    error('Impossible de charger le profil')
  } finally {
    loading.value = false
  }
}

async function saveProfil() {
  if (!orgName.value.trim()) { error("Le nom de l'organisation est requis"); return }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(orgEmail.value)) { error("Format d'email invalide"); return }
  const phoneRegex = /^\+?\d[\d\s-]{7,}$/
  if (!phoneRegex.test(orgPhone.value)) { error('Format de téléphone invalide'); return }
  if (orgDescription.value.length > 200) { error('La description ne doit pas dépasser 200 caractères'); return }
  saving.value = true
  try {
    const formData = new FormData()
    formData.append('org_name', orgName.value)
    formData.append('org_email', orgEmail.value)
    formData.append('org_phone', orgPhone.value || '')
    formData.append('description', orgDescription.value || '')
    formData.append('website', orgWebsite.value || '')
    formData.append('facebook', orgFacebook.value || '')
    formData.append('instagram', orgInstagram.value || '')
    formData.append('twitter', orgTwitter.value || '')
    if (logoFile.value) {
      formData.append('logo', logoFile.value)
    }
    await api.updateProfile(formData)
    success('Profil organisateur mis à jour')
    logoFile.value = null
    logoFileName.value = ''
  } catch (err: any) {
    error(err?.message || err?.data?.message || 'Erreur lors de la sauvegarde')
  } finally {
    saving.value = false
  }
}

onMounted(() => { loadProfile() })
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-xl font-semibold text-text-primary">Profil organisateur</h1>
      <p class="text-sm text-text-tertiary mt-1">Informations visibles sur vos événements publics</p>
    </div>

    <!-- Avatar -->
    <div class="flex items-center gap-4 mb-8">
      <div class="w-14 h-14 rounded-full bg-orange-primary text-white text-lg font-semibold flex items-center justify-center shrink-0">
        {{ orgName.charAt(0).toUpperCase() || '?' }}
      </div>
      <div>
        <input ref="logoInput" type="file" accept="image/*" class="hidden" @change="onLogoSelect" />
        <UiBaseButton variant="secondary" size="sm" @click="triggerLogoUpload">
          Changer le logo
        </UiBaseButton>
        <p v-if="logoFileName" class="text-xs text-text-tertiary mt-1.5">{{ logoFileName }}</p>
        <p v-else class="text-xs text-text-tertiary mt-1.5">JPG, PNG. Max 2 Mo</p>
      </div>
    </div>

    <form @submit.prevent="saveProfil">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
        <UiBaseInput
          :model-value="orgName"
          label="Nom de l'organisation"
          required
          @update:model-value="orgName = String($event)"
        />
        <UiBaseInput
          :model-value="orgEmail"
          label="Email de contact"
          type="email"
          required
          @update:model-value="orgEmail = String($event)"
        />
        <UiBaseInput
          :model-value="orgPhone"
          label="Téléphone"
          type="tel"
          required
          @update:model-value="orgPhone = String($event)"
        />
        <UiBaseInput
          :model-value="orgWebsite"
          label="Site web"
          type="url"
          placeholder="https://exemple.com"
          hint="Optionnel"
          @update:model-value="orgWebsite = String($event)"
        />
        <div class="md:col-span-2">
          <UiBaseTextarea
            :model-value="orgDescription"
            label="Description courte"
            :maxlength="200"
            :rows="3"
            placeholder="Décrivez votre organisation en quelques mots..."
            @update:model-value="orgDescription = $event"
          />
        </div>
      </div>

      <!-- Réseaux sociaux -->
      <hr class="border-border-light my-8" />
      <p class="text-xs text-text-tertiary uppercase tracking-wide mb-4">Réseaux sociaux (optionnel)</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
        <UiBaseInput
          :model-value="orgFacebook"
          label="Facebook"
          type="url"
          placeholder="https://facebook.com/votre-page"
          @update:model-value="orgFacebook = String($event)"
        />
        <UiBaseInput
          :model-value="orgInstagram"
          label="Instagram"
          type="url"
          placeholder="https://instagram.com/votre-compte"
          @update:model-value="orgInstagram = String($event)"
        />
        <UiBaseInput
          :model-value="orgTwitter"
          label="Twitter / X"
          type="url"
          placeholder="https://x.com/votre-compte"
          @update:model-value="orgTwitter = String($event)"
        />
      </div>

      <div class="mt-8 flex justify-end">
        <UiBaseButton type="submit" variant="primary" :loading="saving">
          Enregistrer
        </UiBaseButton>
      </div>
    </form>
  </div>
</template>
