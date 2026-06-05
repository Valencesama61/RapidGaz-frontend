'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import apiClient from '@/lib/axios'
import { Flame, Loader2, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

interface FormState {
  displayname: string
  email: string
  phone: string
  password: string
}

export default function RegisterPage() {
  const router = useRouter()

  const [form, setForm] = useState<FormState>({
    displayname: '',
    email: '',
    phone: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const set = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await apiClient.post('/api/v1/auth/register', form)
      setSuccess(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: unknown) {
      const axiosError = err as { response?: { status?: number; data?: { message?: string } } }
      const status = axiosError.response?.status
      const message = axiosError.response?.data?.message

      if (status === 409) {
        setError('Un compte existe déjà avec cet email.')
      } else if (message) {
        setError(message)
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-soft border border-border/50 p-8 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-full">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-foreground">Compte créé !</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Redirection vers la connexion…
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm space-y-6">

      {/* Logo */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-orange-500 rounded-2xl shadow-orange-lg mb-2">
          <Flame className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground tracking-tight">Créer un compte</h1>
        <p className="text-sm text-muted-foreground font-medium">Inscrivez-vous en tant que vendeur</p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-3xl shadow-soft border border-border/50 p-6 space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Nom commercial */}
          <div className="space-y-1.5">
            <Label htmlFor="displayname" className="field-label">Nom commercial</Label>
            <Input
              id="displayname"
              type="text"
              autoComplete="organization"
              placeholder="Ex : Gaz Express Akpakpa"
              value={form.displayname}
              onChange={set('displayname')}
              required
              minLength={3}
              maxLength={50}
              className="h-13 rounded-xl border-border bg-muted/50 text-sm font-medium
                         placeholder:text-muted-foreground/60
                         focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:border-orange-400"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="field-label">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="votre@email.com"
              value={form.email}
              onChange={set('email')}
              required
              className="h-13 rounded-xl border-border bg-muted/50 text-sm font-medium
                         placeholder:text-muted-foreground/60
                         focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:border-orange-400"
            />
          </div>

          {/* Téléphone */}
          <div className="space-y-1.5">
            <Label htmlFor="phone" className="field-label">Téléphone</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="Ex : 0022967000000"
              value={form.phone}
              onChange={set('phone')}
              required
              minLength={8}
              maxLength={12}
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
                autoComplete="new-password"
                placeholder="6 caractères minimum"
                value={form.password}
                onChange={set('password')}
                required
                minLength={6}
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
              <><Loader2 className="h-5 w-5 animate-spin" />Création du compte…</>
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>

        {/* Lien connexion */}
        <p className="text-center text-sm text-muted-foreground">
          Déjà inscrit ?{' '}
          <Link href="/login" className="font-semibold text-orange-500 hover:text-orange-600 transition-colors">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
