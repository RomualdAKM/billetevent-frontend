type QueuedScan = {
  id: string
  type: 'qr' | 'manual'
  payload: { qr_data?: string; ticket_reference?: string }
  queuedAt: number
}

const STORAGE_KEY = 'validator_offline_scan_queue_v1'

/**
 * Tracks online/offline state and a localStorage-backed queue of scans
 * that could not reach the API. Designed for venues where 4G drops in the
 * middle of check-in. Each scan is sent best-effort first; on network
 * failure or offline status, it is queued and re-sent automatically when
 * connectivity returns.
 */
export const useOfflineScanQueue = () => {
  const isOnline = ref(true)
  const queue = ref<QueuedScan[]>([])
  const flushing = ref(false)

  const load = () => {
    if (!import.meta.client) return
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      queue.value = raw ? JSON.parse(raw) : []
    } catch {
      queue.value = []
    }
  }

  const persist = () => {
    if (!import.meta.client) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue.value))
  }

  const enqueue = (item: Omit<QueuedScan, 'id' | 'queuedAt'>) => {
    const entry: QueuedScan = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      queuedAt: Date.now(),
    }
    queue.value.push(entry)
    persist()
    return entry
  }

  const remove = (id: string) => {
    queue.value = queue.value.filter(q => q.id !== id)
    persist()
  }

  /**
   * Drains the queue by handing each entry to `sender`. Entries that
   * succeed are removed; entries that fail stay queued for the next flush.
   */
  const flush = async (sender: (item: QueuedScan) => Promise<void>) => {
    if (flushing.value) return
    flushing.value = true
    try {
      // Copy so callers can enqueue while we drain
      const items = [...queue.value]
      for (const item of items) {
        try {
          await sender(item)
          remove(item.id)
        } catch {
          // Leave it in the queue — likely still offline or server error
          break
        }
      }
    } finally {
      flushing.value = false
    }
  }

  const updateOnline = () => {
    if (typeof navigator === 'undefined') return
    isOnline.value = navigator.onLine
  }

  onMounted(() => {
    load()
    updateOnline()
    window.addEventListener('online', updateOnline)
    window.addEventListener('offline', updateOnline)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('online', updateOnline)
    window.removeEventListener('offline', updateOnline)
  })

  return {
    isOnline,
    queue,
    flushing,
    enqueue,
    remove,
    flush,
    load,
  }
}
