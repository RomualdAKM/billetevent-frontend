/**
 * Composable de tracking pixels (Facebook, TikTok, GA4, Google Ads)
 * Gère l'injection des scripts et le suivi des événements côté client uniquement.
 */

interface PixelData {
  id: number
  type: string // 'facebook', 'tiktok', 'ga4', 'google_ads'
  pixel_id: string
  is_active: boolean
}

interface ViewContentData {
  name: string
  category?: string
  value: number
  currency: string
}

interface InitiateCheckoutData {
  value: number
  currency: string
  items: Array<{ name?: string; id?: number | string; quantity?: number; price?: number }>
}

interface PurchaseData {
  orderId: string | number
  value: number
  currency: string
}

// Cache global des pixels par organisateur
const pixelsCache = () => useState<Record<number, PixelData[]>>('tracking_pixels_cache', () => ({}))

// Scripts déjà chargés (éviter les doublons)
const loadedScripts = new Set<string>()

// ── Cookie consent gating ─────────────────────────────────────
// Synced with components/ui/CookieConsent.vue (storage key v2)
const CONSENT_STORAGE_KEY = 'billetevent_cookie_consent_v2'

type ConsentRecord = { essential: true; analytics: boolean; marketing: boolean }

/** Returns the current consent record, or null when the banner has not been answered yet. */
function readConsent(): ConsentRecord | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      essential: true,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
    }
  } catch {
    return null
  }
}

/**
 * Map a pixel type to the consent category it requires.
 * - Facebook, TikTok, Google Ads = ad / retargeting → marketing
 * - GA4 = audience measurement → analytics
 */
function consentCategoryFor(pixelType: string): 'analytics' | 'marketing' {
  return pixelType === 'ga4' ? 'analytics' : 'marketing'
}

/** True when the user has explicitly granted consent for the category. */
function hasConsentFor(category: 'analytics' | 'marketing'): boolean {
  const consent = readConsent()
  if (!consent) return false // No answer yet → no tracking until they choose
  return consent[category] === true
}

