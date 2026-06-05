'use client'

import { create } from 'zustand'
import Cookies from 'js-cookie'
import { AuthState, User, Role } from '@/types'
import { decodeToken, getRoleFromToken } from '@/lib/auth'

const TOKEN_KEY = 'rapidgaz_token'
const NAME_KEY  = 'rapidgaz_name'

function hydrateFromCookie(): { token: string | null; user: User | null; role: Role | null } {
  if (typeof window === 'undefined') {
    return { token: null, user: null, role: null }
  }
  const token = Cookies.get(TOKEN_KEY) ?? null
  if (!token) return { token: null, user: null, role: null }

  const payload = decodeToken(token)
  if (!payload) return { token: null, user: null, role: null }

  const role = getRoleFromToken(token)

  const savedName = Cookies.get(NAME_KEY) ?? ''

  const user: User = {
    id: 0,
    email: payload.email ?? payload.sub ?? '',
    name: savedName || (payload.name ?? ''),
    role: role ?? 'SELLER',
  }

  return { token, user, role }
}

const initial = hydrateFromCookie()

export const useAuthStore = create<AuthState>()((set) => ({
  token: initial.token,
  user:  initial.user,
  role:  initial.role,

  login: (token: string, user: User, role: Role) => {
    Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: 'strict' })
    if (user.name) {
      Cookies.set(NAME_KEY, user.name, { expires: 7, sameSite: 'strict' })
    }
    set({ token, user, role })
  },

  logout: () => {
    Cookies.remove(TOKEN_KEY)
    Cookies.remove(NAME_KEY)
    set({ token: null, user: null, role: null })
  },

  rehydrate: () => {
    const { token, user, role } = hydrateFromCookie()
    set({ token, user, role })
  },
}))
