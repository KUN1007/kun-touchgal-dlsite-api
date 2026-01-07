import { writeFileSync } from 'fs'

const html = await fetchPage(
  'https://www.dlsite.com/ai/work/=/product_id/RJ01341035.html/?locale=zh_CN'
)

if (html) {
  writeFileSync('./meta/page.html', html, 'utf8')
}

export async function fetchPage(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Cookie: 'adult_checked=1',
        'Accept-Language': 'zh-CN,zh;q=0.9'
      },
      redirect: 'follow'
    })

    if (res.status === 404) {
      return null
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    return await res.text()
  } catch (err) {
    console.error(`Error fetching ${url}:`, err)
    return null
  }
}
