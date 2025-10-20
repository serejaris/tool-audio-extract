import { spawn } from 'node:child_process'
import { promises as fs } from 'node:fs'
import path from 'node:path'

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts })
    let stderr = ''
    p.stderr.on('data', (d) => (stderr += d.toString()))
    p.on('error', reject)
    p.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(stderr || `${cmd} exited ${code}`))
    })
  })
}

async function assert(cond, msg) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`)
}

async function makeSampleVideo(outPath) {
  // 1 second black video with silent audio
  const args = [
    '-hide_banner',
    '-y',
    '-f', 'lavfi', '-i', 'color=c=black:s=320x240:d=1',
    '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
    '-shortest',
    '-pix_fmt', 'yuv420p',
    '-c:v', 'libx264',
    '-c:a', 'aac', '-b:a', '128k',
    outPath,
  ]
  await run('ffmpeg', args)
}

async function main() {
  // Check ffmpeg availability
  await run('ffmpeg', ['-version'])

  const tmpDir = path.join(process.cwd(), 'tests', '.tmp')
  await fs.mkdir(tmpDir, { recursive: true })
  const inputPath = path.join(tmpDir, 'sample.mp4')
  await makeSampleVideo(inputPath)
  const input = await fs.readFile(inputPath)

  // Import compiled route from Next build output
  const mod = await import(path.join(process.cwd(), '.next/server/app/api/extract/route.js'))
  const POST = mod.default?.routeModule?.userland?.POST
  await assert(typeof POST === 'function', 'route POST export exists')

  const url = 'http://localhost/api/extract?format=m4a&filename=sample.mp4'
  const req = new Request(url, { method: 'POST', body: input, headers: { 'content-type': 'video/mp4' } })
  const res = await POST(req)
  await assert(res.ok, `response ok (status ${res.status})`)
  const ct = res.headers.get('content-type') || ''
  await assert(ct.includes('audio/'), `content-type is audio/* (got ${ct})`)
  const buf = Buffer.from(await res.arrayBuffer())
  await assert(buf.length > 0, 'received non-empty audio payload')

  // Optionally write to disk for manual inspection
  const outPath = path.join(tmpDir, 'out.m4a')
  await fs.writeFile(outPath, buf)

  console.log('Test passed: basic extraction works')
}

main().catch((err) => {
  console.error(err?.stack || err?.message || String(err))
  process.exit(1)
})
