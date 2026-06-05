/**
 * Centralized formatters for BilletEvent.
 *
 * Why this composable exists:
 * - Before this, `formatPrice`, `formatNumber`, and `formatDate` were
 *   redefined in 19+ files with subtle variations (" F CFA" vs "FCFA" vs "F").
 * - Currency, locale, and date format changes had to be hunted across the
 *   codebase. Now they live in one place.
 *
 * Conventions:
 * - Currency: F CFA (Franc CFA UEMOA) with non-breaking space between number
 *   and unit, formatted in `fr-FR` locale (thousand separator = NBSP).
 * - Dates: French long, short, and date-time variants.
 * - All functions are pure and SSR-safe.
 */
export const useFormatters = () => {
  /**
   * Format a price in FCFA. 0 → "Gratuit", other → "5 000 F CFA".
   * Accepts numbers or numeric strings.
   */
  const formatPrice = (value: number | string | null | undefined): string => {
    const n = Number(value)
    if (!Number.isFinite(n)) return '—'
    if (n === 0) return 'Gratuit'
    return new Intl.NumberFormat('fr-FR').format(n) + ' F CFA'
  }

  /** Same as formatPrice but without "Gratuit" — always returns a number + unit. */
  const formatAmount = (value: number | string | null | undefined): string => {
    const n = Number(value)
    if (!Number.isFinite(n)) return '—'
    return new Intl.NumberFormat('fr-FR').format(n) + ' F CFA'
  }

  /** Plain number formatting (no currency unit). */
  const formatNumber = (value: number | string | null | undefined): string => {
    const n = Number(value)
    if (!Number.isFinite(n)) return '—'
    return new Intl.NumberFormat('fr-FR').format(n)
  }

  /** Compact percentage (eg. 42 → "42 %"). */
  const formatPercent = (value: number | string | null | undefined): string => {
    const n = Number(value)
    if (!Number.isFinite(n)) return '—'
    return new Intl.NumberFormat('fr-FR').format(n) + ' %'
  }

  /** Date as "vendredi 12 mars 2026". */
  const formatDateLong = (iso: string | Date | null | undefined): string => {
    if (!iso) return ''
    const d = iso instanceof Date ? iso : new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  /** Date as "12 mars 2026". */
  const formatDate = (iso: string | Date | null | undefined): string => {
    if (!iso) return ''
    const d = iso instanceof Date ? iso : new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  /** Date as "12 mars" (sans année). */
  const formatDateShort = (iso: string | Date | null | undefined): string => {
    if (!iso) return ''
    const d = iso instanceof Date ? iso : new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  }

  /** Time as "20h30". */
  const formatTime = (iso: string | Date | null | undefined): string => {
    if (!iso) return ''
    const d = iso instanceof Date ? iso : new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return d.getHours().toString().padStart(2, '0')
      + 'h'
      + d.getMinutes().toString().padStart(2, '0')
  }

  /** Date + time as "12 mars 2026, 20h30". */
  const formatDateTime = (iso: string | Date | null | undefined): string => {
    if (!iso) return ''
    const d = iso instanceof Date ? iso : new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    return formatDate(d) + ', ' + formatTime(d)
  }

  /**
   * Pluralize in French (singular for 0 and 1, plural for ≥2).
   * `plural(0, 'jour')` → "0 jour" — NOT "0 jours" (French convention).
   * `plural(3, 'enfant', 'enfants')` → "3 enfants".
   */
  const plural = (count: number, singular: string, pluralForm?: string): string => {
    const word = count >= 2 ? (pluralForm ?? singular + 's') : singular
    return `${count} ${word}`
  }

  /**
   * Format a number with thousand separators (FR locale, espace insécable).
   * Use case : afficher `1 000 000` au lieu de `1000000` pendant la saisie.
   * Renvoie une string vide pour des valeurs invalides (au lieu de "NaN").
   *
   * Usage avec v-model :
   *   <input :value="formatNumberInput(amount)" @input="amount = parseNumberInput($event.target.value)" />
   */
  const formatNumberInput = (value: number | string | null | undefined): string => {
    if (value === null || value === undefined || value === '') return ''
    const digits = String(value).replace(/\D/g, '')
    if (digits === '') return ''
    return new Intl.NumberFormat('fr-FR').format(Number(digits))
  }

  /** Inverse de formatNumberInput — extrait les digits seuls. */
  const parseNumberInput = (formatted: string): number | null => {
    const digits = String(formatted ?? '').replace(/\D/g, '')
    if (digits === '') return null
    const n = Number(digits)
    return Number.isFinite(n) ? n : null
  }

  return {
    formatPrice,
    formatAmount,
    formatNumber,
    formatPercent,
    formatDateLong,
    formatDate,
    formatDateShort,
    formatTime,
    formatDateTime,
    plural,
    formatNumberInput,
    parseNumberInput,
  }
}
