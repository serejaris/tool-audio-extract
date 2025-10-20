import { checkFfmpeg } from '../../../lib/ffmpeg'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const res = await checkFfmpeg()
  if (res.ok) {
    return new Response(JSON.stringify({ ok: true, version: res.version }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  return new Response(JSON.stringify({ ok: false, error: res.error }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' },
  })
}
