<template>
  <div class="min-h-screen flex flex-col bg-bg-primary">
    <header class="sticky top-0 z-50 bg-white px-4 py-3 flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <img src="/logo.png" alt="BilletEvent" class="h-8 shrink-0" />
        <span
          :class="[
            'inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-2 py-1 whitespace-nowrap',
            offline.isOnline.value
              ? 'bg-green-dim text-green-dark'
              : 'bg-red-error/10 text-red-error',
          ]"
          :aria-label="offline.isOnline.value ? 'Connecté' : 'Hors ligne'"
        >
          <span :class="['w-1.5 h-1.5 rounded-full', offline.isOnline.value ? 'bg-green-dark' : 'bg-red-error animate-pulse']" />
          {{ offline.isOnline.value ? 'En ligne' : 'Hors ligne' }}
        </span>
        <span
          v-if="offline.queue.value.length > 0"
          class="inline-flex items-center gap-1 text-xs font-medium text-gold bg-gold-dim rounded-full px-2 py-1 whitespace-nowrap"
          :title="`${offline.queue.value.length} scan(s) en attente de synchronisation`"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          {{ offline.queue.value.length }} en attente
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="border border-border-light rounded-lg px-4 py-2 text-sm font-sans cursor-pointer transition-all duration-150 hover:bg-surface-2 flex items-center gap-2 text-text-primary"
          @click="mode = mode === 'scan' ? 'manual' : 'scan'"
        >
          <svg v-if="mode === 'scan'" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          {{ mode === 'scan' ? 'Validation manuelle' : 'Scanner QR' }}
        </button>
        <button
          class="text-red-error border border-red-error rounded-lg px-4 py-2 text-sm font-sans cursor-pointer transition-all duration-150 hover:bg-red-dim"
          @click="handleValidatorLogout"
        >Déconnexion</button>
      </div>
    </header>

    <div class="text-center py-4 px-4">
      <h1 v-if="eventInfo?.name" class="font-semibold text-lg text-blue-main">{{ eventInfo.name }}</h1>
      <h1 v-else class="font-semibold text-lg text-text-tertiary animate-pulse">Chargement...</h1>
      <p class="text-text-secondary text-sm mt-1">{{ eventInfo?.organizer || '' }}</p>
      <span v-if="eventInfo?.remaining_tickets !== undefined" class="bg-green-dim text-green-dark text-sm px-3 py-1 rounded-full inline-block mt-2 font-medium">{{ eventInfo.remaining_tickets }} tickets restants</span>
    </div>

    <div class="flex-1 px-4 pb-20">
      <div v-if="mode === 'scan'">
        <h2 class="text-center text-lg font-semibold text-text-primary mb-4">Scannez QR code</h2>

        <div v-if="!scanResult" class="max-w-[500px] mx-auto">
          <ClientOnly>
            <ValidatorQrScanner :active="cameraActive" @scan="handleCameraScan" @error="handleCameraError" />
          </ClientOnly>
        </div>

        <div v-else class="max-w-[500px] mx-auto rounded-xl p-8 text-center" :class="scanResultConfig.bg">
          <div class="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" :class="scanResultConfig.iconBg">
            <svg v-if="scanResult === 'valid'" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-green-dark"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <svg v-else-if="scanResult === 'invalid'" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-red-error"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <svg v-else width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-gold"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3 class="text-xl font-bold mb-2" :class="scanResultConfig.textColor">{{ scanResultConfig.title }}</h3>
          <div v-if="scanResult === 'valid' && lastScanData" class="space-y-1 text-sm">
            <p class="text-text-primary font-medium">{{ lastScanData.attendee_name }}</p>
            <p class="text-text-secondary">{{ lastScanData.ticket_type }} · {{ lastScanData.reference }}</p>
          </div>
          <div v-else-if="scanResult === 'used' && lastScanData" class="text-sm">
            <p class="text-text-secondary">Premier scan : {{ lastScanData.scanned_at }}</p>
          </div>
        </div>

        <div class="max-w-[500px] mx-auto mt-6">
          <button
            class="w-full flex items-center justify-between px-4 py-3 bg-surface rounded-xl cursor-pointer transition-all duration-150 hover:bg-surface-2"
            @click="settingsOpen = !settingsOpen"
          >
            <span class="text-xs font-bold text-text-tertiary uppercase tracking-wider">Paramètres</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-text-tertiary transition-transform duration-200" :class="settingsOpen ? 'rotate-180' : ''"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div v-if="settingsOpen" class="bg-surface rounded-b-xl px-4 pb-4 -mt-1">
            <p class="text-text-secondary text-sm mb-3">Choisissez de valider uniquement un certain type d'entrée</p>
            <div class="space-y-2.5">
              <label v-for="t in ticketTypes" :key="t.value" class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="t.checked"
                  type="checkbox"
                  class="w-4.5 h-4.5 accent-orange-primary cursor-pointer"
                />
                <span class="text-sm text-text-primary">{{ t.label }}</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <h2 class="text-center text-lg font-semibold text-text-primary mb-4">Validation manuelle</h2>

        <div v-if="!manualResult" class="bg-surface rounded-xl p-6 max-w-[500px] mx-auto">
          <form @submit.prevent="handleManualSearch" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-text-primary mb-1.5">Numéro de ticket</label>
              <input
                v-model="manualForm.ticket"
                type="text"
                placeholder="Ex: BEV-2026-VIP-5745"
                class="w-full border border-border-light rounded-lg px-4 py-3 text-sm font-sans bg-white text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-orange-primary focus:ring-2 focus:ring-orange-primary/20 transition-all"
              />
            </div>
            <button
              type="submit"
              :disabled="searching"
              class="bg-orange-primary text-white w-full py-3 rounded-xl text-lg font-semibold cursor-pointer transition-all duration-150 hover:bg-orange-light disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <svg v-if="searching" class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              {{ searching ? 'Recherche...' : 'Rechercher' }}
            </button>
          </form>
        </div>

        <div v-else class="max-w-[500px] mx-auto rounded-xl p-8 text-center" :class="manualResultConfig.bg">
          <div class="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" :class="manualResultConfig.iconBg">
            <svg v-if="manualResult === 'valid'" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-green-dark"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            <svg v-else-if="manualResult === 'invalid'" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-red-error"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <svg v-else width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-gold"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h3 class="text-xl font-bold mb-2" :class="manualResultConfig.textColor">{{ manualResultConfig.title }}</h3>
          <div v-if="manualResult === 'valid' && lastManualData" class="space-y-1 text-sm">
            <p class="text-text-primary font-medium">{{ lastManualData.attendee_name }}</p>
            <p class="text-text-secondary">{{ lastManualData.ticket_type }} · {{ lastManualData.reference }}</p>
          </div>
          <div v-else-if="manualResult === 'used' && lastManualData" class="text-sm">
            <p class="text-text-secondary">Premier scan : {{ lastManualData.scanned_at }}</p>
          </div>
          <button
            class="mt-4 text-sm text-orange-primary font-semibold cursor-pointer hover:underline"
            @click="manualResult = null"
          >Nouvelle recherche</button>
        </div>
      </div>
    </div>

    <div class="fixed bottom-0 left-0 right-0 bg-surface border-t border-border-light py-3 px-4 z-40">
      <div class="flex items-center justify-center gap-6 text-sm">
        <span class="flex items-center gap-1.5 text-green-dark font-medium">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          {{ stats.validated }} validés
        </span>
        <span class="w-px h-4 bg-border-light" />
        <span class="flex items-center gap-1.5 text-red-error font-medium">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          {{ stats.invalid }} invalides
        </span>
        <span class="w-px h-4 bg-border-light" />
        <span class="flex items-center gap-1.5 text-gold font-medium">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          {{ stats.duplicates }} doublons
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'validator' })

