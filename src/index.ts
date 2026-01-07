import { createServer } from 'node:http'
import { fetchDlsiteData } from './dlsite'

const DEFAULT_PORT = Number.parseInt(process.env.PORT ?? '8787', 10)
const ALLOWED_CORS_HOSTS = new Set(['127.0.0.1', 'touchgal.top', 'touchgal.us'])

type JsonValue = Record<string, unknown>

const resolveCorsOrigin = (
  req: import('node:http').IncomingMessage
): string | undefined => {
  const origin = req.headers.origin
  if (!origin) return undefined
  try {
    const hostname = new URL(origin).hostname.toLowerCase()
    return ALLOWED_CORS_HOSTS.has(hostname) ? origin : undefined
  } catch {
    return undefined
  }
}

const applyCorsHeaders = (
  res: import('node:http').ServerResponse,
  origin?: string
) => {
  if (!origin) return
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

const sendJson = (
  res: import('node:http').ServerResponse,
  status: number,
  payload: JsonValue,
  origin?: string
) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  applyCorsHeaders(res, origin)
  res.end(JSON.stringify(payload))
}

const getRequestUrl = (req: import('node:http').IncomingMessage): URL => {
  const host = req.headers.host ?? `127.0.0.1:${DEFAULT_PORT}`
  return new URL(req.url ?? '/', `http://${host}`)
}

const server = createServer(async (req, res) => {
  if (!req.url) {
    sendJson(res, 400, { error: 'INVALID_REQUEST' })
    return
  }

  const corsOrigin = resolveCorsOrigin(req)

  if (req.method === 'OPTIONS') {
    if (!corsOrigin) {
      sendJson(res, 403, { error: 'CORS_ORIGIN_FORBIDDEN' })
      return
    }
    applyCorsHeaders(res, corsOrigin)
    res.statusCode = 204
    res.end()
    return
  }

  const url = getRequestUrl(req)

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { status: 'ok' }, corsOrigin)
    return
  }

  if (req.method === 'GET' && url.pathname === '/api/dlsite') {
    const code = url.searchParams.get('code')
    if (!code) {
      sendJson(res, 400, { error: 'MISSING_CODE' }, corsOrigin)
      return
    }

    try {
      const data = await fetchDlsiteData(code)
      sendJson(res, 200, { data }, corsOrigin)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'DLSITE_API_ERROR_UNKNOWN'
      const status =
        message === 'DLSITE_PRODUCT_NOT_FOUND'
          ? 404
          : message.startsWith('DLsite request failed')
            ? 502
            : 500
      sendJson(res, status, { error: message }, corsOrigin)
    }
    return
  }

  sendJson(res, 404, { error: 'NOT_FOUND' }, corsOrigin)
})

server.listen(DEFAULT_PORT, () => {
  console.log(`DLsite API server listening on http://127.0.0.1:${DEFAULT_PORT}`)
})

export type { JsonValue }
