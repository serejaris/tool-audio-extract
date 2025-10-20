import { promises as fs } from 'node:fs'
import path from 'node:path'

async function assert(cond, msg) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`)
}

async function main() {
  // Use the sample artifact produced by basic test, or generate a tiny buffer
  const tmpDir = path.join(process.cwd(), 'tests', '.tmp')
  await fs.mkdir(tmpDir, { recursive: true })
  const inputPath = path.join(tmpDir, 'sample.mp4')
  let input
  try {
    input = await fs.readFile(inputPath)
  } catch {
    // fall back to a tiny empty blob; route should 400
    input = Buffer.from([0])
  }

  const mod = await import(path.join(process.cwd(), '.next/server/app/api/extract/route.js'))
  const POST = mod.default?.routeModule?.userland?.POST
  await assert(typeof POST === 'function', 'route POST export exists')

  // Build multipart body using Undici FormData and File
  const fd = new FormData()
  const file = new File([input], 'sample.mp4', { type: 'video/mp4' })
  fd.append('file', file)
  fd.append('format', 'm4a')

  const url = 'http://localhost/api/extract'
  const req = new Request(url, { method: 'POST', body: fd })
  const res = await POST(req)

  await assert(res.ok, `multipart response ok (status ${res.status})`)
  const ct = res.headers.get('content-type') || ''
  await assert(ct.includes('audio/'), `multipart content-type is audio/* (got ${ct})`)
  const buf = Buffer.from(await res.arrayBuffer())
  await assert(buf.length > 0, 'multipart received non-empty audio payload')

  console.log('Test passed: multipart extraction works')
}

main().catch((err) => {
  console.error(err?.stack || err?.message || String(err))
  process.exit(1)
})

