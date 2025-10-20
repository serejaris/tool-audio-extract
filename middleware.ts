import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Optional Basic Auth. If env vars are not set, auth is disabled.
const USER = process.env.BASIC_AUTH_USER
const PASS = process.env.BASIC_AUTH_PASS

export function middleware(req: NextRequest) {
  if (!USER || !PASS) return NextResponse.next()

  const header = req.headers.get('authorization') || ''
  const [scheme, encoded] = header.split(' ')
  if (scheme !== 'Basic' || !encoded) {
    return new Response('Auth required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
    })
  }
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8')
    const [u, p] = decoded.split(':')
    if (u === USER && p === PASS) return NextResponse.next()
  } catch {}
  return new Response('Unauthorized', { status: 401 })
}

export const config = {
  matcher: ['/((?!_next|favicon.ico).*)'],
}

