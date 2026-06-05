'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/authStore'
import { getRoleFromToken } from '@/lib/auth'
import apiClient from '@/lib/axios'
import { Role, User, LoginResponse } from '@/types'
import { Flame, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const login = useAuthStore((s) => s.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    let accessToken: string | null = null
    let rawData: LoginResponse | null = null

    // 1. Essai vendeur
    try {
      const res = await apiClient.post<LoginResponse>('/api/v1/auth/login', { email, password })
      accessToken = res.data.accessToken
      rawData = res.data
    } catch (sellerErr: unknown) {
      const sellerStatus = (sellerErr as { response?: { status?: number } }).response?.status

      // Compte suspendu côté vendeur - inutile d'essayer admin
      if (sellerStatus === 423) {
        setError('Votre compte est suspendu. Contactez un administrateur.')
        setLoading(false)
        return
      }

      // 2. Essai admin si l'erreur est 401/403
      if (sellerStatus === 401 || sellerStatus === 403) {
        try {
          const res = await apiClient.post<LoginResponse>('/api/admin/auth/login', { email, password })
          accessToken = res.data.accessToken
          rawData = res.data
        } catch {
          setError('Identifiants incorrects. Vérifiez votre email et mot de passe.')
          setLoading(false)
          return
        }
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.')
        setLoading(false)
        return
      }
    }

    if (!accessToken || !rawData) {
      setError('Réponse invalide du serveur.')
      setLoading(false)
      return
    }

    // Dériver le rôle depuis le JWT (vendeur : type='seller', admin : claim role)
    const role: Role = (getRoleFromToken(accessToken) ?? 'SELLER') as Role

    const user: User = {
      id: 0,
      email: rawData.name ? email : email,
      name: rawData.name ?? '',
      role,
    }

    login(accessToken, user, role)

    if (role === 'SELLER') {
      router.push('/seller/dashboard')
    } else {
      router.push('/admin/dashboard')
    }

    setLoading(false)
  }

  return (
    <div className="w-full max-w-sm space-y-6">

      {/* Logo */}
      <div className="text-center space-y-1">
        <Link href="/">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-500 rounded-2xl shadow-orange-lg mb-2">
            <Flame className="h-7 w-7 text-white" />
          </div>
        </Link>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">RapidGaz</h1>
        <p className="text-sm text-muted-foreground font-medium">Connectez-vous à votre espace</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-soft border border-border/50 p-6 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="field-label">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-13 rounded-xl border-border bg-muted/50 text-sm font-medium
                         placeholder:text-muted-foreground/60
                         focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:border-orange-400"
            />
          </div>

          {/* Mot de passe */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="field-label">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-13 rounded-xl border-border bg-muted/50 text-sm font-medium pr-11
                           placeholder:text-muted-foreground/60
                           focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:border-orange-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground
                           hover:text-foreground transition-colors p-0.5"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 px-3.5 py-3 bg-red-50 border border-red-100
                            rounded-xl text-sm text-red-600 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-13 bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                       text-white font-bold rounded-xl shadow-orange transition-all duration-150
                       flex items-center justify-center gap-2 text-base disabled:opacity-70"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin" />Connexion…</>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* Lien inscription */}
        <p className="text-center text-sm text-muted-foreground">
          Pas encore de compte ?{' '}
          <Link href="/register" className="font-semibold text-orange-500 hover:text-orange-600 transition-colors">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </div>
  )
}
