import { JSDOM } from 'jsdom'
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
import type { DlsiteApiResponse } from './types'
import { buildProductUrl, ensureLocaleUrl, normalizeDlsiteCode } from './utils'

const createRequestInit = (): RequestInit => ({
  headers: {
    ...REQUEST_HEADERS,
    Cookie: ADULT_COOKIE
  },
  redirect: 'follow' as RequestRedirect,
  cache: 'no-store'
})

const fetchDocument = async (url: string): Promise<Document | null> => {
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
  const dom = new JSDOM(html)
  return dom.window.document
}

export const fetchDlsiteData = async (
  code: string
): Promise<DlsiteApiResponse> => {
  const rjCode = normalizeDlsiteCode(code)
  const urlCn = buildProductUrl(rjCode, DL_SUPPORTED_LOCALES.cn)
  const docCn = await fetchDocument(urlCn)

  if (!docCn) {
    throw new Error('DLSITE_PRODUCT_NOT_FOUND')
  }

  const titleDefault = extractTitle(docCn)
  const releaseDate = extractReleaseDate(docCn)
  const tags = extractTags(docCn)
  const circleInfo = extractCircle(docCn)
  const editionLinks = extractEditionLinks(docCn)

  const jpUrl = ensureLocaleUrl(
    editionLinks.jp ?? undefined,
    DL_SUPPORTED_LOCALES.jp,
    rjCode
  )
  const enUrl = ensureLocaleUrl(
    editionLinks.en ?? undefined,
    DL_SUPPORTED_LOCALES.en,
    rjCode
  )

  const [docJp, docEn] = await Promise.all([
    fetchDocument(jpUrl),
    fetchDocument(enUrl)
  ])

  const result: DlsiteApiResponse = {
    rj_code: rjCode,
    title_default: titleDefault || rjCode,
    title_jp: extractTitle(docJp) || undefined,
    title_en: extractTitle(docEn) || undefined,
    release_date: releaseDate,
    tags,
    circle_name: circleInfo.name?.trim() || undefined,
    circle_link: circleInfo.link
  }

  return result
}

export type { DlsiteApiResponse } from './types'
