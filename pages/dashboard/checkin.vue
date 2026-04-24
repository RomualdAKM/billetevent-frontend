<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: ['auth', 'organizer'] })

const api = useOrganizerApi()
const { success, error: notifyError } = useNotification()

const selectedEvent = ref('')
const manualCode = ref('')
const scanResult = ref<string | null>(null)
const lastScanInfo = ref<any>(null)
const verifying = ref(false)
const scannerActive = ref(false)
const cameraErrorMsg = ref<string | null>(null)
const loadingStats = ref(false)
const events = ref<any[]>([])
const recentScans = ref<any[]>([])
let refreshInterval: ReturnType<typeof setInterval> | null = null

const dayStats = ref([
  {
    label: 'Total scannés', sublabel: 'Billets présentés', value: 0, bg: 'bg-surface',
    iconBg: 'bg-blue-dim',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue-main)" stroke-width="2" stroke-linecap="round"><path d="M2 7V1h6"/><path d="M16 1h6v6"/><path d="M22 17v6h-6"/><path d="M8 23H2v-6"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>'
  },
  {
    label: 'Valides', sublabel: 'Entrées confirmées', value: 0, bg: 'bg-surface',
    iconBg: 'bg-green-dim',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-green-dark)" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
  },
  {
    label: 'Invalides', sublabel: 'Billets non reconnus', value: 0, bg: 'bg-surface',
    iconBg: 'bg-red-dim',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-red-error)" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
  },
  {
    label: 'Déjà utilisés', sublabel: 'Tentatives dupliquées', value: 0, bg: 'bg-surface',
    iconBg: 'bg-orange-dim',
    icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange-primary)" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  }
])

const scanTableColumns = [
  { key: 'time', label: 'Heure' },
  { key: 'code', label: 'Code billet' },
  { key: 'participant', label: 'Participant', hideOnMobile: true },
  { key: 'type', label: 'Type', hideOnMobile: true },
  { key: 'result', label: 'Résultat' },
]

const toggleScanner = () => {
  cameraErrorMsg.value = null
  scannerActive.value = !scannerActive.value
}

const onQrScanned = (data: string) => {
  if (verifying.value) return
  manualCode.value = data
  verifyCode()
}

const onCameraError = (message: string) => {
  cameraErrorMsg.value = message
  scannerActive.value = false
}

const resultClassMap: Record<string, string> = {
  valid: 'bg-green-dim text-green-dark',
  invalid: 'bg-red-dim text-red-error',
  already_used: 'bg-orange-dim text-orange-primary'
}

const resultLabelMap: Record<string, string> = {
  valid: 'Valide',
  invalid: 'Invalide',
  already_used: 'Déjà utilisé'
}

const resultVariantMap: Record<string, string> = {
  valid: 'success',
  invalid: 'error',
  already_used: 'warning'
}

async function loadEvents() {
  try {
    const res = await api.getEvents()
    const data = res.data ?? res
    events.value = Array.isArray(data) ? data : (data.data ?? [])
  } catch (err) {
    console.error('Error loading events:', err)
  }
}

async function loadCheckinData() {
  if (!selectedEvent.value) return
  try {
    const [statsRes, scansRes] = await Promise.all([
      api.getCheckinStats(selectedEvent.value),
      api.getRecentScans(selectedEvent.value)
    ])
    const stats = statsRes.data ?? statsRes
    dayStats.value[0].value = stats.scanned_count ?? stats.total_scanned ?? stats.total ?? 0
    dayStats.value[1].value = stats.valid_count ?? stats.valid ?? 0
    dayStats.value[2].value = stats.invalid_count ?? stats.invalid ?? 0
    dayStats.value[3].value = stats.duplicate_count ?? stats.already_used ?? stats.duplicates ?? 0

    const scansData = scansRes.data ?? scansRes
    const scans = Array.isArray(scansData) ? scansData : (scansData.data ?? [])
    recentScans.value = scans.map((s: any) => ({
      time: s.scanned_at ? new Date(s.scanned_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '',
      code: s.ticket_reference || s.ticket_code || s.code || '',
      participant: s.holder_name || s.participant_name || s.participant || '\u2014',
      type: s.pass_type || s.pass_name || s.type || '\u2014',
      resultLabel: resultLabelMap[s.scan_result] || resultLabelMap[s.result] || s.scan_result || s.result || '',
      resultVariant: resultVariantMap[s.scan_result] || resultVariantMap[s.result] || 'neutral',
    }))
  } catch {
    notifyError('Impossible de charger les données de check-in')
  }
}

async function loadAllData() {
  if (!selectedEvent.value) return
  loadingStats.value = true
  try {
    await loadCheckinData()
  } finally {
    loadingStats.value = false
  }
}

function startAutoRefresh() {
  stopAutoRefresh()
  refreshInterval = setInterval(() => {
    if (selectedEvent.value) loadCheckinData()
  }, 30000)
}

function stopAutoRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval)
    refreshInterval = null
  }
}

