'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import apiClient from '@/lib/axios'
import { Seller } from '@/types'
import { useAuthStore } from '@/stores/authStore'
import { Loader2, AlertCircle, CheckCircle2, User, Lock, LogOut } from 'lucide-react'

function Feedback({ type, message }: { type: 'error' | 'success'; message: string }) {
  const styles = type === 'error'
    ? 'bg-red-50 border-red-100 text-red-600'
    : 'bg-emerald-50 border-emerald-100 text-emerald-700'
  const Icon = type === 'error' ? AlertCircle : CheckCircle2
  return (
    <div className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl border text-sm font-medium ${styles}`}>
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      {message}
    </div>
  )
}

function SectionHeader({ icon: Icon, title, subtitle }: {
  icon: React.ElementType; title: string; subtitle?: string
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
        <Icon className="h-4.5 w-4.5 text-orange-500" />
      </div>
      <div>
        <p className="text-sm font-bold text-foreground">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  )
}

export default function SellerProfilePage() {
  const router = useRouter()
  const logout = useAuthStore((s) => s.logout)
  const [seller, setSeller] = useState<Seller | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPwd, setChangingPwd] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwdError, setPwdError] = useState<string | null>(null)
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<Seller>('/api/v1/seller/me')
      setSeller(res.data)
      setDisplayName(res.data.displayName)
      setPhone(res.data.phone)
    } catch {
      setError('Impossible de charger le profil.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await apiClient.put<Seller>('/api/v1/seller/me', { displayName, phone })
      setSeller(res.data)
      setSuccess('Profil mis à jour.')
    } catch {
      setError('Impossible de mettre à jour le profil.')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangingPwd(true)
    setPwdError(null)
    setPwdSuccess(null)
    try {
      await apiClient.put('/api/v1/seller/me/password', { oldPassword, newPassword })
      setPwdSuccess('Mot de passe modifié.')
      setOldPassword('')
      setNewPassword('')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status
      setPwdError(status === 400 ? 'Ancien mot de passe incorrect.' : 'Impossible de modifier le mot de passe.')
    } finally {
      setChangingPwd(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm text-muted-foreground font-medium">Chargement…</p>
      </div>
    )
  }

  const inputCls = `h-13 rounded-xl border-border bg-muted/50 text-sm font-medium
                    focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:border-orange-400`

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Vendeur</p>
        <h1 className="text-2xl font-extrabold text-foreground">Mon profil</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{seller?.email}</p>
      </div>

      {/* Informations */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-card p-5">
        <SectionHeader icon={User} title="Informations" subtitle="Nom et téléphone affichés aux clients" />
        <form onSubmit={handleProfileSave} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="displayName" className="field-label">Nom commercial</label>
            <Input id="displayName" type="text" value={displayName}
              onChange={(e) => setDisplayName(e.target.value)} className={inputCls} required />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="phone" className="field-label">Téléphone</label>
            <Input id="phone" type="tel" inputMode="tel" value={phone}
              onChange={(e) => setPhone(e.target.value)} className={inputCls}
              placeholder="+229 XX XX XX XX" />
          </div>

          {error   && <Feedback type="error"   message={error} />}
          {success && <Feedback type="success" message={success} />}

          <button
            type="submit"
            disabled={saving}
            className="w-full h-13 bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                       text-white font-bold rounded-xl shadow-orange transition-all duration-150
                       flex items-center justify-center gap-2 text-sm disabled:opacity-70"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Enregistrement…</> : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>

      {/* Mot de passe */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-card p-5">
        <SectionHeader icon={Lock} title="Mot de passe" subtitle="Minimum 6 caractères" />
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="oldPassword" className="field-label">Mot de passe actuel</label>
            <Input id="oldPassword" type="password" autoComplete="current-password"
              value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
              className={inputCls} required />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="newPassword" className="field-label">Nouveau mot de passe</label>
            <Input id="newPassword" type="password" autoComplete="new-password"
              value={newPassword} onChange={(e) => setNewPassword(e.target.value)
              } className={inputCls} required minLength={6} />
          </div>

          {pwdError   && <Feedback type="error"   message={pwdError} />}
          {pwdSuccess && <Feedback type="success" message={pwdSuccess} />}

          <button
            type="submit"
            disabled={changingPwd}
            className="w-full h-13 border border-orange-300 text-orange-600 font-bold rounded-xl
                       hover:bg-orange-50 active:bg-orange-100 transition-colors
                       flex items-center justify-center gap-2 text-sm disabled:opacity-70"
          >
            {changingPwd ? <><Loader2 className="h-4 w-4 animate-spin" />Modification…</> : 'Changer le mot de passe'}
          </button>
        </form>
      </div>

      {/* Déconnexion — visible uniquement sur mobile (sidebar gère le desktop) */}
      <div className="md:hidden">
        <button
          onClick={() => { logout(); router.push('/') }}
          className="w-full h-13 flex items-center justify-center gap-2
                     border border-red-200 text-red-500 font-semibold text-sm rounded-2xl
                     hover:bg-red-50 active:bg-red-100 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  )
}
