<template>
  <div>
    <NuxtLink
      to="/dashboard/events"
      class="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-orange-primary transition-colors mb-6"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
      Retour aux événements
    </NuxtLink>

    <nav class="flex items-center gap-2 text-sm text-text-tertiary mb-6">
      <NuxtLink to="/dashboard" class="hover:text-orange-primary transition-colors">Dashboard</NuxtLink>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 18 15 12 9 6"/></svg>
      <NuxtLink to="/dashboard/events" class="hover:text-orange-primary transition-colors">Mes événements</NuxtLink>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 18 15 12 9 6"/></svg>
      <span class="text-text-secondary font-medium">{{ eventName }}</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="9 18 15 12 9 6"/></svg>
      <span class="text-orange-primary font-semibold">Validateurs</span>
    </nav>

    <div class="bg-surface rounded-xl p-8 mb-6">
      <div class="flex items-center gap-2 mb-2">
        <h2 class="font-serif text-xl text-text-primary">Partager les accès</h2>
        <div class="relative group">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-orange-primary cursor-help"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-blue-main text-white text-xs rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-10">
            Les validateurs pourront scanner les billets des participants le jour de l'événement
          </div>
        </div>
      </div>
      <p class="text-text-secondary text-sm mb-5">
        Envoyez rapidement le lien et le code d'accès à <span class="font-bold">vos validateurs</span>
      </p>
      <div class="flex flex-wrap gap-3">
        <button
          class="bg-[#25D366] text-white rounded-full px-6 py-2.5 text-sm font-semibold cursor-pointer transition-all duration-150 hover:opacity-90 flex items-center gap-2"
          @click="shareWhatsApp"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </button>
        <button
          class="bg-red-error text-white rounded-full px-6 py-2.5 text-sm font-semibold cursor-pointer transition-all duration-150 hover:opacity-90 flex items-center gap-2"
          @click="shareEmail"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          Email
        </button>
        <button
          class="bg-blue-main text-white rounded-full px-6 py-2.5 text-sm font-semibold cursor-pointer transition-all duration-150 hover:opacity-90 flex items-center gap-2"
          @click="copyFullMessage"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copier le message
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div class="bg-surface rounded-xl p-6">
        <h3 class="font-semibold text-text-primary mb-3">Lien de validation</h3>
        <div class="flex gap-2">
          <input
            type="text"
            readonly
            :value="validationLink"
            class="flex-1 bg-surface-2 border border-border-light rounded-lg px-4 py-2.5 text-sm text-text-primary font-sans min-w-0"
          />
          <button
            class="text-orange-primary border border-orange-primary rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer transition-all duration-150 hover:bg-orange-dim shrink-0"
            @click="copyLink"
          >Copier</button>
        </div>
        <div class="flex items-center gap-1.5 mt-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-orange-primary shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span class="text-text-tertiary text-sm">Partagez ce lien avec vos validateurs</span>
        </div>
      </div>

      <div class="bg-surface rounded-xl p-6">
        <h3 class="font-semibold text-text-primary mb-3">Code d'accès</h3>
        <div class="flex gap-2">
          <input
            type="text"
            readonly
            :value="accessCode"
            class="flex-1 bg-surface-2 border border-border-light rounded-lg px-4 py-2.5 font-mono font-bold text-lg text-center text-text-primary min-w-0"
          />
          <button
            class="text-orange-primary border border-orange-primary rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer transition-all duration-150 hover:bg-orange-dim shrink-0"
            @click="copyCode"
          >Copier</button>
        </div>
        <div class="flex items-center gap-1.5 mt-3">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-orange-primary shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
          <span class="text-text-tertiary text-sm">Code requis pour accéder à la validation</span>
        </div>
      </div>
    </div>

    <div class="bg-surface border border-border-light rounded-xl p-6">
      <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
        <h3 class="font-serif text-xl text-text-primary">Statistiques de validation</h3>
        <button
          class="text-orange-primary text-sm font-semibold cursor-pointer transition-all duration-150 hover:opacity-80 flex items-center gap-1.5"
          @click="regenModalOpen = true"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Régénérer le code
        </button>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div class="border border-border-light rounded-xl p-4">
          <p class="text-sm text-text-secondary mb-1">Billets scannés</p>
          <p class="text-2xl font-bold text-text-primary">{{ scanStats.scanned }}</p>
        </div>
        <div class="border border-border-light rounded-xl p-4">
          <p class="text-sm text-text-secondary mb-1">Valides</p>
          <p class="text-2xl font-bold text-green-dark">{{ scanStats.valid }}</p>
        </div>
        <div class="border border-border-light rounded-xl p-4">
          <p class="text-sm text-text-secondary mb-1">Invalides</p>
          <p class="text-2xl font-bold text-red-error">{{ scanStats.invalid }}</p>
        </div>
        <div class="border border-border-light rounded-xl p-4">
          <p class="text-sm text-text-secondary mb-1">Doublons détectés</p>
          <p class="text-2xl font-bold text-orange-primary">{{ scanStats.duplicates }}</p>
        </div>
      </div>

      <h4 class="text-sm font-semibold text-text-primary mb-3">Historique récent</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-border-light">
              <th class="text-left text-xs font-bold text-text-tertiary uppercase tracking-wider pb-3">Heure</th>
              <th class="text-left text-xs font-bold text-text-tertiary uppercase tracking-wider pb-3">N° Billet</th>
              <th class="text-left text-xs font-bold text-text-tertiary uppercase tracking-wider pb-3">Type</th>
              <th class="text-left text-xs font-bold text-text-tertiary uppercase tracking-wider pb-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="scan in recentScans" :key="scan.ticket" class="border-b border-border-light last:border-b-0">
              <td class="py-3 text-text-secondary">{{ scan.time }}</td>
              <td class="py-3 font-mono text-text-primary">{{ scan.ticket }}</td>
              <td class="py-3 text-text-secondary">{{ scan.type }}</td>
              <td class="py-3">
                <span
                  class="text-xs font-semibold"
                  :class="{
                    'text-green-dark': scan.status === 'valid',
                    'text-red-error': scan.status === 'invalid',
                    'text-orange-primary': scan.status === 'duplicate'
                  }"
                >{{ scanStatusLabel(scan.status) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <UiConfirmModal
      :is-open="regenModalOpen"
      title="Régénérer le code d'accès"
      message="Cela invalidera l'ancien code. Tous les validateurs devront utiliser le nouveau code pour se connecter."
      confirm-text="Régénérer"
      cancel-text="Annuler"
      variant="warning"
      @confirm="confirmRegen"
      @cancel="regenModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const route = useRoute()
const api = useOrganizerApi()
const { success, error: notifyError } = useNotification()

const eventId = route.params.id as string
const loading = ref(true)
const actionLoading = ref(false)
const eventName = ref('')
const accessCode = ref('')
const validationLink = computed(() => `https://billetevent.com/validator/login/EVT-${eventId}`)
const regenModalOpen = ref(false)

const scanStats = ref({ scanned: 0, valid: 0, invalid: 0, duplicates: 0 })
const recentScans = ref<any[]>([])

const scanStatusLabel = (status: string) => {
  const labels: Record<string, string> = { valid: 'Valide', invalid: 'Invalide', duplicate: 'Doublon' }
  return labels[status] || status
}

const shareMessage = computed(() =>
  `🎟️ BilletEvent - Accès Validateur\n\nÉvénement : ${eventName.value}\nLien : ${validationLink.value}\nCode d'accès : ${accessCode.value}\n\nUtilisez ce lien et ce code pour valider les billets le jour de l'événement.`
)

const shareWhatsApp = () => {
  window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage.value)}`, '_blank')
}

const shareEmail = () => {
  const subject = encodeURIComponent(`Accès validateur - ${eventName.value}`)
  const body = encodeURIComponent(shareMessage.value)
  window.open(`mailto:?subject=${subject}&body=${body}`)
}

const copyFullMessage = async () => {
  await navigator.clipboard.writeText(shareMessage.value)
  success('Message copié !')
}

const copyLink = async () => {
  await navigator.clipboard.writeText(validationLink.value)
  success('Lien copié !')
}

const copyCode = async () => {
  await navigator.clipboard.writeText(accessCode.value)
  success('Code copié !')
}

const loadValidatorData = async () => {
  loading.value = true
  try {
    const res = await api.getValidatorSessions(eventId) as any
    const data = res?.data ?? res
    eventName.value = data?.event_name || data?.event?.title || ''
    accessCode.value = data?.access_code || data?.code || ''
    scanStats.value = {
      scanned: data?.stats?.scanned ?? data?.scanned ?? 0,
      valid: data?.stats?.valid ?? data?.valid ?? 0,
      invalid: data?.stats?.invalid ?? data?.invalid ?? 0,
      duplicates: data?.stats?.duplicates ?? data?.duplicates ?? 0,
    }
    recentScans.value = (data?.recent_scans || data?.scans || []).map((s: any) => ({
      time: s.time || s.scanned_at || '',
      ticket: s.ticket_number || s.ticket || '',
      type: s.pass_type || s.type || '',
      status: s.status || 'valid',
    }))
  } catch {
    notifyError('Impossible de charger les données validateur')
  } finally {
    loading.value = false
  }
}

const confirmRegen = async () => {
  actionLoading.value = true
  try {
    const res = await api.updateValidatorSession(eventId, '', {}) as any
    const data = res?.data ?? res
    accessCode.value = data?.access_code || data?.code || accessCode.value
    success('Code d\'accès régénéré avec succès')
  } catch {
    notifyError('Impossible de régénérer le code')
  } finally {
    actionLoading.value = false
    regenModalOpen.value = false
  }
}

onMounted(() => loadValidatorData())
</script>