watch(selectedEvent, (val) => {
  if (val) {
    loadAllData()
    startAutoRefresh()
  } else {
    stopAutoRefresh()
    recentScans.value = []
    dayStats.value.forEach(s => s.value = 0)
  }
})

const verifyCode = async () => {
  const code = manualCode.value.trim()
  if (!code) return
  if (!selectedEvent.value) {
    notifyError('Veuillez sélectionner un événement')
    return
  }
  verifying.value = true
  scanResult.value = null
  lastScanInfo.value = null
  try {
    const res = await api.verifyTicket(selectedEvent.value, code)
    const data = res?.data ?? res
    lastScanInfo.value = data?.ticket || data
    const status = data?.status || data?.result
    if (status === 'valid' || status === 'success') {
      scanResult.value = 'valid'
    } else if (status === 'already_scanned' || status === 'already_used' || status === 'used' || status === 'duplicate') {
      scanResult.value = 'used'
    } else {
      scanResult.value = 'invalid'
    }
    await loadCheckinData()
  } catch (err: any) {
    scanResult.value = 'invalid'
    notifyError(err?.message || 'Billet invalide ou introuvable')
  } finally {
    verifying.value = false
  }
}

const resetScan = () => {
  scanResult.value = null
  lastScanInfo.value = null
  manualCode.value = ''
}

onMounted(() => {
  loadEvents()
})

onBeforeUnmount(() => {
  stopAutoRefresh()
})
</script>