const route = useRoute()
const api = useValidatorApi()
const { error: notifyError, success: notifySuccess, info: notifyInfo } = useNotification()
const offline = useOfflineScanQueue()

const mode = ref<'scan' | 'manual'>('scan')
const cameraActive = ref(true)
const settingsOpen = ref(false)
const scanResult = ref<string | null>(null)
const manualResult = ref<string | null>(null)
const searching = ref(false)
const lastScanData = ref<Record<string, any> | null>(null)
const lastManualData = ref<Record<string, any> | null>(null)
const eventInfo = ref<Record<string, any> | null>(null)

const stats = reactive({
  validated: 0,
  invalid: 0,
  duplicates: 0,
})

const ticketTypes = ref([
  { label: 'Standard', value: 'standard', checked: true },
  { label: 'VIP', value: 'vip', checked: true },
  { label: 'VVIP', value: 'vvip', checked: true },
])

const manualForm = ref({
  ticket: '',
})

const getResultConfig = (result: string | null) => {
  const configs: Record<string, any> = {
    valid: { bg: 'bg-green-dim', iconBg: 'bg-white', textColor: 'text-green-dark', title: 'BILLET VALIDE' },
    invalid: { bg: 'bg-red-error/10', iconBg: 'bg-white', textColor: 'text-red-error', title: 'BILLET INVALIDE' },
    used: { bg: 'bg-orange-dim', iconBg: 'bg-white', textColor: 'text-gold', title: 'D\u00c9J\u00c0 UTILIS\u00c9' },
    pending_sync: { bg: 'bg-gold-dim', iconBg: 'bg-white', textColor: 'text-gold', title: '\u00c0 CONFIRMER (HORS LIGNE)' },
  }
  return configs[result || ''] || configs.valid
}

