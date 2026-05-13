<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const api = useOrganizerApi()
const { success, error } = useNotification()
const authStore = useAuthStore()

const loading = ref(false)
const identityEditing = ref(false)
const identityLoading = ref(false)
const docLoading = ref(false)
const firstName = ref('')
const lastName = ref('')
const birthDate = ref('')
const userEmail = ref('')
const identityValidatedByBackend = ref(false)

// Verification type: 'personal' or 'business'
const verificationType = ref('')

// Personal document fields
const activeDocType = ref('cni')
const rectoInput = ref(null)
const versoInput = ref(null)
const selfieInput = ref(null)
const rectoFile = ref(null)
const versoFile = ref(null)
const selfieFile = ref(null)
const rectoPreview = ref(null)
const versoPreview = ref(null)
const selfiePreview = ref(null)

// Business document fields
const businessDocType = ref('ninea')
const businessInput = ref(null)
const businessFile = ref(null)
const businessPreview = ref(null)

const docSubmitted = ref(false)
const docStatus = ref('pending')
const rejectionReason = ref('')

function formatSize(bytes: number) {
  if (bytes < 1024) return bytes + ' o'
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' Ko'
  return (bytes / 1048576).toFixed(1) + ' Mo'
}

function mapKycData(data: any) {
  const kyc = data.kyc || data
  if (kyc.identity_first_name) firstName.value = kyc.identity_first_name
  if (kyc.identity_last_name) lastName.value = kyc.identity_last_name
  if (kyc.identity_birth_date) birthDate.value = kyc.identity_birth_date
  userEmail.value = authStore.user?.email || ''
  if (kyc.verification_type) verificationType.value = kyc.verification_type
  if (kyc.document_type) activeDocType.value = kyc.document_type
  if (kyc.business_document_type) businessDocType.value = kyc.business_document_type

  if (kyc.steps && Array.isArray(kyc.steps)) {
    const step1 = kyc.steps.find((s: any) => s.step === 1)
    if (step1 && step1.status === 'validated') {
      identityValidatedByBackend.value = true
    }
  }

  // Priorite au statut global KYC pour les etats terminaux
  const overallStatus = typeof kyc.status === 'string' ? kyc.status : kyc.status?.value || ''
  if (overallStatus === 'validated') {
    docStatus.value = 'approved'
  } else if (overallStatus === 'rejected') {
    docStatus.value = 'rejected'
    rejectionReason.value = kyc.rejection_reason || ''
    // Completer avec la raison de l'etape 4 si disponible
    if (!rejectionReason.value && kyc.steps && Array.isArray(kyc.steps)) {
      const step4 = kyc.steps.find((s: any) => s.step === 4)
      if (step4?.rejection_reason) rejectionReason.value = step4.rejection_reason
    }
  } else if (kyc.steps && Array.isArray(kyc.steps)) {
    const step4 = kyc.steps.find((s: any) => s.step === 4)
    if (step4) {
      if (step4.status === 'validated') docStatus.value = 'approved'
      else if (step4.status === 'rejected') {
        docStatus.value = 'rejected'
        rejectionReason.value = step4.rejection_reason || kyc.rejection_reason || ''
      }
      else if (step4.status === 'pending' && kyc.verification_type) docStatus.value = 'submitted'
      else docStatus.value = 'pending'
    }
  } else {
    if (overallStatus === 'submitted') docStatus.value = 'submitted'
    else docStatus.value = 'pending'
  }

  docSubmitted.value = docStatus.value === 'submitted' || docStatus.value === 'approved' || docStatus.value === 'rejected'
}

async function loadKyc() {
  loading.value = true
  try {
    const res = await api.getKyc()
    const data = res.data ?? res
    mapKycData(data)
  } catch {
    useNotification().error('Impossible de charger les données KYC')
  } finally {
    loading.value = false
  }
}

