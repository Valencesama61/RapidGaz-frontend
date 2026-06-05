'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import apiClient from '@/lib/axios'
import { Product, Brand, GasSize, BRAND_LABELS, SIZE_LABELS } from '@/types'
import {
  Plus, Minus, RotateCcw, Pencil, Trash2,
  Loader2, AlertCircle, PackageOpen, Check, X, ChevronDown,
} from 'lucide-react'

const BRANDS: Brand[] = ['ORYX', 'JNP', 'TOTAL']
const SIZES:  GasSize[] = ['KG_6', 'KG_12', 'KG_25']

// PickerModal (même pattern que page publique)
function PickerModal<T extends string>({
  open, onClose, title, options, value, onChange,
}: {
  open: boolean; onClose: () => void; title: string
  options: { label: string; value: T }[]; value: T | ''; onChange: (v: T) => void
}) {
  return (
    <>
      <div onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200
                    ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} />
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl
                       transition-transform duration-300 ease-out shadow-[0_-8px_40px_0_rgb(0,0,0,0.12)]
                       ${open ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted hover:bg-gray-200 transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <div className="px-3 py-2 pb-10 space-y-1">
          {options.map((opt) => (
            <button key={opt.value} onClick={() => { onChange(opt.value); onClose() }}
              className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl
                          text-base font-semibold transition-all duration-150
                          ${value === opt.value ? 'bg-orange-50 text-orange-600' : 'text-foreground hover:bg-muted'}`}>
              <span>{opt.label}</span>
              {value === opt.value && (
                <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

function PickerTrigger({ label, placeholder, value, onClick }: {
  label: string; placeholder: string; value: string; onClick: () => void
}) {
  return (
    <div className="space-y-1.5">
      <p className="field-label">{label}</p>
      <button type="button" onClick={onClick}
        className={`w-full h-13 flex items-center justify-between px-4 rounded-xl border
                    transition-colors text-sm font-medium
                    ${value ? 'bg-white border-orange-300 text-foreground' : 'bg-muted/60 border-border text-muted-foreground'}`}>
        <span>{value || placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    </div>
  )
}

function Feedback({ type, message }: { type: 'error' | 'success'; message: string }) {
  return (
    <div className={`flex items-start gap-2 px-3.5 py-3 rounded-xl border text-sm font-medium
                     ${type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
      {message}
    </div>
  )
}

type ActivePicker = 'brand' | 'size' | null

export default function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [addBrand, setAddBrand] = useState<Brand | ''>('')
  const [addSize, setAddSize]   = useState<GasSize | ''>('')
  const [addPrice, setAddPrice] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [activePicker, setActivePicker] = useState<ActivePicker>(null)

  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [editPrice, setEditPrice]     = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const [stockLoading, setStockLoading] = useState<Record<number, boolean>>({})
  const [stockInputs, setStockInputs]   = useState<Record<number, string>>({})

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiClient.get<Product[]>('/api/v1/seller/me/products')
      setProducts(res.data)
    } catch {
      setError('Impossible de charger les produits.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!addBrand || !addSize || !addPrice) { setAddError('Remplissez tous les champs.'); return }
    setAddLoading(true)
    setAddError(null)
    try {
      const res = await apiClient.post<Product>('/api/v1/seller/me/products', {
        brand: addBrand, size: addSize, price: Number(addPrice),
      })
      setProducts((prev) => [...prev, res.data])
      setAddBrand(''); setAddSize(''); setAddPrice('')
    } catch {
      setAddError('Impossible d\'ajouter le produit.')
    } finally {
      setAddLoading(false)
    }
  }

  const handleEditSave = async () => {
    if (!editProduct) return
    setEditLoading(true)
    try {
      const res = await apiClient.put<Product>(`/api/v1/seller/me/products/${editProduct.id}`, {
        price: Number(editPrice),
      })
      setProducts((prev) => prev.map((p) => p.id === res.data.id ? res.data : p))
      setEditProduct(null)
    } catch {
      // keep dialog open
    } finally {
      setEditLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce produit ?')) return
    try {
      await apiClient.delete(`/api/v1/seller/me/products/${id}`)
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch {
      setError('Impossible de supprimer le produit.')
    }
  }

  const handleSetStock = async (id: number, e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(stockInputs[id] ?? '', 10)
    if (isNaN(qty) || qty < 0) return
    setStockLoading((prev) => ({ ...prev, [id]: true }))
    try {
      const res = await apiClient.put<{ id: number; quantity: number }>(
        `/api/v1/seller/me/products/${id}/stock`,
        { quantity: qty }
      )
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, stockQuantity: res.data.quantity } : p))
      setStockInputs((prev) => ({ ...prev, [id]: '' }))
    } catch {
      setError('Impossible de définir le stock.')
    } finally {
      setStockLoading((prev) => ({ ...prev, [id]: false }))
    }
  }

  const handleStock = async (id: number, action: 'increment' | 'decrement' | 'reset') => {
    setStockLoading((prev) => ({ ...prev, [id]: true }))
    try {
      // increment/decrement/reset → PATCH /products/{id}/{action}, sans body
      const res = await apiClient.patch<{ id: number; quantity: number }>(
        `/api/v1/seller/me/products/${id}/${action}`
      )
      // Met à jour le stockQuantity du produit concerné via son id (pas l'id du stock)
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, stockQuantity: res.data.quantity } : p))
    } catch {
      setError('Impossible de modifier le stock.')
    } finally {
      setStockLoading((prev) => ({ ...prev, [id]: false }))
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

      {/* Header */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Vendeur</p>
        <h1 className="text-2xl font-extrabold text-foreground">Mes produits</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {products.length} produit{products.length !== 1 ? 's' : ''} enregistré{products.length !== 1 ? 's' : ''}
        </p>
      </div>

      {error && <Feedback type="error" message={error} />}

      {/* Grille 2 colonnes sur desktop */}
      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8 lg:items-start space-y-5 lg:space-y-0">

        {/* ── Colonne gauche : liste ── */}
        <div className="space-y-3">
          {products.length === 0 && (
            <div className="bg-white rounded-2xl border border-border/60 shadow-card p-12 text-center space-y-3">
              <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mx-auto">
                <PackageOpen className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-bold text-foreground">Aucun produit</p>
              <p className="text-sm text-muted-foreground">Ajoutez votre premier produit via le formulaire.</p>
            </div>
          )}

          {products.map((product) => {
            const qty = product.stockQuantity ?? 0
            const stockOk = qty > 0
            return (
              <div key={product.id} className="bg-white rounded-2xl border border-border/60 shadow-card overflow-hidden">

                {/* Header card */}
                <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-lg">
                        {BRAND_LABELS[product.brand] ?? product.brand}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-lg">
                        {SIZE_LABELS[product.size] ?? product.size}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-lg ${stockOk ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                        {qty} en stock
                      </span>
                    </div>
                    <p className="text-xl font-extrabold text-foreground tracking-tight">
                      {product.price.toLocaleString()}
                      <span className="text-sm font-semibold text-muted-foreground ml-1">FCFA</span>
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => { setEditProduct(product); setEditPrice(String(product.price)) }}
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground
                                 hover:text-orange-500 hover:bg-orange-50 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground
                                 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="mx-4 h-px bg-border/50" />

                {/* Contrôles stock */}
                <div className="px-4 py-3 space-y-2.5">
                  {/* Définir valeur absolue */}
                  <form onSubmit={(e) => handleSetStock(product.id, e)} className="flex items-center gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      placeholder="Définir le stock…"
                      value={stockInputs[product.id] ?? ''}
                      onChange={(e) => setStockInputs((prev) => ({ ...prev, [product.id]: e.target.value }))}
                      className="flex-1 h-9 px-3 rounded-xl border border-border bg-muted/50 text-sm font-medium
                                 placeholder:text-muted-foreground/60
                                 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-400"
                    />
                    <button
                      type="submit"
                      disabled={!stockInputs[product.id] || stockLoading[product.id]}
                      className="h-9 px-4 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold
                                 rounded-xl transition-colors disabled:opacity-40 shrink-0">
                      Définir
                    </button>
                  </form>

                  {/* +/- reset */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Ajustement rapide</span>
                    <div className="flex items-center gap-1.5">
                      {stockLoading[product.id] ? (
                        <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                      ) : (
                        <>
                          <button onClick={() => handleStock(product.id, 'decrement')}
                            className="w-8 h-8 flex items-center justify-center rounded-xl border border-border
                                       text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleStock(product.id, 'increment')}
                            className="w-8 h-8 flex items-center justify-center rounded-xl border border-border
                                       text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => handleStock(product.id, 'reset')}
                            className="w-8 h-8 flex items-center justify-center rounded-xl border border-border
                                       text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors">
                            <RotateCcw className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ── Colonne droite : formulaire ajout (sticky sur desktop) ── */}
        <div className="lg:sticky lg:top-6">
          <div className="bg-white rounded-2xl border border-border/60 shadow-soft p-5 space-y-4">
            <div className="flex items-center gap-2 pb-1">
              <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center">
                <Plus className="h-4 w-4 text-orange-500" />
              </div>
              <p className="text-sm font-bold text-foreground">Ajouter un produit</p>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3">
              <PickerTrigger
                label="Marque"
                placeholder="Choisir une marque"
                value={addBrand ? (BRAND_LABELS[addBrand] ?? addBrand) : ''}
                onClick={() => setActivePicker('brand')}
              />
              <PickerTrigger
                label="Taille"
                placeholder="Choisir un format"
                value={addSize ? (SIZE_LABELS[addSize] ?? addSize) : ''}
                onClick={() => setActivePicker('size')}
              />

              <div className="space-y-1.5">
                <label htmlFor="addPrice" className="field-label">Prix (FCFA)</label>
                <Input
                  id="addPrice"
                  type="number"
                  inputMode="numeric"
                  value={addPrice}
                  onChange={(e) => setAddPrice(e.target.value)}
                  placeholder="ex: 5000"
                  className={inputCls}
                  min={0}
                />
              </div>

              {addError && <Feedback type="error" message={addError} />}

              <button
                type="submit"
                disabled={addLoading}
                className="w-full h-13 bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                           text-white font-bold rounded-xl shadow-orange transition-all duration-150
                           flex items-center justify-center gap-2 text-sm disabled:opacity-70 mt-1"
              >
                {addLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin" />Ajout…</>
                  : <><Plus className="h-4 w-4" />Ajouter le produit</>
                }
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Pickers */}
      <PickerModal
        open={activePicker === 'brand'}
        onClose={() => setActivePicker(null)}
        title="Marque de gaz"
        options={BRANDS.map((b) => ({ value: b, label: BRAND_LABELS[b] }))}
        value={addBrand}
        onChange={(v) => setAddBrand(v)}
      />
      <PickerModal
        open={activePicker === 'size'}
        onClose={() => setActivePicker(null)}
        title="Format (kg)"
        options={SIZES.map((s) => ({ value: s, label: SIZE_LABELS[s] }))}
        value={addSize}
        onChange={(v) => setAddSize(v)}
      />

      {/* Dialog édition prix */}
      {editProduct && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setEditProduct(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-5 space-y-4
                          shadow-[0_-8px_40px_0_rgb(0,0,0,0.12)]">
            <div className="flex justify-center pt-1 pb-2">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <p className="text-base font-bold text-foreground">Modifier le prix</p>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg">
                  {BRAND_LABELS[editProduct.brand] ?? editProduct.brand}
                </span>
                <span className="text-sm text-muted-foreground">{SIZE_LABELS[editProduct.size] ?? editProduct.size}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="field-label">Nouveau prix (FCFA)</label>
              <Input
                type="number"
                inputMode="numeric"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className={inputCls}
                min={0}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3 pb-4">
              <button
                onClick={() => setEditProduct(null)}
                className="h-13 border border-border rounded-xl font-semibold text-sm text-muted-foreground
                           hover:bg-muted transition-colors">
                Annuler
              </button>
              <button
                onClick={handleEditSave}
                disabled={editLoading}
                className="h-13 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl
                           shadow-orange transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-70">
                {editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enregistrer'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
