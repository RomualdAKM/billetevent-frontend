<template>
  <div class="max-w-md mx-auto">
    <div v-if="cameraError" class="bg-red-error/10 rounded-xl p-6 text-center">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mx-auto mb-3 text-red-error opacity-60">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
      <p class="text-red-error text-sm font-medium">{{ cameraError }}</p>
    </div>
    <div v-else class="relative">
      <div :id="scannerId" class="aspect-square rounded-xl overflow-hidden" />

      <!-- Bouton torche : critique en festival nuit / concert dans le noir
           Affiché uniquement si l'API caméra supporte `torch` (mobile récent).
           Position absolue en bas-droite pour rester accessible au pouce. -->
      <button
        v-if="torchSupported"
        type="button"
        :aria-label="torchOn ? 'Éteindre la torche' : 'Allumer la torche'"
        :title="torchOn ? 'Éteindre la torche' : 'Allumer la torche'"
        class="absolute bottom-3 right-3 w-12 h-12 rounded-full bg-black/70 backdrop-blur-sm flex items-center justify-center text-white shadow-lg active:scale-95 transition-transform"
        :class="{ 'bg-orange-primary': torchOn }"
        @click="toggleTorch"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6L6 18M6 6l12 12" v-if="false" />
          <path d="M3 2h6l1 4 5 4-1 1-5-4-4-1z"/>
          <path d="M9 7l8 8M14 12l4 4"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  active: boolean
}>()

const emit = defineEmits<{
  scan: [data: string]
  error: [message: string]
}>()

const scannerId = `qr-scanner-${Math.random().toString(36).substring(2, 10)}`
const cameraError = ref<string | null>(null)
const torchSupported = ref(false)
const torchOn = ref(false)

let html5Qrcode: any = null
let isScanning = false
// Référence vers le MediaStreamTrack vidéo pour piloter la torche.
let videoTrack: MediaStreamTrack | null = null

async function detectTorchSupport() {
  // html5-qrcode crée son propre <video> à l'intérieur du container.
  // On attend qu'il soit visible puis on inspecte son srcObject.
  if (!import.meta.client) return
  try {
    await nextTick()
    const container = document.getElementById(scannerId)
    const video = container?.querySelector('video') as HTMLVideoElement | null
    if (!video) return
    const stream = video.srcObject as MediaStream | null
    if (!stream) return
    videoTrack = stream.getVideoTracks()[0] || null
    if (!videoTrack) return
    // `getCapabilities` n'existe pas sur tous les navigateurs/devices
    const capabilities: any = typeof videoTrack.getCapabilities === 'function'
      ? videoTrack.getCapabilities()
      : {}
    torchSupported.value = !!capabilities.torch
  } catch {
    torchSupported.value = false
  }
}

async function toggleTorch() {
  if (!videoTrack || !torchSupported.value) return
  try {
    const next = !torchOn.value
    // `applyConstraints` avec `advanced` est l'API non-standard pour le torch.
    await videoTrack.applyConstraints({
      advanced: [{ torch: next } as any],
    })
    torchOn.value = next
  } catch {
    // Échec silencieux : certains devices refusent en cas de batterie faible.
  }
}

const startScanner = async () => {
  if (isScanning || !import.meta.client) return

  try {
    const { Html5Qrcode } = await import('html5-qrcode')
    html5Qrcode = new Html5Qrcode(scannerId)

    await html5Qrcode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText: string) => {
        emit('scan', decodedText)
      },
      () => {}
    )

    isScanning = true
    cameraError.value = null
    // Petit délai pour laisser html5-qrcode insérer le <video>
    setTimeout(() => detectTorchSupport(), 500)
  } catch {
    cameraError.value = 'Accès à la caméra refusé'
    emit('error', 'Accès à la caméra refusé')
  }
}

const stopScanner = async () => {
  if (!html5Qrcode || !isScanning) return

  // Éteindre la torche avant d'arrêter (sinon elle reste allumée)
  if (torchOn.value && videoTrack) {
    try { await videoTrack.applyConstraints({ advanced: [{ torch: false } as any] }) } catch { /* silencieux */ }
    torchOn.value = false
  }

  try {
    await html5Qrcode.stop()
  } catch (err) {
    console.error('Erreur arrêt scanner:', err)
  }

  videoTrack = null
  torchSupported.value = false
  isScanning = false
}

watch(() => props.active, async (newVal) => {
  if (newVal) {
    await nextTick()
    await startScanner()
  } else {
    await stopScanner()
  }
})

onMounted(async () => {
  if (props.active) {
    await nextTick()
    await startScanner()
  }
})

onBeforeUnmount(async () => {
  await stopScanner()
})
</script>
