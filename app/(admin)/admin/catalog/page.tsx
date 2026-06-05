'use client'

import { useState, useEffect, useCallback } from 'react'
import apiClient from '@/lib/axios'
import { Loader2, AlertCircle, Tag, Ruler, Plus, Trash2, CheckCircle2 } from 'lucide-react'

interface CatalogItem { id: number; name: string }

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

function CatalogSection({
  icon: Icon, title, color, items, loading, onAdd, onDelete,
}: {
  icon: React.ElementType
  title: string
  color: string
  items: CatalogItem[]
  loading: boolean
  onAdd: (name: string) => Promise<void>
  onDelete: (id: number) => Promise<void>
}) {
  const [input, setInput] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    setAdding(true)
    setError(null)
    try {
      await onAdd(input.trim())
      setInput('')
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status
      setError(status === 409 ? 'Cette valeur existe déjà.' : 'Impossible d\'ajouter.')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: number) => {
    setDeletingId(id)
    try {
      await onDelete(id)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-card overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-4 border-b border-border/60 flex items-center gap-3`}>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{items.length} entrée{items.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Aucune entrée</p>
        ) : (
          items.map((item) => (
            <div key={item.id}
              className="flex items-center justify-between px-3 py-2.5 bg-muted/40 rounded-xl">
              <span className="text-sm font-semibold text-foreground">{item.name}</span>
              <button
                onClick={() => handleDelete(item.id)}
                disabled={deletingId === item.id}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground
                           hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
              >
                {deletingId === item.id
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <Trash2 className="h-3.5 w-3.5" />
                }
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add form */}
      <div className="px-4 pb-4 space-y-2 border-t border-border/60 pt-3">
        {error && <Feedback type="error" message={error} />}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            placeholder={`Nouveau ${title.toLowerCase()}…`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 h-10 px-3 rounded-xl border border-border bg-muted/50 text-sm font-medium
                       placeholder:text-muted-foreground/60
                       focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
          />
          <button
            type="submit"
            disabled={adding || !input.trim()}
            className="h-10 px-4 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold
                       rounded-xl transition-colors disabled:opacity-40 flex items-center gap-1.5 shrink-0"
          >
            {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Ajouter
          </button>
        </form>
      </div>
    </div>
  )
}

export default function AdminCatalogPage() {
  const [brands, setBrands] = useState<CatalogItem[]>([])
  const [sizes, setSizes]   = useState<CatalogItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  const fetchCatalog = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [brandsRes, sizesRes] = await Promise.all([
        apiClient.get<CatalogItem[]>('/api/admin/catalog/brands'),
        apiClient.get<CatalogItem[]>('/api/admin/catalog/sizes'),
      ])
      setBrands(brandsRes.data)
      setSizes(sizesRes.data)
    } catch {
      setError('Impossible de charger le catalogue.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCatalog() }, [fetchCatalog])

  const addBrand = async (name: string) => {
    const res = await apiClient.post<CatalogItem>('/api/admin/catalog/brands', { name })
    setBrands((prev) => [...prev, res.data])
  }

  const deleteBrand = async (id: number) => {
    await apiClient.delete(`/api/admin/catalog/brands/${id}`)
    setBrands((prev) => prev.filter(b => b.id !== id))
  }

  const addSize = async (name: string) => {
    const res = await apiClient.post<CatalogItem>('/api/admin/catalog/sizes', { name })
    setSizes((prev) => [...prev, res.data])
  }

  const deleteSize = async (id: number) => {
    await apiClient.delete(`/api/admin/catalog/sizes/${id}`)
    setSizes((prev) => prev.filter(s => s.id !== id))
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Admin</p>
        <h1 className="text-2xl font-extrabold text-foreground">Catalogue produits</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Gérez les marques et tailles disponibles pour les vendeurs.
        </p>
      </div>

      {error && <Feedback type="error" message={error} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <CatalogSection
          icon={Tag}
          title="Marques"
          color="bg-orange-50 text-orange-500"
          items={brands}
          loading={loading}
          onAdd={addBrand}
          onDelete={deleteBrand}
        />
        <CatalogSection
          icon={Ruler}
          title="Tailles"
          color="bg-blue-50 text-blue-500"
          items={sizes}
          loading={loading}
          onAdd={addSize}
          onDelete={deleteSize}
        />
      </div>
    </div>
  )
}
