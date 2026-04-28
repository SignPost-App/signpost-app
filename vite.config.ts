import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { randomBytes } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

// TODO: This feedback plugin is a temporary prototype mechanism. It writes
// feedback to ./feedback/*.txt files and works only during `npm run dev`.
// Replace with a proper API endpoint when the app has a backend.

const FEEDBACK_MAX_CHARS = 10_000
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000
const RATE_LIMIT_MAX = 50 // generous for local dev testing

const ipTimestamps = new Map<string, number[]>()

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.setEncoding('utf8')
    req.on('data', (chunk: string) => {
      data += chunk
      if (data.length > FEEDBACK_MAX_CHARS + 512) req.destroy(new Error('too_large'))
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

async function handleFeedback(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.writeHead(405).end()
    return
  }

  const ip = req.socket?.remoteAddress ?? 'unknown'
  const now = Date.now()
  const recent = (ipTimestamps.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (recent.length >= RATE_LIMIT_MAX) {
    res.writeHead(429, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'rate_limited' }))
    return
  }

  let body: string
  try {
    body = await readBody(req)
  } catch {
    res.writeHead(400).end()
    return
  }

  let text: string
  try {
    const parsed = JSON.parse(body) as Record<string, unknown>
    text = String(parsed.text ?? '')
  } catch {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'invalid_json' }))
    return
  }

  // Strip null bytes and non-printable control chars; preserve newlines/tabs
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').slice(0, FEEDBACK_MAX_CHARS)

  if (!text.trim()) {
    res.writeHead(400, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'empty' }))
    return
  }

  const dir = join(process.cwd(), 'feedback')
  await mkdir(dir, { recursive: true })

  const ts = new Date().toISOString().replace(/[:.]/g, '-')
  const id = randomBytes(4).toString('hex')
  const content = [`Timestamp: ${new Date().toISOString()}`, `IP: ${ip}`, '', text, ''].join('\n')
  await writeFile(join(dir, `${ts}_${id}.txt`), content, 'utf8')

  // Only increment rate limit counter after a successful write
  recent.push(now)
  ipTimestamps.set(ip, recent)

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: true }))
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'feedback-api',
      configureServer(server) {
        server.middlewares.use(
          '/api/feedback',
          (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => {
            handleFeedback(req, res).catch((err) => {
              console.error('[feedback-api] Error handling feedback submission:', err)
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'application/json' })
                res.end(JSON.stringify({ error: 'internal' }))
              }
            })
          },
        )
      },
    },
  ],
})
