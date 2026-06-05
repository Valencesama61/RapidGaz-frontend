'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import apiClient from '@/lib/axios'
import { AdminStats } from '@/types'
import { Users, UserCheck, UserX, ShoppingBag, ShieldCheck, LogOut, Loader2, AlertCircle, Circle } from 'lucide-react'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

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

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const statCards = stats
    ? [
        { label: 'Total vendeurs', value: stats.totalSellers, icon: Users, color: 'text-blue-500' },
        { label: 'Vendeurs actifs', value: stats.activeSellers, icon: UserCheck, color: 'text-green-500' },
        { label: 'Vendeurs suspendus', value: stats.suspendedSellers, icon: UserX, color: 'text-red-500' },
        { label: 'Vendeurs ouverts', value: stats.openSellers, icon: Circle, color: 'text-orange-500' },
        { label: 'Total produits', value: stats.totalProducts, icon: ShoppingBag, color: 'text-purple-500' },
        { label: 'Administrateurs', value: stats.totalAdmins, icon: ShieldCheck, color: 'text-gray-500' },
      ]
    : []

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Bienvenue, {user?.name || 'Administrateur'}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleLogout}
          className="h-10 text-gray-600 border-gray-200"
        >
          <LogOut className="h-4 w-4 mr-1.5" />
          <span className="hidden sm:inline">Se déconnecter</span>
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label} className="rounded-xl shadow-sm border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {card.label}
                  </p>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