<template>
  <div>
    <UiPageHeader title="Scan & Check-in" subtitle="Scannez les billets et gérez les entrées en temps réel" />

    <!-- Stat cards -->
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <div
        v-for="stat in dayStats"
        :key="stat.label"
        class="bg-surface border border-border-light rounded-xl p-5 hover:border-border-medium transition-colors"
      >
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" :class="stat.iconBg">
            <span v-html="stat.icon" />
          </div>
        </div>
        <div class="font-serif text-2xl text-text-primary leading-none mb-1">{{ stat.value }}</div>
        <div class="text-xs font-medium text-text-primary">{{ stat.label }}</div>
        <div class="text-[11px] text-text-tertiary mt-0.5">{{ stat.sublabel }}</div>
      </div>
    </div>

    <!-- Event selector -->
    <div class="mb-6">
      <select
        v-model="selectedEvent"
        class="px-4 py-2.5 rounded-xl border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-colors focus:border-orange-primary focus:ring-1 focus:ring-orange-primary/40 font-sans appearance-none cursor-pointer min-w-[280px]"
      >
        <option value="">-- Sélectionner un événement --</option>
        <option v-for="evt in events" :key="evt.id" :value="evt.id">{{ evt.title || evt.name }}</option>
      </select>
    </div>

    <!-- Loading -->
    <div v-if="loadingStats" class="flex items-center justify-center py-12">
      <div class="w-6 h-6 border-2 border-orange-primary border-t-transparent rounded-full animate-spin" />
    </div>

    <!-- No event selected -->
    <div v-else-if="!selectedEvent" class="bg-surface border border-border-light rounded-xl p-10 text-center mb-8">
      <svg class="mx-auto mb-3 text-text-tertiary" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
      <div class="text-sm text-text-tertiary">Sélectionnez un événement pour commencer le check-in</div>
    </div>

    <template v-else>
      <!-- Scanner area -->
      <div class="bg-surface border border-border-light rounded-xl p-8 text-center mb-8">
        <div class="relative max-w-[400px] mx-auto mb-6">
          <div v-if="scannerActive">
            <ValidatorQrScanner :active="scannerActive" @scan="onQrScanned" @error="onCameraError" />
            <button
              class="mt-3 text-sm text-text-secondary underline cursor-pointer bg-transparent border-none font-sans hover:text-text-primary transition-colors"
              @click="toggleScanner"
            >
              Désactiver la caméra
            </button>
          </div>
          <div v-else>
            <div
              class="bg-text-primary/95 rounded-2xl aspect-square flex flex-col items-center justify-center gap-3 relative overflow-hidden cursor-pointer"
              @click="toggleScanner"
            >
              <div class="absolute inset-4 border-2 border-dashed border-white/20 rounded-xl pointer-events-none" />
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
              <span class="text-white/60 text-sm">Cliquez pour activer la caméra</span>
            </div>
            <p v-if="cameraErrorMsg" class="mt-2 text-red-error text-xs">{{ cameraErrorMsg }}</p>
          </div>
        </div>

        <!-- Separator -->
        <div class="flex items-center gap-4 max-w-[400px] mx-auto mb-6">
          <div class="flex-1 h-px bg-border-light" />
          <span class="text-text-tertiary text-sm">ou</span>
          <div class="flex-1 h-px bg-border-light" />
        </div>

        <!-- Manual input -->
        <div class="flex gap-3 max-w-[500px] mx-auto">
          <input
            v-model="manualCode"
            type="text"
            placeholder="Entrez le code du billet (ex: BEV-2024-STD-0042)"
            class="flex-1 px-4 py-2.5 rounded-xl border border-border-light bg-bg-primary text-sm text-text-primary outline-none transition-colors focus:border-orange-primary focus:ring-1 focus:ring-orange-primary/40 font-sans"
            @keyup.enter="verifyCode"
          />
          <button
            class="bg-orange-primary text-white px-6 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border-none transition-all hover:bg-orange-light shrink-0"
            :disabled="verifying"
            @click="verifyCode"
          >
            {{ verifying ? 'Vérification...' : 'Vérifier' }}
          </button>
        </div>
      </div>

      <!-- Scan result -->
      <Transition name="scale">
        <div v-if="scanResult" class="mb-8">
          <!-- Valid -->
          <div v-if="scanResult === 'valid'" class="bg-green-dim border border-green-dark/20 rounded-xl p-6 text-center">
            <div class="w-16 h-16 rounded-full bg-green-dark/10 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-green-dark">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div class="text-green-dark font-bold text-xl mb-4">BILLET VALIDE</div>
            <div v-if="lastScanInfo" class="flex flex-col gap-2 max-w-xs mx-auto text-left">
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Nom</span>
                <span class="text-text-primary font-semibold">{{ lastScanInfo.attendee_name || lastScanInfo.participant_name || '—' }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Type</span>
                <span class="text-text-primary font-semibold">{{ lastScanInfo.pass_name || lastScanInfo.ticket_type || '—' }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-text-secondary">Événement</span>
                <span class="text-text-primary font-semibold">{{ lastScanInfo.event_name || lastScanInfo.event || '—' }}</span>
              </div>
            </div>
            <button
              class="mt-5 bg-green-dark text-white px-6 py-2.5 rounded-lg text-sm font-semibold cursor-pointer border-none transition-all hover:opacity-90"
              @click="resetScan"
            >
              Scan suivant
            </button>
          </div>

          <!-- Already used -->
          <div v-else-if="scanResult === 'used'" class="bg-orange-dim border border-orange-primary/20 rounded-xl p-6 text-center">
            <div class="w-16 h-16 rounded-full bg-orange-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-orange-primary">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div class="text-orange-primary font-bold text-xl mb-2">BILLET DÉJÀ UTILISÉ</div>
            <p v-if="lastScanInfo?.scanned_at" class="text-text-secondary text-sm">Scanné le {{ new Date(lastScanInfo.scanned_at).toLocaleString('fr-FR') }}</p>
            <button
              class="mt-5 bg-orange-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold cursor-pointer border-none transition-all hover:opacity-90"
              @click="resetScan"
            >
              Scan suivant
            </button>
          </div>

          <!-- Invalid -->
          <div v-else class="bg-red-dim border border-red-error/20 rounded-xl p-6 text-center">
            <div class="w-16 h-16 rounded-full bg-red-error/10 flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="text-red-error">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            </div>
            <div class="text-red-error font-bold text-xl mb-2">BILLET INVALIDE</div>
            <p class="text-text-secondary text-sm">Ce code n'est pas reconnu</p>
            <button
              class="mt-5 bg-surface-2 text-text-primary px-6 py-2.5 rounded-lg text-sm font-semibold cursor-pointer border border-border-light transition-all hover:bg-surface-3"
              @click="resetScan"
            >
              Scan suivant
            </button>
          </div>
        </div>
      </Transition>

      <!-- Recent scans table -->
      <UiDataTable
        :columns="scanTableColumns"
        :rows="recentScans"
        :loading="false"
        empty-title="Aucun scan récent"
        empty-description="Les scans apparaîtront ici après vérification des billets."
      >
        <template #cell-code="{ value }">
          <span class="font-mono text-sm">{{ value }}</span>
        </template>
        <template #cell-result="{ row }">
          <UiStatusBadge
            :variant="row.resultVariant"
            :label="row.resultLabel"
            size="sm"
          />
        </template>
      </UiDataTable>
    </template>
  </div>
</template>

<style scoped>
.scale-enter-active {
  transition: all 0.3s ease;
}
.scale-leave-active {
  transition: all 0.2s ease;
}
.scale-enter-from {
  opacity: 0;
  transform: scale(0.95);
}
.scale-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
