// Query params we never want to bounce around in a `?redirect=` URL — they
// either grant access (token, signature) or carry payment context that
// shouldn't end up in browser history or referer headers.
const SENSITIVE_QUERY_KEYS = ['token', 'signature', 'expires', 'payment_token', 'authorization_code']

/**
 * Strip sensitive query params from a URL path so we don't propagate
 * tokens/signatures through `?redirect=...` chains (referer leaks, browser
 * history, server logs).
 */
const stripSensitiveQuery = (fullPath: string): string => {
  const queryStart = fullPath.indexOf('?')
  if (queryStart === -1) return fullPath
  const path = fullPath.slice(0, queryStart)
  const search = new URLSearchParams(fullPath.slice(queryStart + 1))
  for (const key of SENSITIVE_QUERY_KEYS) search.delete(key)
  const cleaned = search.toString()
  return cleaned ? `${path}?${cleaned}` : path
}

export const useSafeRedirect = () => {
  const isSafePath = (path: unknown): path is string => {
    if (typeof path !== 'string' || path.length === 0) return false
    if (!path.startsWith('/')) return false
    if (path.startsWith('//') || path.startsWith('/\\')) return false
    if (path.includes('://')) return false
    if (path.startsWith('/auth/')) return false
    return true
  }

  const getSafeRedirect = (raw: unknown, fallback = '/dashboard'): string => {
    const value = Array.isArray(raw) ? raw[0] : raw
    return isSafePath(value) ? value : fallback
  }

  return { getSafeRedirect, isSafePath, stripSensitiveQuery }
}
