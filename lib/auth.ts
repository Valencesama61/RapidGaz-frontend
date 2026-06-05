import { Role } from '@/types'

interface JWTPayload {
  sub?: string
  email?: string
  name?: string
  role?: Role
  type?: string   // 'seller' | 'admin'
  exp?: number
  iat?: number
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    return JSON.parse(atob(padded)) as JWTPayload
  } catch {
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token)
  if (!payload?.exp) return true
  return Date.now() / 1000 > payload.exp
}

// Vendeur : type='seller', pas de claim role
// Admin   : type='admin',  claim role='ADMIN'|'SUPER_ADMIN'
export function getRoleFromToken(token: string): Role | null {
  const payload = decodeToken(token)
  if (!payload) return null
  if (payload.role) return payload.role
  if (payload.type === 'seller') return 'SELLER'
  return null
}