const scanResultConfig = computed(() => getResultConfig(scanResult.value))
const manualResultConfig = computed(() => getResultConfig(manualResult.value))

const loadStats = async () => {
  try {
    const response = await api.getStats()
    const data = response?.data || response
    stats.validated = data?.validated || data?.valid || 0
    stats.invalid = data?.invalid || 0
    stats.duplicates = data?.duplicates || data?.already_used || data?.already_scanned || 0
    if (data?.event) {
      eventInfo.value = data.event
    }
  } catch (err) {
    console.error('Erreur chargement stats validateur:', err)
  }
}

const mapScanStatus = (response: any): string => {
  const data = response?.data || response
  const status = data?.status || data?.result
  if (status === 'valid' || status === 'success') return 'valid'
  if (status === 'already_scanned' || status === 'already_used' || status === 'used' || status === 'duplicate') return 'used'
  return 'invalid'
}

/** Light haptic + audio feedback so the agent notices the result in a noisy room. */
const buzz = (pattern: number | number[]) => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate(pattern) } catch { /* unsupported */ }
  }
}

/** Sends a queued scan to the API; called by the offline queue when network returns. */
const sendQueuedScan = async (item: { type: 'qr' | 'manual'; payload: { qr_data?: string; ticket_reference?: string } }) => {
  if (item.type === 'qr' && item.payload.qr_data) {
    await api.scan({ qr_data: item.payload.qr_data })
  } else if (item.type === 'manual' && item.payload.ticket_reference) {
    await api.manualValidate({ ticket_reference: item.payload.ticket_reference })
  }
}

/** True for "network down" errors (fetch abort, no connectivity, timeout). */
const isNetworkError = (err: any): boolean => {
  if (!err) return false
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true
  const status = err?.response?.status || err?.status
  // Validation/auth/etc. failures from the backend are NOT network errors
  if (typeof status === 'number' && status >= 400 && status < 600) return false
  const name = err?.name || ''
  const message = (err?.message || '').toLowerCase()
  return name === 'AbortError'
    || name === 'TypeError'
    || message.includes('network')
    || message.includes('fetch')
    || message.includes('timeout')
}

const handleCameraScan = async (data: string) => {
  cameraActive.value = false
  scanResult.value = null
  lastScanData.value = null

  const resetAfter = () => setTimeout(() => {
    scanResult.value = null
    lastScanData.value = null
    cameraActive.value = true
  }, 3000)

  // Offline path: queue locally and tell the agent the scan is unverified.
  // We MUST NOT show "valid" — we have no way to know if the ticket exists,
  // was already scanned, or is invalid. The agent must use their judgement.
  if (!offline.isOnline.value) {
    offline.enqueue({ type: 'qr', payload: { qr_data: data } })
    scanResult.value = 'pending_sync'
    lastScanData.value = { offline: true } as any
    buzz([120, 60, 120])
    notifyInfo('Hors ligne — à vérifier après synchronisation')
    resetAfter()
    return
  }

  try {
    const response = await api.scan({ qr_data: data })
    const responseData = response?.data || response
    lastScanData.value = {
      attendee_name: responseData?.ticket?.buyer_name || responseData?.ticket?.attendee_name || null,
      ticket_type: responseData?.ticket?.pass_type || responseData?.ticket?.ticket_type || null,
      reference: responseData?.ticket?.reference || null,
      scanned_at: responseData?.first_scan_at || responseData?.scanned_at || null,
    }
    scanResult.value = mapScanStatus(response)
    // Haptic feedback: short for valid, long+long for duplicate, short+pause+short for invalid
    if (scanResult.value === 'valid') buzz(80)
    else if (scanResult.value === 'used') buzz([200, 100, 200])
    else buzz([80, 80, 80])
    await loadStats()
    resetAfter()
  } catch (err: any) {
    // Network error → queue and report success locally; real error → show invalid
    if (isNetworkError(err)) {
      offline.enqueue({ type: 'qr', payload: { qr_data: data } })
      scanResult.value = 'pending_sync'
      lastScanData.value = { offline: true } as any
      buzz([120, 60, 120])
      notifyInfo('Réseau indisponible — scan à vérifier après synchronisation')
    } else {
      scanResult.value = 'invalid'
      buzz([80, 80, 80])
      notifyError(err?.message || err?.data?.message || 'Erreur lors du scan')
    }
    resetAfter()
  }
}

