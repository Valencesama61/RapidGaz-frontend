import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const TOKEN_KEY = 'rapidgaz_token'

// Décode le payload JWT sans vérifier la signature (Edge runtime)
function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(base64))
  } catch {
    return null
  }
}

function isExpired(payload: Record<string, unknown>): boolean {
  const exp = payload.exp as number | undefined
  if (!exp) return true
  return exp * 1000 < Date.now()
}

function dashboardFor(payload: Record<string, unknown>): string {
  return payload.type === 'admin' ? '/admin/dashboard' : '/seller/dashboard'
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const rawToken = request.cookies.get(TOKEN_KEY)?.value

  // Décode et valide le token
  let payload: Record<string, unknown> | null = null
  if (rawToken) {
    const decoded = decodePayload(rawToken)
    if (decoded && !isExpired(decoded)) {
      payload = decoded
    }
  }

  const hasValidToken = payload !== null
  const isProtected = pathname.startsWith('/seller') || pathname.startsWith('/admin')
  const isAuthPage  = pathname === '/login' || pathname === '/register'
  const isHomePage  = pathname === '/'

  // 1. Route protégée sans token valide → login (+ supprime le cookie périmé)
  if (isProtected && !hasValidToken) {
    const url = new URL('/login', request.url)
    url.searchParams.set('from', pathname)
    const res = NextResponse.redirect(url)
    if (rawToken) res.cookies.delete(TOKEN_KEY)
    return res
  }

  // 2. Page d'accueil ou page de connexion avec token valide → dashboard
  if ((isHomePage || isAuthPage) && hasValidToken) {
    return NextResponse.redirect(new URL(dashboardFor(payload!), request.url))
  }

  // 3. Page d'accueil avec token expiré → login (+ supprime le cookie)
  if (isHomePage && rawToken && !hasValidToken) {
    const res = NextResponse.redirect(new URL('/login', request.url))
    res.cookies.delete(TOKEN_KEY)
    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/login', '/register', '/seller/:path*', '/admin/:path*'],
}
