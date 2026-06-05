'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import apiClient from '@/lib/axios'
import { Seller, Product } from '@/types'
import { ArrowLeft, MapPin, Phone, Mail, Loader2, AlertCircle } from 'lucide-react'

interface SellerDetail extends Seller {
  products?: Product[]
}

export default function SellerDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [seller, setSeller] = useState<SellerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSeller = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get<SellerDetail>(`/api/admin/sellers/${id}`)
      setSeller(res.data)
    } catch {
      setError('Impossible de charger les détails du vendeur.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchSeller()
  }, [fetchSeller])

  const handleSuspend = async () => {
    if (!seller) return
    setActionLoading(true)
    try {
      const res = await apiClient.put<Seller>(`/api/admin/sellers/${seller.id}/suspend`)
      setSeller((prev) => prev ? { ...prev, ...res.data } : null)
    } catch {
      setError('Impossible de suspendre ce vendeur.')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReactivate = async () => {
    if (!seller) return
    setActionLoading(true)
    try {
      const res = await apiClient.put<Seller>(`/api/admin/sellers/${seller.id}/reactivate`)
      setSeller((prev) => prev ? { ...prev, ...res.data } : null)
    } catch {
      setError('Impossible de réactiver ce vendeur.')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!seller) {
    return (
      <div className="text-center py-20 text-gray-400">
        Vendeur introuvable.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors shrink-0"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900 min-w-0 truncate">{seller.displayName}</h1>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Info card */}
      <Card className="rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge
              className={seller.isSuspended ? '' : 'bg-green-100 text-green-700 border-green-200'}
              variant={seller.isSuspended ? 'destructive' : 'outline'}
            >
              {seller.isSuspended ? 'Suspendu' : 'Actif'}
            </Badge>
            {!seller.isSuspended && (
              <Badge
                variant="outline"
                className={seller.isOpen ? 'border-orange-200 text-orange-600' : 'text-gray-500'}
              >
                {seller.isOpen ? 'Ouvert' : 'Fermé'}
              </Badge>
            )}
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-gray-400 shrink-0" />
              {seller.email}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400 shrink-0" />
              {seller.phone}
            </div>
            {seller.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                {seller.location.latitude.toFixed(6)}, {seller.location.longitude.toFixed(6)}
              </div>
            )}
          </div>

          <div className="pt-2 flex gap-2">
            {!seller.isSuspended ? (
              <Button
                variant="outline"
                onClick={handleSuspend}
                disabled={actionLoading}
                className="flex-1 h-12 border-red-200 text-red-600 hover:bg-red-50"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Suspendre'}
              </Button>
            ) : (
              <Button
                onClick={handleReactivate}
                disabled={actionLoading}
                className="flex-1 h-12 bg-green-500 hover:bg-green-600 text-white"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Réactiver'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      {seller.products && seller.products.length > 0 && (
        <Card className="rounded-xl shadow-sm border border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Produits ({seller.products.length})</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {seller.products.map((product) => (
              <div
                key={product.id}
                className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{product.brand}</span>
                  <span className="text-xs text-gray-500">{product.size} kg</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-900">{product.price.toLocaleString()} F</span>
                  <span className="text-xs text-gray-500">Stock: {product.stockQuantity}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
