'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SellerCard } from '@/components/shared/SellerCard'
import apiClient from '@/lib/axios'
import { AdminSeller, PagedResponse } from '@/types'
import { Loader2, AlertCircle, Search, Users } from 'lucide-react'

export default function AdminSellersPage() {
  const router = useRouter()
  const [sellers, setSellers] = useState<AdminSeller[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const fetchSellers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get<PagedResponse<AdminSeller>>('/api/admin/sellers', {
        params: { page: 0, size: 100 },
      })
      setSellers(res.data.content)
    } catch {
      setError('Impossible de charger la liste des vendeurs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSellers() }, [fetchSellers])

  const handleSuspend = async (id: number) => {
    setActionLoading(id)
    setError(null)
    try {
      await apiClient.put(`/api/admin/sellers/${id}/suspend`)
      setSellers((prev) => prev.map((s) => s.id === id ? { ...s, isActive: false, isOpen: false } : s))
    } catch {
      setError('Impossible de suspendre ce vendeur.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReactivate = async (id: number) => {
    setActionLoading(id)
    setError(null)
    try {
      await apiClient.put(`/api/admin/sellers/${id}/reactivate`)
      setSellers((prev) => prev.map((s) => s.id === id ? { ...s, isActive: true } : s))
    } catch {
      setError('Impossible de réactiver ce vendeur.')
    } finally {
      setActionLoading(null)
    }
  }

  const filtered = sellers.filter(
    (s) =>
      s.displayName.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase())
  )

  const activeCount    = sellers.filter(s => s.isActive).length
  const suspendedCount = sellers.filter(s => !s.isActive).length

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-sm text-muted-foreground font-medium">Chargement…</p>
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Admin</p>
        <h1 className="text-2xl font-extrabold text-foreground">Vendeurs</h1>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total',    value: sellers.length, color: 'bg-orange-50 text-orange-600' },
          { label: 'Actifs',   value: activeCount,    color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Suspendus',value: suspendedCount, color: 'bg-red-50 text-red-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl border border-border/60 shadow-card p-3 text-center">
            <p className={`text-2xl font-extrabold ${stat.color.split(' ')[1]}`}>{stat.value}</p>
            <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2.5 px-4 py-3 bg-red-50 border border-red-100
                        rounded-2xl text-sm text-red-600 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Rechercher par nom ou email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-12 pl-10 pr-4 rounded-2xl border border-border bg-white text-sm
                     font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
        />
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border/60 shadow-card p-10 text-center space-y-2">
            <Users className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold text-foreground">Aucun vendeur trouvé</p>
          </div>
        ) : (
          filtered.map((seller) => (
            <SellerCard
              key={seller.id}
              seller={seller}
              onSuspend={handleSuspend}
              onReactivate={handleReactivate}
              onClick={(id) => router.push(`/admin/sellers/${id}`)}
              loading={actionLoading === seller.id}
            />
          ))
        )}
      </div>
    </div>
  )
}
