'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import apiClient from '@/lib/axios'
import { AdminStats } from '@/types'
import {
  Users, UserCheck, UserX, ShoppingBag, ShieldCheck,
  LogOut, Loader2, AlertCircle, Circle,
} from 'lucide-react'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, role, logout } = useAuthStore()

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get<AdminStats>('/api/admin/stats')
      setStats(res.data)
    } catch {
      setError('Impossible de charger les statistiques.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])

  const handleLogout = () => { logout(); router.push('/') }

  const statCards = stats
    ? [
        { label: 'Total vendeurs',     value: stats.totalSellers,    icon: Users,       color: 'text-blue-500' },
        { label: 'Vendeurs actifs',     value: stats.activeSellers,   icon: UserCheck,   color: 'text-emerald-500' },
        { label: 'Vendeurs suspendus',  value: stats.suspendedSellers,icon: UserX,       color: 'text-red-500' },
        { label: 'Vendeurs ouverts',    value: stats.openSellers,     icon: Circle,      color: 'text-orange-500' },
        { label: 'Total produits',      value: stats.totalProducts,   icon: ShoppingBag, color: 'text-purple-500' },
        { label: 'Administrateurs',     value: stats.totalAdmins,     icon: ShieldCheck, color: 'text-gray-500' },
      ]
    : []

  const adminFirstName = user?.name?.split(' ')[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4">

      {/* ── Hero card ── */}
      <div className="bg-hero rounded-3xl p-5 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -right-2 w-20 h-20 bg-white/10 rounded-full" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-orange-200 text-xs font-semibold uppercase tracking-wider">Tableau de bord</p>
            <h1 className="text-2xl font-extrabold text-white leading-tight truncate">
              {adminFirstName ? `Bonjour, ${adminFirstName}` : 'Bonjour'}
            </h1>
            <p className="text-orange-100 text-sm truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15
                       hover:bg-white/25 text-white transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <div className="relative mt-4">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full
                           bg-white/15 text-orange-100 border border-white/20">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            {role === 'SUPER_ADMIN' ? 'Super Administrateur' : 'Administrateur'}
          </span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-100
                        rounded-2xl text-sm text-red-600 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-2xl border border-border/60 shadow-card p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide leading-tight min-w-0">
                  {card.label}
                </p>
                <Icon className={`h-4 w-4 ${card.color} shrink-0 mt-0.5`} />
              </div>
              <p className="text-3xl font-bold text-foreground">{card.value}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
