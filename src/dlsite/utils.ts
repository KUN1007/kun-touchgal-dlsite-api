import { DLSITE_BASE_URL, DLSITE_HOST, SUPPORTED_PREFIXES } from './constants'
import type { DlsiteLocale } from './types'

export const normalizeDlsiteCode = (input: string): string => {
  const trimmed = input.trim().toUpperCase()
  if (!trimmed) {
    throw new Error('DLSITE_CODE_EMPTY')
  }

  if (SUPPORTED_PREFIXES.some((prefix) => trimmed.startsWith(prefix))) {
    return trimmed
  }

  return `RJ${trimmed}`
}

export const buildProductUrl = (code: string, locale: DlsiteLocale) =>
  `${DLSITE_BASE_URL}/${code}.html?locale=${locale}`

export const resolveDlsiteLink = (
  href: string | null | undefined
): string | undefined => {
  if (!href) return undefined
  if (href.startsWith('//')) return `https:${href}`
  if (href.startsWith('/')) return `${DLSITE_HOST}${href}`
  return href
}

export const ensureLocaleUrl = (
  link: string | null | undefined,
  locale: DlsiteLocale,
  fallbackCode: string
): string => {
  const fallback = buildProductUrl(fallbackCode, locale)
  const resolved = resolveDlsiteLink(link)
  if (!resolved) return fallback

  try {
    const url = new URL(resolved)
    url.searchParams.set('locale', locale)
    return url.toString()
  } catch {
    return fallback
  }
}
