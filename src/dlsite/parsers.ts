import { resolveDlsiteLink } from './utils'
import type { CircleInfo, DlsiteEditionLinks } from './types'

const getText = (element?: Element | null) =>
  element?.textContent?.replace(/\s+/g, ' ').trim() ?? ''

const RELEASE_LABEL_PATTERN =
  /販売日|発売日|贩卖日|贩售日|发售日|公開日|公開開始日|release/i

const MAKER_LABEL_PATTERN = /Circle|サークル|社团|社團|メーカー|社名/i

const DATE_PATTERN = /(\d{4})[^\d]?(\d{1,2})[^\d]?(\d{1,2})/

const matchDate = (text: string): string | undefined => {
  const clean = text.replace(/[年月日]/g, ' ').replace(/[./]/g, '-')
  const match = clean.match(DATE_PATTERN)
  if (!match) return undefined

  const [, year, month, day] = match
  if (!year || !month || !day) return undefined

  const pad = (value: string) => value.padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}`
}

const findCellByHeader = (doc: Document, pattern: RegExp) => {
  const headers = Array.from(doc.querySelectorAll('th'))
  for (const th of headers) {
    if (pattern.test(getText(th))) {
      return th.nextElementSibling
    }
  }
  return null
}

export const extractTitle = (doc: Document | null): string => {
  if (!doc) return ''
  const title = doc.querySelector('h1#work_name')
  return getText(title)
}

export const extractReleaseDate = (
  doc: Document | null
): string | undefined => {
  if (!doc) return undefined
  const candidateTexts: string[] = []

  const releaseCell = findCellByHeader(doc, RELEASE_LABEL_PATTERN)
  if (releaseCell) {
    candidateTexts.push(getText(releaseCell))
  }

  const outline = doc.querySelector('#work_outline') ?? doc
  const anchors = Array.from(outline.querySelectorAll('a'))
  for (const anchor of anchors) {
    candidateTexts.push(getText(anchor))
  }

  for (const text of candidateTexts) {
    const parsed = matchDate(text)
    if (parsed) {
      return parsed
    }
  }

  return undefined
}

export const extractTags = (doc: Document | null): string | undefined => {
  if (!doc) return undefined
  const tagContainer = doc.querySelector('div.main_genre')
  if (!tagContainer) return undefined

  const tags = new Set<string>()
  for (const anchor of Array.from(tagContainer.querySelectorAll('a'))) {
    const tagText = getText(anchor)
    if (tagText) {
      tags.add(tagText)
    }
  }

  return tags.size ? Array.from(tags).join(',') : undefined
}

export const extractCircle = (doc: Document | null): CircleInfo => {
  if (!doc) return { name: '' }

  const makerElement =
    doc.querySelector('#work_maker') ??
    findCellByHeader(doc, MAKER_LABEL_PATTERN)

  if (!makerElement) {
    return { name: '' }
  }

  const anchor = makerElement.querySelector('a')
  const name = anchor ? getText(anchor) : getText(makerElement)
  const link = resolveDlsiteLink(anchor?.getAttribute('href') ?? undefined)

  return { name, link }
}

const isJapaneseLink = (text: string, url: string) => {
  const lower = text.toLowerCase()
  return (
    lower.includes('jp') ||
    lower.includes('日本') ||
    lower.includes('日本語') ||
    url.includes('locale=ja')
  )
}

const isEnglishLink = (text: string, url: string) => {
  const lower = text.toLowerCase()
  return (
    lower.includes('english') ||
    lower.includes('en') ||
    lower.includes('英语') ||
    lower.includes('英語') ||
    url.includes('locale=en')
  )
}

export const extractEditionLinks = (
  doc: Document | null
): DlsiteEditionLinks => {
  const editions: DlsiteEditionLinks = {}
  if (!doc) return editions

  const container =
    doc.querySelector('div.work_edition_linklist') ??
    doc.querySelector('div[class*="work_edition_linklist"]')

  if (!container) {
    return editions
  }

  for (const anchor of Array.from(container.querySelectorAll('a'))) {
    const text = getText(anchor)
    const link = resolveDlsiteLink(anchor.getAttribute('href'))
    if (!link || !text) continue

    if (!editions.jp && isJapaneseLink(text, link)) {
      editions.jp = link
    } else if (!editions.en && isEnglishLink(text, link)) {
      editions.en = link
    }
  }

  return editions
}