function handleFile(e: Event, target: string) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const allowedImages = ['image/jpeg', 'image/png', 'image/webp']
  const allowed = target === 'selfie' ? allowedImages : [...allowedImages, 'application/pdf']
  if (!allowed.includes(file.type)) {
    error(target === 'selfie' ? 'Format non accepté. Utilisez JPG, PNG ou WebP.' : 'Format non accepté. Utilisez JPG, PNG, WebP ou PDF.')
    ;(e.target as HTMLInputElement).value = ''
    return
  }
  if (file.size > 5 * 1024 * 1024) { error('Le fichier dépasse la limite de 5 Mo'); (e.target as HTMLInputElement).value = ''; return }

  const setPreview = (previewRef: any) => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (ev: any) => { previewRef.value = ev.target.result }
      reader.readAsDataURL(file)
    } else { previewRef.value = null }
  }

  if (target === 'recto') { rectoFile.value = file; setPreview(rectoPreview) }
  else if (target === 'verso') { versoFile.value = file; setPreview(versoPreview) }
  else if (target === 'selfie') { selfieFile.value = file; setPreview(selfiePreview) }
  else if (target === 'business') { businessFile.value = file; setPreview(businessPreview) }
}

function removeFile(target: string) {
  if (target === 'recto') { rectoFile.value = null; rectoPreview.value = null; if (rectoInput.value) (rectoInput.value as any).value = '' }
  else if (target === 'verso') { versoFile.value = null; versoPreview.value = null; if (versoInput.value) (versoInput.value as any).value = '' }
  else if (target === 'selfie') { selfieFile.value = null; selfiePreview.value = null; if (selfieInput.value) (selfieInput.value as any).value = '' }
  else if (target === 'business') { businessFile.value = null; businessPreview.value = null; if (businessInput.value) (businessInput.value as any).value = '' }
}

async function submitDocument() {
  const formData = new FormData()
  formData.append('verification_type', verificationType.value)

  if (verificationType.value === 'personal') {
    if (!rectoFile.value) { error('Veuillez uploader le recto de votre pièce d\'identité'); return }
    if (!selfieFile.value) { error('Veuillez uploader votre photo selfie de vérification'); return }
    formData.append('document_type', activeDocType.value)
    formData.append('document_recto', rectoFile.value)
    if (versoFile.value) formData.append('document_verso', versoFile.value)
    formData.append('selfie', selfieFile.value)
  } else {
    if (!businessFile.value) { error('Veuillez uploader votre justificatif d\'activité'); return }
    formData.append('business_document_type', businessDocType.value)
    formData.append('business_document', businessFile.value)
  }

  docLoading.value = true
  try {
    await api.submitDocument(formData)
    docStatus.value = 'submitted'
    docSubmitted.value = true
    success('Documents soumis pour vérification')
  } catch (err: any) {
    error(err?.message || err?.data?.message || 'Erreur lors de la soumission')
  } finally {
    docLoading.value = false
  }
}

async function resubmitDocument() {
  docLoading.value = true
  try {
    await api.resubmitKyc()
    docStatus.value = 'pending'
    docSubmitted.value = false
    verificationType.value = ''
    rectoFile.value = null; versoFile.value = null; selfieFile.value = null; businessFile.value = null
    rectoPreview.value = null; versoPreview.value = null; selfiePreview.value = null; businessPreview.value = null
  } catch (err: any) {
    error(err?.message || err?.data?.message || 'Erreur lors de la resoumission')
  } finally {
    docLoading.value = false
  }
}

async function saveIdentity() {
  identityLoading.value = true
  try {
    const res = await api.submitIdentity({
      identity_first_name: firstName.value,
      identity_last_name: lastName.value,
      identity_birth_date: birthDate.value,
    })
    const data = res.data ?? res
    if (data.kyc || data) mapKycData(data)
    identityValidatedByBackend.value = true
    identityEditing.value = false
    success('Identité mise à jour')
  } catch (err: any) {
    error(err?.message || err?.data?.message || 'Erreur lors de la mise à jour')
  } finally {
    identityLoading.value = false
  }
}

const identityComplete = computed(() => {
  if (identityValidatedByBackend.value) return true
  return !!(firstName.value && lastName.value && birthDate.value)
})
const formattedBirthDate = computed(() => {
  if (!birthDate.value) return ''
  const d = new Date(birthDate.value)
  if (isNaN(d.getTime())) return birthDate.value
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
})

