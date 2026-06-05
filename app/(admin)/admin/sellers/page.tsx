'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SellerCard } from '@/components/shared/SellerCard'
import apiClient from '@/lib/axios'
import { AdminSeller, PagedResponse } from '@/types'
import { Loader2, AlertCircle, Search, Users, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 15

export default function AdminSellersPage() {
  const router = useRouter()
  const [sellers, setSellers] = useState<AdminSeller[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  const fetchSellers = useCallback(async (pageNum: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get<PagedResponse<AdminSeller>>('/api/admin/sellers', {
        params: { page: pageNum, size: PAGE_SIZE },
      })
      setSellers(res.data.content)
      setTotalPages(res.data.totalPages)
      setTotalElements(res.data.totalElements)
    } catch {
      setError('Impossible de charger la liste des vendeurs.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSellers(page) }, [fetchSellers, page])

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

  const isSearching = search.trim().length > 0

  const filtered = isSearching
    ? sellers.filter(
        (s) =>
          s.displayName.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase())
      )
    : sellers

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
        <p className="text-sm text-muted-foreground mt-0.5">
          {totalElements} vendeur{totalElements !== 1 ? 's' : ''} au total
        </p>
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
            <p className="text-sm font-semibold text-foreground">
              {isSearching ? 'Aucun résultat sur cette page' : 'Aucun vendeur trouvé'}
            </p>
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

      {/* Pagination */}
      {!isSearching && totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground font-medium">
            Page {page + 1} / {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={page === 0}
              className="h-9 px-3 flex items-center gap-1 rounded-xl border border-border
                         text-sm font-semibold text-muted-foreground
                         hover:bg-muted transition-colors disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              Préc.
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages - 1}
              className="h-9 px-3 flex items-center gap-1 rounded-xl border border-border
                         text-sm font-semibold text-muted-foreground
                         hover:bg-muted transition-colors disabled:opacity-40"
            >
              Suiv.
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