export const useTracking = () => {
  const api = useApi()

  // Pixels actifs pour la session courante
  let activePixels: PixelData[] = []

  // ── Helpers d'injection de scripts ──

  /** Charge un script externe une seule fois */
  function loadScript(src: string, id?: string): Promise<void> {
    if (typeof window === 'undefined') return Promise.resolve()
    if (loadedScripts.has(src)) return Promise.resolve()

    return new Promise((resolve) => {
      try {
        // Vérifier si le script existe déjà dans le DOM
        if (id && document.getElementById(id)) {
          loadedScripts.add(src)
          resolve()
          return
        }

        const script = document.createElement('script')
        script.src = src
        script.async = true
        if (id) script.id = id
        script.onload = () => {
          loadedScripts.add(src)
          resolve()
        }
        script.onerror = () => {
          // Silencieux en cas d'erreur de chargement
          resolve()
        }
        document.head.appendChild(script)
      } catch {
        resolve()
      }
    })
  }

  // ── Initialisation Facebook Pixel ──
  function initFacebookPixel(pixelId: string) {
    if (typeof window === 'undefined') return
    try {
      // Initialiser fbq si pas encore fait
      if (!(window as any).fbq) {
        const fbq: any = function (...args: any[]) {
          fbq.callMethod ? fbq.callMethod(...args) : fbq.queue.push(args)
        }
        fbq.push = fbq
        fbq.loaded = true
        fbq.version = '2.0'
        fbq.queue = [];
        (window as any).fbq = fbq;
        (window as any)._fbq = fbq
      }

      loadScript('https://connect.facebook.net/en_US/fbevents.js', 'fb-pixel-script')
      ;(window as any).fbq('init', pixelId)
      ;(window as any).fbq('track', 'PageView')
    } catch {
      // Silencieux
    }
  }

  // ── Initialisation TikTok Pixel ──
  function initTikTokPixel(pixelId: string) {
    if (typeof window === 'undefined') return
    try {
      if (!(window as any).ttq) {
        const ttq: any = [];
        ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie']
        ttq.setAndDefer = function (t: any, e: string) {
          t[e] = function (...args: any[]) {
            t.push([e, ...args])
          }
        }
        ttq.methods.forEach((m: string) => ttq.setAndDefer(ttq, m));
        (window as any).ttq = ttq
      }

      loadScript('https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=' + pixelId, 'tt-pixel-script')
      ;(window as any).ttq.load(pixelId)
      ;(window as any).ttq.page()
    } catch {
      // Silencieux
    }
  }

  // ── Initialisation GA4 / Google Ads (gtag.js) ──
  function initGtagPixel(measurementId: string) {
    if (typeof window === 'undefined') return
    try {
      // Initialiser dataLayer et gtag si pas encore fait
      if (!(window as any).gtag) {
        (window as any).dataLayer = (window as any).dataLayer || []
        ;(window as any).gtag = function (...args: any[]) {
          (window as any).dataLayer.push(args)
        }
        ;(window as any).gtag('js', new Date())
      }

      // Charger le script gtag.js une seule fois (utiliser le premier ID)
      loadScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`, 'gtag-script')
      ;(window as any).gtag('config', measurementId)
    } catch {
      // Silencieux
    }
  }

  // ── Récupérer les pixels par type — gated par le consentement utilisateur ──
  function getPixelsByType(type: string): PixelData[] {
    if (!hasConsentFor(consentCategoryFor(type))) return []
    return activePixels.filter(p => p.type === type && p.is_active)
  }

  // ── API publique ──

  /**
   * Récupère les pixels de l'organisateur via l'API et injecte les scripts nécessaires.
   * Utilise un cache pour éviter de re-fetch.
   */
  async function initPixels(organizerId: number | undefined | null) {
    if (typeof window === 'undefined' || !organizerId) return

    try {
      const cache = pixelsCache()

      // Vérifier le cache
      if (cache.value[organizerId]) {
        activePixels = cache.value[organizerId]
      } else {
        // apiBase already includes the /api prefix — passing /api/pixels/X
        // produces /api/api/pixels/X (404). Strip the duplicate.
        const res: any = await api.get(`/pixels/${organizerId}`)
        const pixels: PixelData[] = res?.data ?? res ?? []
        cache.value[organizerId] = pixels
        activePixels = pixels
      }

      // Injecter les scripts pour chaque pixel actif, gated par le consentement
      // (un visiteur qui a refusé marketing ne verra jamais charger fbevents.js)
      for (const pixel of activePixels) {
        if (!pixel.is_active) continue
        if (!hasConsentFor(consentCategoryFor(pixel.type))) continue

        switch (pixel.type) {
          case 'facebook':
            initFacebookPixel(pixel.pixel_id)
            break
          case 'tiktok':
            initTikTokPixel(pixel.pixel_id)
            break
          case 'ga4':
            initGtagPixel(pixel.pixel_id)
            break
          case 'google_ads':
            initGtagPixel(pixel.pixel_id)
            break
        }
      }
    } catch {
      // Silencieux — le tracking ne doit jamais bloquer l'application
    }
  }

  /**
   * Tracke la vue d'un contenu (page détail événement)
   */
  function trackViewContent(data: ViewContentData) {
    if (typeof window === 'undefined') return

    try {
      // Facebook Pixel
      for (const _p of getPixelsByType('facebook')) {
        ;(window as any).fbq?.('track', 'ViewContent', {
          content_name: data.name,
          content_category: data.category || '',
          value: data.value,
          currency: data.currency,
        })
      }

      // TikTok Pixel
      for (const _p of getPixelsByType('tiktok')) {
        ;(window as any).ttq?.track('ViewContent', {
          content_name: data.name,
          content_category: data.category || '',
          value: data.value,
          currency: data.currency,
        })
      }

      // GA4
      for (const _p of getPixelsByType('ga4')) {
        ;(window as any).gtag?.('event', 'view_item', {
          item_name: data.name,
          item_category: data.category || '',
          value: data.value,
          currency: data.currency,
        })
      }
    } catch {
      // Silencieux
    }
  }

  /**
   * Tracke le début du checkout
   */
  function trackInitiateCheckout(data: InitiateCheckoutData) {
    if (typeof window === 'undefined') return

    try {
      // Facebook Pixel
      for (const _p of getPixelsByType('facebook')) {
        ;(window as any).fbq?.('track', 'InitiateCheckout', {
          value: data.value,
          currency: data.currency,
          num_items: data.items.length,
        })
      }

      // TikTok Pixel
      for (const _p of getPixelsByType('tiktok')) {
        ;(window as any).ttq?.track('PlaceAnOrder', {
          value: data.value,
          currency: data.currency,
          contents: data.items.map(i => ({
            content_id: String(i.id || ''),
            content_name: i.name || '',
            quantity: i.quantity || 1,
            price: i.price || 0,
          })),
        })
      }

      // GA4
      for (const _p of getPixelsByType('ga4')) {
        ;(window as any).gtag?.('event', 'begin_checkout', {
          value: data.value,
          currency: data.currency,
          items: data.items.map(i => ({
            item_id: String(i.id || ''),
            item_name: i.name || '',
            quantity: i.quantity || 1,
            price: i.price || 0,
          })),
        })
      }
    } catch {
      // Silencieux
    }
  }

  /**
   * Tracke un achat confirmé
   */
  function trackPurchase(data: PurchaseData) {
    if (typeof window === 'undefined') return

    try {
      // Facebook Pixel
      for (const _p of getPixelsByType('facebook')) {
        ;(window as any).fbq?.('track', 'Purchase', {
          value: data.value,
          currency: data.currency,
          content_type: 'product',
        })
      }

      // TikTok Pixel
      for (const _p of getPixelsByType('tiktok')) {
        ;(window as any).ttq?.track('CompletePayment', {
          value: data.value,
          currency: data.currency,
        })
      }

      // GA4
      for (const _p of getPixelsByType('ga4')) {
        ;(window as any).gtag?.('event', 'purchase', {
          transaction_id: String(data.orderId),
          value: data.value,
          currency: data.currency,
        })
      }

      // Google Ads — conversion
      for (const pixel of getPixelsByType('google_ads')) {
        ;(window as any).gtag?.('event', 'conversion', {
          send_to: pixel.pixel_id,
          value: data.value,
          currency: data.currency,
          transaction_id: String(data.orderId),
        })
      }
    } catch {
      // Silencieux
    }
  }

  /**
   * Nettoyer les pixels actifs (pas les scripts globaux, juste la référence locale)
   */
  function cleanup() {
    activePixels = []
  }

  return {
    initPixels,
    trackViewContent,
    trackInitiateCheckout,
    trackPurchase,
    cleanup,
  }
}