const handleCameraError = (message: string) => {
  notifyError(message)
}

const handleManualSearch = async () => {
  searching.value = true
  manualResult.value = null
  lastManualData.value = null
  try {
    const reference = manualForm.value.ticket.trim()
    if (!reference) {
      notifyError('Veuillez saisir un numéro de ticket')
      searching.value = false
      return
    }

    // Offline: queue and mark as unverified (the ticket may not even exist)
    if (!offline.isOnline.value) {
      offline.enqueue({ type: 'manual', payload: { ticket_reference: reference } })
      manualResult.value = 'pending_sync'
      lastManualData.value = { reference, offline: true } as any
      buzz([120, 60, 120])
      notifyInfo('Hors ligne — à vérifier après synchronisation')
      return
    }

    const response = await api.manualValidate({ ticket_reference: reference })
    const data = response?.data || response
    const status = mapScanStatus(response)
    lastManualData.value = {
      attendee_name: data?.ticket?.buyer_name || data?.ticket?.attendee_name || null,
      ticket_type: data?.ticket?.pass_type || data?.ticket?.ticket_type || null,
      reference: data?.ticket?.reference || null,
      scanned_at: data?.first_scan_at || data?.scanned_at || null,
    }
    manualResult.value = status
    if (status === 'valid') buzz(80)
    else if (status === 'used') buzz([200, 100, 200])
    else buzz([80, 80, 80])
    await loadStats()
  } catch (err: any) {
    if (isNetworkError(err)) {
      offline.enqueue({ type: 'manual', payload: { ticket_reference: manualForm.value.ticket.trim() } })
      manualResult.value = 'pending_sync'
      lastManualData.value = { reference: manualForm.value.ticket.trim(), offline: true } as any
      buzz([120, 60, 120])
      notifyInfo('Réseau indisponible — à vérifier après synchronisation')
    } else {
      manualResult.value = 'invalid'
      buzz([80, 80, 80])
      notifyError(err?.message || err?.data?.message || 'Billet introuvable')
    }
  } finally {
    searching.value = false
  }
}

// Auto-sync pending scans whenever connectivity returns
const syncOfflineQueue = async () => {
  if (!offline.isOnline.value || offline.queue.value.length === 0) return
  const before = offline.queue.value.length
  await offline.flush(sendQueuedScan)
  const after = offline.queue.value.length
  const synced = before - after
  if (synced > 0) {
    notifySuccess(`${synced} scan${synced > 1 ? 's' : ''} synchronisé${synced > 1 ? 's' : ''}`)
    await loadStats()
  }
}

watch(() => offline.isOnline.value, (online) => {
  if (online) syncOfflineQueue()
})

onMounted(() => {
  if (!localStorage.getItem('validator_token')) {
    navigateTo('/validator/login/' + route.params.code)
    return
  }
  loadStats()
  // Replay anything that piled up while the page wasn't mounted
  syncOfflineQueue()
})

/**
 * Validator logout — drops the session token AND wipes the offline scan queue
 * so the next person logging in on the same device can't replay scans they
 * never made (queue persists in localStorage across sessions otherwise).
 */
const handleValidatorLogout = async () => {
  // Try to flush any pending scans one last time before walking away
  if (offline.isOnline.value && offline.queue.value.length > 0) {
    try { await offline.flush(sendQueuedScan) } catch { /* offline or server down */ }
  }
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('validator_token')
    localStorage.removeItem('validator_offline_scan_queue_v1')
  }
  navigateTo(`/validator/login/${route.params.code}`)
}
</script>
