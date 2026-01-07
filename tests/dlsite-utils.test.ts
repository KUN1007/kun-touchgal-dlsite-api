import { expect, test } from '@rstest/core'
import { DL_SUPPORTED_LOCALES } from '../src/dlsite/constants'
import {
  cleanDlsiteTitle,
  ensureLocaleUrl,
  getCandidateSites
} from '../src/dlsite/utils'

test('cleanDlsiteTitle removes decorative brackets', () => {
  expect(
    cleanDlsiteTitle('【2026限定】[预售] 美少女異聞 ～雪おんな～')
  ).toBe('美少女異聞 ～雪おんな～')
})

test('getCandidateSites prioritises RJ then AI domains', () => {
  expect(getCandidateSites('RJ012345')).toEqual(['maniax', 'ai', 'aix'])
  expect(getCandidateSites('VJ01002419')).toEqual(['pro'])
})

test('ensureLocaleUrl uses the correct product base per site', () => {
  const url = ensureLocaleUrl(
    undefined,
    DL_SUPPORTED_LOCALES.jp,
    'RJ01527759',
    'ai'
  )
  expect(url).toMatch(
    /^https:\/\/www\.dlsite\.com\/ai\/work\/=\/product_id\/RJ01527759/
  )
})
