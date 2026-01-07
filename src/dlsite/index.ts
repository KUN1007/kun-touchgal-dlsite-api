import { parseHTML } from 'linkedom'
import {
  DL_SUPPORTED_LOCALES,
  REQUEST_HEADERS,
  ADULT_COOKIE
} from './constants'
import {
  extractCircle,
  extractEditionLinks,
  extractReleaseDate,
  extractTags,
  extractTitle
} from './parsers'
import type { DlsiteApiResponse, DlsiteLocale, DlsiteSite } from './types'
import {
  buildProductUrl,
  cleanDlsiteTitle,
  detectSiteFromUrl,
  ensureLocaleUrl,
  getCandidateSites,
  normalizeDlsiteCode
} from './utils'

interface DocumentResult {
  document: Document
  site: DlsiteSite
  url: string
}

const createRequestInit = (): RequestInit => ({
  headers: {
    ...REQUEST_HEADERS,
    Cookie: ADULT_COOKIE
  },
  redirect: 'follow' as RequestRedirect,
  cache: 'no-store'
})

const parseHtmlDocument = (html: string): Document => parseHTML(html).document

const getLocaleFromUrl = (url: string): string | null => {
  try {
    return new URL(url).searchParams.get('locale')
  } catch {
    return null
  }
}

const requestDocument = async (
  url: string,
  fallbackSite: DlsiteSite
): Promise<DocumentResult | null> => {
  const response = await fetch(url, createRequestInit())
  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(
      `DLsite request failed: ${response.status} ${response.statusText}`
    )
  }

  const html = await response.text()
  const finalUrl = response.url || url
  const site = detectSiteFromUrl(finalUrl) ?? fallbackSite

  return {
    document: parseHtmlDocument(html),
    site,
    url: finalUrl
  }
}

const fetchSecondaryDocument = async (
  url: string,
  primary: DocumentResult
): Promise<Document | null> => {
  if (url === primary.url) {
    return primary.document
  }
  const doc = await requestDocument(url, primary.site)
  return doc?.document ?? null
}

const fetchDocumentForSite = async (
  code: string,
  locale: DlsiteLocale,
  site: DlsiteSite
): Promise<DocumentResult | null> => {
  let currentSite = site
  for (let hop = 0; hop < 3; hop += 1) {
    const requestUrl = buildProductUrl(code, locale, currentSite)
    const result = await requestDocument(requestUrl, currentSite)
    if (!result) {
      return null
    }
    const finalLocale = getLocaleFromUrl(result.url)
    if (result.site === currentSite && finalLocale === locale) {
      return result
    }
    currentSite = result.site
  }
  return null
}

export const fetchDlsiteData = async (
  code: string
): Promise<DlsiteApiResponse> => {
  const normalizedCode = normalizeDlsiteCode(code)
  const candidateSites = getCandidateSites(normalizedCode)

  let primaryDoc: DocumentResult | null = null
  for (const site of candidateSites) {
    primaryDoc = await fetchDocumentForSite(
      normalizedCode,
      DL_SUPPORTED_LOCALES.cn,
      site
    )
    if (primaryDoc) {
      break
    }
  }

  if (!primaryDoc) {
    throw new Error('DLSITE_PRODUCT_NOT_FOUND')
  }

  const docCn = primaryDoc.document
  const releaseDate = extractReleaseDate(docCn)
  const tags = extractTags(docCn)
  const circleInfo = extractCircle(docCn)
  const editionLinks = extractEditionLinks(docCn)

  const jpUrl = ensureLocaleUrl(
    editionLinks.jp ?? undefined,
    DL_SUPPORTED_LOCALES.jp,
    normalizedCode,
    primaryDoc.site
  )
  const enUrl = ensureLocaleUrl(
    editionLinks.en ?? undefined,
    DL_SUPPORTED_LOCALES.en,
    normalizedCode,
    primaryDoc.site
  )

  const [docJp, docEn] = await Promise.all([
    fetchSecondaryDocument(jpUrl, primaryDoc),
    fetchSecondaryDocument(enUrl, primaryDoc)
  ])

  const cleanTitle = (document: Document | null): string | undefined => {
    const raw = extractTitle(document)
    const cleaned = cleanDlsiteTitle(raw)
    return cleaned || undefined
  }

  const result: DlsiteApiResponse = {
    rj_code: normalizedCode,
    title_default: cleanDlsiteTitle(extractTitle(docCn)) || normalizedCode,
    title_jp: cleanTitle(docJp),
    title_en: cleanTitle(docEn),
    release_date: releaseDate,
    tags,
    circle_name: circleInfo.name?.trim() || undefined,
    circle_link: circleInfo.link
  }

  return result
}

export type { DlsiteApiResponse } from './types'
