'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuthStore } from '@/stores/authStore'
import apiClient from '@/lib/axios'
import { Seller } from '@/types'
import {
  Package, ToggleLeft, ToggleRight, LogOut,
  Loader2, AlertCircle, Boxes, MapPin, User, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SellerDashboardPage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const [seller, setSeller] = useState<Seller | null>(null)
  const [productCount, setProductCount] = useState(0)
  const [totalStock, setTotalStock] = useState(0)
  const [loading, setLoading] = useState(true)
  const [toggleLoading, setToggleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [sellerRes, productsRes] = await Promise.all([
        apiClient.get<Seller>('/api/v1/seller/me'),
        apiClient.get('/api/v1/seller/me/products'),
      ])
      setSeller(sellerRes.data)
      const products = productsRes.data
      setProductCount(products.length)
      setTotalStock(
        products.reduce((sum: number, p: { stockQuantity?: number }) => sum + (p.stockQuantity ?? 0), 0)
      )
    } catch {
      setError('Impossible de charger les données.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleToggleOpen = async () => {
    if (!seller) return
    setToggleLoading(true)
    try {
      const res = await apiClient.put<Seller>('/api/v1/seller/me', { isOpen: !seller.isOpen })
      setSeller(res.data)
    } catch {
      setError('Impossible de mettre à jour le statut.')
    } finally {
      setToggleLoading(false)
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

  const firstName = user?.name?.split(' ')[0] ?? ''
  const isOpen = seller?.isOpen ?? false

  return (
    <div className="space-y-4">

      {/* ── Hero card ── */}
      <div className="bg-hero rounded-3xl p-5 relative overflow-hidden">
        {/* Cercles décoratifs */}
        <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
        <div className="absolute -bottom-8 -right-2 w-20 h-20 bg-white/10 rounded-full" />

        <div className="relative flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-orange-200 text-xs font-semibold uppercase tracking-wider">Tableau de bord</p>
            <h1 className="text-2xl font-extrabold text-white leading-tight">
              {firstName ? `Bonjour, ${firstName}` : 'Bonjour'}
            </h1>
            <p className="text-orange-100 text-sm">
              {seller?.displayName ?? ''}
            </p>
          </div>
          <button
            onClick={() => { logout(); router.push('/') }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/15
                       hover:bg-white/25 text-white transition-colors shrink-0"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Badge statut */}
        <div className="relative mt-4">
          <span className={cn(
            'inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full',
            isOpen
              ? 'bg-emerald-400/20 text-emerald-100 border border-emerald-300/30'
              : 'bg-white/15 text-orange-100 border border-white/20'
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', isOpen ? 'bg-emerald-300' : 'bg-orange-200')} />
            {isOpen ? 'Boutique ouverte' : 'Boutique fermée'}
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
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl border border-border/60 shadow-card p-4">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
            <Package className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-3xl font-extrabold text-foreground">{productCount}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">
            Produit{productCount !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-border/60 shadow-card p-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
            <Boxes className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-3xl font-extrabold text-foreground">{totalStock}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-0.5">Bouteilles en stock</p>
        </div>
      </div>

      {/* ── Disponibilité ── */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-card p-4">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Disponibilité
        </p>
        <div className="flex items-center justify-between">
          <div>
            <p className={cn('text-sm font-bold', isOpen ? 'text-emerald-600' : 'text-foreground')}>
              {isOpen ? 'Je suis disponible' : 'Je suis indisponible'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isOpen ? 'Les clients peuvent vous trouver' : 'Vous n\'apparaissez pas dans les résultats'}
            </p>
          </div>
          <button
            onClick={handleToggleOpen}
            disabled={toggleLoading}
            className="shrink-0 disabled:opacity-50 min-h-[48px] px-1"
            aria-label="Basculer disponibilité"
          >
            {toggleLoading ? (
              <Loader2 className="h-9 w-9 animate-spin text-orange-500" />
            ) : isOpen ? (
              <ToggleRight className="h-11 w-11 text-emerald-500" />
            ) : (
              <ToggleLeft className="h-11 w-11 text-muted-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* ── Raccourcis ── */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-card overflow-hidden">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-4 pb-2">
          Accès rapide
        </p>

        {[
          { href: '/seller/products', icon: Package,  label: 'Mes produits',  sub: `${productCount} produit${productCount !== 1 ? 's' : ''}`, color: 'bg-orange-50', iconColor: 'text-orange-500' },
          { href: '/seller/location', icon: MapPin,   label: 'Ma position',   sub: seller?.location ? 'Position enregistrée' : 'Non configurée', color: 'bg-purple-50', iconColor: 'text-purple-500' },
          { href: '/seller/profile',  icon: User,     label: 'Mon profil',    sub: seller?.phone ?? 'Modifier mes infos', color: 'bg-sky-50', iconColor: 'text-sky-500' },
        ].map((item, i, arr) => (
          <Link key={item.href} href={item.href}
            className={cn(
              'flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors',
              i < arr.length - 1 && 'border-b border-border/50'
            )}>
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', item.color)}>
              <item.icon className={cn('h-4.5 w-4.5', item.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{item.label}</p>
              <p className="text-xs text-muted-foreground truncate">{item.sub}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  )
}
