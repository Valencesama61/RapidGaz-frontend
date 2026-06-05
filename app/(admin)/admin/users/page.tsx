'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/authStore'
import apiClient from '@/lib/axios'
import { AdminUser, PagedResponse } from '@/types'
import { Loader2, AlertCircle, CheckCircle2, ShieldCheck, Lock, Plus, Crown } from 'lucide-react'

function Feedback({ type, message }: { type: 'error' | 'success'; message: string }) {
  const Icon = type === 'error' ? AlertCircle : CheckCircle2
  return (
    <div className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl border text-sm font-medium
      ${type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      {message}
    </div>
  )
}

export default function AdminUsersPage() {
  const { role } = useAuthStore()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [newName, setNewName]         = useState('')
  const [newEmail, setNewEmail]       = useState('')
  const [newPassword, setNewPassword] = useState('')

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get<PagedResponse<AdminUser>>('/api/admin/users', {
        params: { page: 0, size: 100 },
      })
      setUsers(res.data.content)
    } catch {
      setError('Impossible de charger la liste des administrateurs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await apiClient.post<AdminUser>('/api/admin/users', {
        name: newName, email: newEmail, password: newPassword,
      })
      setUsers((prev) => [...prev, res.data])
      setSuccess(`Administrateur ${res.data.name} créé avec succès.`)
      setNewName(''); setNewEmail(''); setNewPassword('')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status
      setError(status === 409 ? 'Un compte avec cet email existe déjà.' : 'Impossible de créer l\'administrateur.')
    } finally {
      setCreating(false)
    }
  }

  if (role !== 'SUPER_ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-4 text-center">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
          <Lock className="h-7 w-7 text-muted-foreground" />
        </div>
        <div>
          <p className="font-bold text-foreground">Accès restreint</p>
          <p className="text-sm text-muted-foreground mt-1">Réservé au Super Administrateur.</p>
        </div>
      </div>
    )
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
    <div className="space-y-5 lg:grid lg:grid-cols-[1fr_340px] lg:gap-8 lg:items-start lg:space-y-0">

      {/* Liste des admins */}
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Admin</p>
          <h1 className="text-2xl font-extrabold text-foreground">Administrateurs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {users.length} compte{users.length !== 1 ? 's' : ''}
          </p>
        </div>

        {error   && <Feedback type="error"   message={error} />}
        {success && <Feedback type="success" message={success} />}

        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id}
              className="bg-white rounded-2xl border border-border/60 shadow-card px-4 py-3.5
                         flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
                  ${u.role === 'SUPER_ADMIN' ? 'bg-orange-50' : 'bg-muted'}`}>
                  {u.role === 'SUPER_ADMIN'
                    ? <Crown className="h-4.5 w-4.5 text-orange-500" />
                    : <ShieldCheck className="h-4.5 w-4.5 text-muted-foreground" />
                  }
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground text-sm">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0
                ${u.role === 'SUPER_ADMIN'
                  ? 'bg-orange-50 text-orange-600 border border-orange-200'
                  : 'bg-muted text-muted-foreground border border-border'
                }`}>
                {u.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Formulaire création */}
      <div className="lg:sticky lg:top-6">
        <div className="bg-white rounded-2xl border border-border/60 shadow-soft p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
              <Plus className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-sm font-bold text-foreground">Créer un administrateur</p>
          </div>

          <form onSubmit={handleCreateAdmin} className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="newName" className="field-label">Nom complet</label>
              <Input id="newName" type="text" placeholder="Prénom Nom"
                value={newName} onChange={(e) => setNewName(e.target.value)}
                className={inputCls} required />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="newEmail" className="field-label">Email</label>
              <Input id="newEmail" type="email" inputMode="email" placeholder="admin@rapidgaz.com"
                value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                className={inputCls} required />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="newPassword" className="field-label">Mot de passe</label>
              <Input id="newPassword" type="password" autoComplete="new-password"
                placeholder="6 caractères minimum"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                className={inputCls} required minLength={6} />
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full h-13 bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                         text-white font-bold rounded-xl shadow-orange transition-all
                         flex items-center justify-center gap-2 text-sm disabled:opacity-70 mt-1"
            >
              {creating
                ? <><Loader2 className="h-4 w-4 animate-spin" />Création…</>
                : <><Plus className="h-4 w-4" />Créer l&apos;administrateur</>
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