const completedSteps = computed(() => {
  let count = 0
  if (identityComplete.value) count++
  if (userEmail.value) count++
  if (verificationType.value) count++
  if (docSubmitted.value) count++
  return count
})

const progressPercent = computed(() => Math.round((completedSteps.value / 4) * 100))

const canSubmitDocs = computed(() => {
  if (verificationType.value === 'personal') return !!(rectoFile.value && selfieFile.value)
  if (verificationType.value === 'business') return !!businessFile.value
  return false
})

onMounted(() => { loadKyc() })
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <!-- Header -->
    <UiPageHeader title="Vérification KYC" subtitle="Complétez votre vérification d'identité pour activer les retraits" />

    <!-- Progress bar -->
    <div class="flex items-center gap-3 mb-8">
      <div class="flex-1 h-2 bg-surface-2 rounded-full overflow-hidden">
        <div class="h-full bg-green-dark rounded-full transition-all duration-500" :style="{ width: progressPercent + '%' }" />
      </div>
      <span class="text-xs font-semibold text-text-secondary whitespace-nowrap tabular-nums">{{ completedSteps }}/4</span>
    </div>

    <!-- Stepper vertical -->
    <div class="space-y-0">

      <!-- ═══ Étape 1 — Identité personnelle ═══ -->
      <div class="relative pl-9 pb-10">
        <div class="absolute left-[11px] top-7 bottom-0 w-px bg-border-light" />
        <div class="absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          :class="identityComplete ? 'bg-green-dim text-green-dark' : 'bg-orange-dim text-orange-primary'">
          <svg v-if="identityComplete" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span v-else>1</span>
        </div>
        <div class="flex items-start justify-between gap-3 mb-1.5">
          <div class="text-sm font-semibold text-text-primary">Identité personnelle</div>
          <UiStatusBadge v-if="identityComplete" variant="success" label="Validé" size="sm" />
          <UiStatusBadge v-else variant="warning" label="À compléter" size="sm" />
        </div>

        <div v-if="identityComplete && !identityEditing">
          <p class="text-xs text-text-secondary mb-1.5">{{ firstName }} {{ lastName }}{{ formattedBirthDate ? ' · ' + formattedBirthDate : '' }}</p>
          <button class="text-xs text-orange-primary font-medium hover:underline cursor-pointer bg-transparent border-none p-0" @click="identityEditing = true">Modifier</button>
        </div>

        <div v-if="!identityComplete || identityEditing" class="mt-3 bg-surface border border-border-light rounded-xl p-5">
          <div class="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
            <div>
              <label class="block text-xs font-medium text-text-secondary mb-1.5">Prénom</label>
              <input v-model="firstName" type="text" placeholder="Prénom"
                class="w-full px-3 py-2.5 rounded-lg border border-border-light text-text-primary text-sm bg-bg-primary focus:outline-none focus:ring-1 focus:ring-orange-primary/40 focus:border-orange-primary transition" />
            </div>
            <div>
              <label class="block text-xs font-medium text-text-secondary mb-1.5">Nom</label>
              <input v-model="lastName" type="text" placeholder="Nom"
                class="w-full px-3 py-2.5 rounded-lg border border-border-light text-text-primary text-sm bg-bg-primary focus:outline-none focus:ring-1 focus:ring-orange-primary/40 focus:border-orange-primary transition" />
            </div>
          </div>
          <div class="mt-4">
            <label class="block text-xs font-medium text-text-secondary mb-1.5">Date de naissance</label>
            <input v-model="birthDate" type="date"
              class="w-full px-3 py-2.5 rounded-lg border border-border-light text-text-primary text-sm bg-bg-primary focus:outline-none focus:ring-1 focus:ring-orange-primary/40 focus:border-orange-primary transition" />
          </div>
          <div class="flex justify-end mt-4 gap-2">
            <button v-if="identityEditing && identityComplete"
              class="px-4 py-2 rounded-lg text-xs font-semibold text-text-secondary bg-transparent border border-border-light cursor-pointer hover:border-border-medium transition-colors"
              @click="identityEditing = false">Annuler</button>
            <button
              class="px-5 py-2 rounded-lg text-xs font-semibold text-white bg-orange-primary border-none cursor-pointer hover:bg-orange-light transition-colors"
              :disabled="identityLoading"
              @click="saveIdentity">
              {{ identityLoading ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ═══ Étape 2 — Email du compte ═══ -->
      <div class="relative pl-9 pb-10">
        <div class="absolute left-[11px] top-7 bottom-0 w-px bg-border-light" />
        <div class="absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          :class="userEmail ? 'bg-green-dim text-green-dark' : 'bg-surface-2 text-text-tertiary'">
          <svg v-if="userEmail" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span v-else>2</span>
        </div>
        <div class="flex items-start justify-between gap-3 mb-1.5">
          <div class="text-sm font-semibold text-text-primary">Email du compte</div>
          <UiStatusBadge v-if="userEmail" variant="success" label="Validé" size="sm" />
        </div>
        <p class="text-xs text-text-secondary">{{ userEmail }}</p>
        <p class="text-[11px] text-text-tertiary mt-1">
          Lié à votre compte.
          <NuxtLink to="/account" class="text-orange-primary font-medium hover:underline">Modifier dans les paramètres</NuxtLink>
        </p>
      </div>

      <!-- ═══ Étape 3 — Type de vérification ═══ -->
      <div class="relative pl-9 pb-10">
        <div class="absolute left-[11px] top-7 bottom-0 w-px bg-border-light" />
        <div class="absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          :class="{
            'bg-green-dim text-green-dark': verificationType,
            'bg-orange-dim text-orange-primary': !verificationType
          }">
          <svg v-if="verificationType" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <span v-else>3</span>
        </div>
        <div class="flex items-start justify-between gap-3 mb-1.5">
          <div class="text-sm font-semibold text-text-primary">Type de vérification</div>
          <UiStatusBadge v-if="verificationType" variant="success" :label="verificationType === 'personal' ? 'Personnel' : 'Entreprise'" size="sm" />
          <UiStatusBadge v-else variant="warning" label="À choisir" size="sm" />
        </div>

        <!-- Choice disabled if already submitted -->
        <div v-if="docSubmitted && verificationType" class="mt-1">
          <p class="text-xs text-text-secondary">
            Mode sélectionné : <strong>{{ verificationType === 'personal' ? 'Vérification personnelle' : 'Vérification entreprise' }}</strong>
          </p>
        </div>

        <!-- Cards to choose -->
        <div v-else class="mt-3 grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <!-- Personal -->
          <div
            class="relative border rounded-xl p-5 cursor-pointer transition-all duration-200"
            :class="verificationType === 'personal'
              ? 'border-orange-primary bg-orange-dim/60 ring-1 ring-orange-primary/30'
              : 'border-border-light hover:border-orange-primary/40 hover:bg-surface'"
            @click="verificationType = 'personal'">
            <div class="w-9 h-9 rounded-lg bg-blue-dim flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-main"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
            <div class="text-sm font-semibold text-text-primary mb-1">Vérification personnelle</div>
            <p class="text-[11px] text-text-secondary leading-relaxed">Fournissez votre pièce d'identité et un selfie de vérification.</p>
            <div v-if="verificationType === 'personal'" class="absolute top-3 right-3">
              <div class="w-5 h-5 rounded-full bg-orange-primary flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
          </div>

          <!-- Business -->
          <div
            class="relative border rounded-xl p-5 cursor-pointer transition-all duration-200"
            :class="verificationType === 'business'
              ? 'border-orange-primary bg-orange-dim/60 ring-1 ring-orange-primary/30'
              : 'border-border-light hover:border-orange-primary/40 hover:bg-surface'"
            @click="verificationType = 'business'">
            <div class="w-9 h-9 rounded-lg bg-orange-dim flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-orange-primary"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <div class="text-sm font-semibold text-text-primary mb-1">Vérification entreprise</div>
            <p class="text-[11px] text-text-secondary leading-relaxed">Fournissez un justificatif d'activité de votre entreprise.</p>
            <div v-if="verificationType === 'business'" class="absolute top-3 right-3">
              <div class="w-5 h-5 rounded-full bg-orange-primary flex items-center justify-center">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ═══ Étape 4 — Documents ═══ -->
      <div class="relative pl-9 pb-2">
        <div class="absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          :class="{
            'bg-green-dim text-green-dark': docStatus === 'approved',
            'bg-red-dim text-red-error': docStatus === 'rejected',
            'bg-orange-primary text-white': docStatus === 'pending' && verificationType,
            'bg-surface-2 text-text-tertiary': !verificationType
          }">
          <svg v-if="docStatus === 'approved'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          <svg v-else-if="docStatus === 'rejected'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          <svg v-else-if="!verificationType" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span v-else>4</span>
        </div>

        <div class="flex items-start justify-between gap-3 mb-1.5" :class="!verificationType ? 'opacity-50' : ''">
          <div class="text-sm font-semibold text-text-primary">Documents</div>
          <UiStatusBadge v-if="docStatus === 'approved'" variant="success" label="Validé" size="sm" />
          <UiStatusBadge v-else-if="docStatus === 'submitted'" variant="info" label="En vérification" size="sm" />
          <UiStatusBadge v-else-if="docStatus === 'rejected'" variant="error" label="Refusé" size="sm" />
          <UiStatusBadge v-else-if="!verificationType" variant="neutral" label="Verrouillé" size="sm" />
          <UiStatusBadge v-else variant="warning" label="En attente" size="sm" />
        </div>

        <!-- Locked state -->
        <div v-if="!verificationType" class="opacity-50">
          <p class="text-xs text-text-tertiary">Choisissez d'abord un type de vérification à l'étape précédente.</p>
        </div>

        <!-- Submitted — waiting for review -->
        <div v-else-if="docStatus === 'submitted'" class="mt-3">
          <div class="flex items-center gap-3 p-4 rounded-xl bg-blue-dim border border-blue-main/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-main shrink-0"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <p class="text-xs text-text-secondary leading-relaxed">Vos documents sont en cours de vérification. Délai estimé : 24-48h.</p>
          </div>
        </div>

        <!-- Rejected -->
        <div v-else-if="docStatus === 'rejected'" class="mt-3">
          <div class="p-4 rounded-xl bg-red-dim border border-red-error/15">
            <p class="text-xs text-red-error font-semibold mb-1">Documents refusés</p>
            <p class="text-xs text-text-secondary mb-3">{{ rejectionReason }}</p>
            <button
              class="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-red-error border-none cursor-pointer hover:opacity-90 transition-opacity"
              :disabled="docLoading"
              @click="resubmitDocument">Resoumettre</button>
          </div>
        </div>

        <!-- Approved -->
        <div v-else-if="docStatus === 'approved'" class="mt-3">
          <div class="flex items-center gap-3 p-4 rounded-xl bg-green-dim border border-green-dark/20">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-green-dark shrink-0"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <p class="text-xs text-text-secondary">Votre vérification est validée.</p>
          </div>
        </div>

        <!-- ══ Personal upload form ══ -->
        <div v-else-if="verificationType === 'personal'" class="mt-4 bg-surface border border-border-light rounded-xl p-5">
          <input ref="rectoInput" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" class="hidden" @change="handleFile($event, 'recto')" />
          <input ref="versoInput" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" class="hidden" @change="handleFile($event, 'verso')" />
          <input ref="selfieInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="handleFile($event, 'selfie')" />

          <!-- Document type dropdown -->
          <div class="mb-5">
            <label class="block text-xs font-medium text-text-secondary mb-1.5">Type de pièce d'identité</label>
            <select v-model="activeDocType"
              class="w-full max-w-[280px] px-3 py-2.5 rounded-lg border border-border-light text-text-primary text-sm bg-bg-primary focus:outline-none focus:ring-1 focus:ring-orange-primary/40 focus:border-orange-primary transition appearance-none cursor-pointer"
              style="background-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%234A5A8A%22 stroke-width=%222%22><polyline points=%226 9 12 15 18 9%22/></svg>'); background-repeat: no-repeat; background-position: right 10px center;">
              <option value="cni">Carte Nationale d'Identité (CNI)</option>
              <option value="passeport">Passeport</option>
              <option value="sejour">Carte de séjour</option>
              <option value="permis">Permis de conduire</option>
            </select>
          </div>

          <!-- Recto / Verso -->
          <div class="grid grid-cols-2 gap-4 mb-5 max-sm:grid-cols-1">
            <!-- Recto -->
            <div v-if="!rectoFile"
              class="border-2 border-dashed border-border-light rounded-xl p-6 text-center cursor-pointer transition-all hover:border-orange-primary/50 hover:bg-orange-dim/30 group"
              @click="rectoInput?.click()">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2 text-text-tertiary group-hover:text-orange-primary transition-colors"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <div class="text-xs font-semibold text-text-primary mb-0.5">Recto</div>
              <div class="text-[11px] text-text-tertiary">Glissez ou cliquez pour ajouter</div>
              <div class="text-[10px] text-text-tertiary mt-1">JPG, PNG ou PDF · max 5 Mo</div>
            </div>
            <div v-else class="border border-orange-primary/40 rounded-xl p-4 bg-orange-dim/30 relative">
              <button class="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-surface flex items-center justify-center text-text-tertiary hover:text-red-error transition-colors cursor-pointer border border-border-light" @click="removeFile('recto')">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <div class="text-[11px] font-semibold text-orange-primary mb-2">Recto</div>
              <img v-if="rectoPreview" :src="rectoPreview" class="w-full h-24 object-cover rounded-lg mb-2" />
              <div class="text-xs text-text-primary truncate">{{ (rectoFile as any).name }}</div>
              <div class="text-[11px] text-text-tertiary">{{ formatSize((rectoFile as any).size) }}</div>
            </div>

            <!-- Verso -->
            <div v-if="!versoFile"
              class="border-2 border-dashed border-border-light rounded-xl p-6 text-center cursor-pointer transition-all hover:border-orange-primary/50 hover:bg-orange-dim/30 group"
              @click="versoInput?.click()">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2 text-text-tertiary group-hover:text-orange-primary transition-colors"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <div class="text-xs font-semibold text-text-primary mb-0.5">Verso</div>
              <div class="text-[11px] text-text-tertiary">Glissez ou cliquez pour ajouter</div>
              <div class="text-[10px] text-text-tertiary mt-1">JPG, PNG ou PDF · max 5 Mo</div>
            </div>
            <div v-else class="border border-orange-primary/40 rounded-xl p-4 bg-orange-dim/30 relative">
              <button class="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-surface flex items-center justify-center text-text-tertiary hover:text-red-error transition-colors cursor-pointer border border-border-light" @click="removeFile('verso')">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <div class="text-[11px] font-semibold text-orange-primary mb-2">Verso</div>
              <img v-if="versoPreview" :src="versoPreview" class="w-full h-24 object-cover rounded-lg mb-2" />
              <div class="text-xs text-text-primary truncate">{{ (versoFile as any).name }}</div>
              <div class="text-[11px] text-text-tertiary">{{ formatSize((versoFile as any).size) }}</div>
            </div>
          </div>

          <!-- Selfie upload -->
          <div class="mb-5">
            <label class="block text-xs font-medium text-text-secondary mb-2">Photo selfie de vérification <span class="text-red-error">*</span></label>
            <p class="text-[11px] text-text-tertiary mb-3">Prenez une photo de vous en tenant votre pièce d'identité visible à côté de votre visage.</p>
            <div v-if="!selfieFile"
              class="border-2 border-dashed border-border-light rounded-xl p-6 text-center cursor-pointer transition-all hover:border-blue-main/50 hover:bg-blue-dim/30 group"
              @click="selfieInput?.click()">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2 text-text-tertiary group-hover:text-blue-main transition-colors"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <div class="text-xs font-semibold text-text-primary mb-0.5">Selfie de vérification</div>
              <div class="text-[11px] text-text-tertiary">Photo de vous tenant votre pièce d'identité</div>
              <div class="text-[10px] text-text-tertiary mt-1">JPG, PNG ou WebP · max 5 Mo</div>
            </div>
            <div v-else class="border border-blue-main/40 rounded-xl p-4 bg-blue-dim/30 relative">
              <button class="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-surface flex items-center justify-center text-text-tertiary hover:text-red-error transition-colors cursor-pointer border border-border-light" @click="removeFile('selfie')">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <div class="text-[11px] font-semibold text-blue-main mb-2">Selfie de vérification</div>
              <img v-if="selfiePreview" :src="selfiePreview" class="w-full h-32 object-cover rounded-lg mb-2" />
              <div class="text-xs text-text-primary truncate">{{ (selfieFile as any).name }}</div>
              <div class="text-[11px] text-text-tertiary">{{ formatSize((selfieFile as any).size) }}</div>
            </div>
          </div>

          <!-- Submit button -->
          <div class="flex justify-end">
            <button
              class="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-orange-primary border-none cursor-pointer hover:bg-orange-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="docLoading || !canSubmitDocs"
              @click="submitDocument">
              {{ docLoading ? 'Envoi en cours...' : 'Soumettre les documents' }}
            </button>
          </div>
        </div>

        <!-- ══ Business upload form ══ -->
        <div v-else-if="verificationType === 'business'" class="mt-4 bg-surface border border-border-light rounded-xl p-5">
          <input ref="businessInput" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" class="hidden" @change="handleFile($event, 'business')" />

          <!-- Business document type -->
          <div class="mb-5">
            <label class="block text-xs font-medium text-text-secondary mb-1.5">Type de justificatif</label>
            <select v-model="businessDocType"
              class="w-full max-w-[280px] px-3 py-2.5 rounded-lg border border-border-light text-text-primary text-sm bg-bg-primary focus:outline-none focus:ring-1 focus:ring-orange-primary/40 focus:border-orange-primary transition appearance-none cursor-pointer"
              style="background-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%234A5A8A%22 stroke-width=%222%22><polyline points=%226 9 12 15 18 9%22/></svg>'); background-repeat: no-repeat; background-position: right 10px center;">
              <option value="ninea">NINEA</option>
              <option value="registre_commerce">Registre de commerce</option>
              <option value="attestation">Attestation officielle</option>
            </select>
          </div>

          <!-- Single upload zone -->
          <div class="mb-5">
            <div v-if="!businessFile"
              class="border-2 border-dashed border-border-light rounded-xl p-8 text-center cursor-pointer transition-all hover:border-orange-primary/50 hover:bg-orange-dim/30 group"
              @click="businessInput?.click()">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2 text-text-tertiary group-hover:text-orange-primary transition-colors"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              <div class="text-xs font-semibold text-text-primary mb-0.5">Justificatif d'activité</div>
              <div class="text-[11px] text-text-tertiary">Glissez ou cliquez pour ajouter votre document</div>
              <div class="text-[10px] text-text-tertiary mt-1">JPG, PNG ou PDF · max 5 Mo</div>
            </div>
            <div v-else class="border border-orange-primary/40 rounded-xl p-4 bg-orange-dim/30 relative">
              <button class="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-surface flex items-center justify-center text-text-tertiary hover:text-red-error transition-colors cursor-pointer border border-border-light" @click="removeFile('business')">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <div class="text-[11px] font-semibold text-orange-primary mb-2">Justificatif</div>
              <img v-if="businessPreview" :src="businessPreview" class="w-full h-28 object-cover rounded-lg mb-2" />
              <div class="text-xs text-text-primary truncate">{{ (businessFile as any).name }}</div>
              <div class="text-[11px] text-text-tertiary">{{ formatSize((businessFile as any).size) }}</div>
            </div>
          </div>

          <!-- Submit button -->
          <div class="flex justify-end">
            <button
              class="px-5 py-2.5 rounded-lg text-sm font-semibold text-white bg-orange-primary border-none cursor-pointer hover:bg-orange-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="docLoading || !canSubmitDocs"
              @click="submitDocument">
              {{ docLoading ? 'Envoi en cours...' : 'Soumettre les documents' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Info bar -->
    <div class="mt-10 flex items-center gap-3 px-4 py-3.5 rounded-xl bg-surface-2 border border-border-light">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-text-tertiary shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
      <p class="text-[11px] text-text-tertiary leading-relaxed">
        Le KYC vous permet d'activer les reversements, de lever les limites de vente, et d'obtenir le badge organisateur vérifié.
        <NuxtLink to="/faq" class="text-orange-primary font-medium hover:underline">En savoir plus</NuxtLink>
      </p>
    </div>
  </div>
</template>
