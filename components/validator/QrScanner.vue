<template>
  <div class="max-w-md mx-auto">
    <div v-if="cameraError" class="bg-red-error/10 rounded-xl p-6 text-center">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mx-auto mb-3 text-red-error opacity-60">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
      <p class="text-red-error text-sm font-medium">{{ cameraError }}</p>
    </div>
    <div v-else :id="scannerId" class="aspect-square rounded-xl overflow-hidden" />
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

let html5Qrcode: any = null
let isScanning = false

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
  } catch {
    cameraError.value = 'Accès à la caméra refusé'
    emit('error', 'Accès à la caméra refusé')
  }
}

const stopScanner = async () => {
  if (!html5Qrcode || !isScanning) return

  try {
    await html5Qrcode.stop()
  } catch (err) {
    console.error('Erreur arrêt scanner:', err)
  }

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
