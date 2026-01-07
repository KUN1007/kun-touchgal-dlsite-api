import { createServer } from 'node:http'
import { fetchDlsiteData } from './dlsite'

const DEFAULT_PORT = Number.parseInt(process.env.PORT ?? '8787', 10)

type JsonValue = Record<string, unknown>

const sendJson = (
  res: import('node:http').ServerResponse,
  status: number,
  payload: JsonValue
) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.end(JSON.stringify(payload))
}

const getRequestUrl = (req: import('node:http').IncomingMessage): URL => {
  const host = req.headers.host ?? `0.0.0.0:${DEFAULT_PORT}`
  return new URL(req.url ?? '/', `http://${host}`)
}

const server = createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: 'INVALID_REQUEST' })
    return
  }

  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true })
    return
  }

  const url = getRequestUrl(req)

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok' })
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/dlsite') {
    const code = url.searchParams.get('code')
    if (!code) {
      sendJson(res, 400, { error: 'MISSING_CODE' })
      return
    }

    try {
      const data = await fetchDlsiteData(code)
      sendJson(res, 200, { data })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'DLSITE_API_ERROR_UNKNOWN'
      const status =
        message === 'DLSITE_PRODUCT_NOT_FOUND'
          ? 404
          : message.startsWith('DLsite request failed')
            ? 502
            : 500
      sendJson(res, status, { error: message })
    }
    return
  }

  sendJson(res, 404, { error: 'NOT_FOUND' })
})

server.listen(DEFAULT_PORT, () => {
  console.log(`DLsite API server listening on http://localhost:${DEFAULT_PORT}`)
})

export type { JsonValue }
