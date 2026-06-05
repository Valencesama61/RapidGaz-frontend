'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { SearchResultCard } from '@/components/shared/SearchResultCard'
import type { SearchResult, Brand, GasSize } from '@/types'
import { BRAND_LABELS, SIZE_LABELS } from '@/types'
import apiClient from '@/lib/axios'
import { Loader2, Flame, Search, MapPin, AlertCircle, LogIn, Wind, ChevronDown, Check, X } from 'lucide-react'

// Helpers

function brandLabel(value: string): string {
  return BRAND_LABELS[value as Brand] ?? value
}

function sizeLabel(value: string): string {
  return SIZE_LABELS[value as GasSize] ?? value.replace('KG_', '') + ' kg'
}

// Bottom-sheet picker

interface PickerOption { label: string; value: string }

function PickerModal({
  open,
  onClose,
  title,
  options,
  value,
  onChange,
  loading,
}: {
  open: boolean
  onClose: () => void
  title: string
  options: PickerOption[]
  value: string
  onChange: (v: string) => void
  loading?: boolean
}) {
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm
                    transition-opacity duration-250
                    ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl
                    transition-transform duration-300 ease-out shadow-[0_-8px_40px_0_rgb(0,0,0,0.12)]
                    ${open ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/60">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-muted
                       text-muted-foreground hover:bg-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-3 py-2 pb-10 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-orange-500" />
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = value === opt.value
              return (
                <button
                  key={opt.value}
                  onClick={() => { onChange(opt.value); onClose() }}
                  className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl
                              text-base font-semibold transition-all duration-150
                              ${isSelected
                                ? 'bg-orange-50 text-orange-600'
                                : 'text-foreground hover:bg-muted active:bg-muted'
                              }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && (
                    <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                      <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            })
          )}
        </div>
      </div>
    </>
  )
}

// Trigger button

function PickerTrigger({
  label,
  placeholder,
  value,
  onClick,
}: {
  label: string
  placeholder: string
  value: string
  onClick: () => void
}) {
  return (
    <div className="space-y-1.5">
      <p className="field-label">{label}</p>
      <button
        type="button"
        onClick={onClick}
        className={`w-full h-13 flex items-center justify-between px-4 rounded-xl border
                    transition-colors font-medium text-sm
                    ${value
                      ? 'bg-white border-orange-300 text-foreground'
                      : 'bg-muted/60 border-border text-muted-foreground'
                    }`}
      >
        <span>{value || placeholder}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
    </div>
  )
}

// Page

type ActiveModal = 'brand' | 'size' | null

export default function HomePage() {
  // Options chargées depuis l'API
  const [brands, setBrands] = useState<PickerOption[]>([])
  const [sizes, setSizes]   = useState<PickerOption[]>([])
  const [optionsLoading, setOptionsLoading] = useState(true)

  // Sélections utilisateur
  const [brand, setBrand]   = useState('')
  const [size, setSize]     = useState('')
  const [radius, setRadius] = useState(2)
  const [activeModal, setActiveModal] = useState<ActiveModal>(null)

  // Recherche
  const [results, setResults]   = useState<SearchResult[] | null>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)

  // Chargement des options au montage
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [brandsRes, sizesRes] = await Promise.all([
          apiClient.get<string[]>('/api/public/brands'),
          apiClient.get<string[]>('/api/public/sizes'),
        ])
        setBrands(brandsRes.data.map((v) => ({ value: v, label: brandLabel(v) })))
        setSizes(sizesRes.data.map((v) => ({ value: v, label: sizeLabel(v) })))
      } catch {
        // Fallback statique si l'API est indisponible
        setBrands([
          { value: 'ORYX',  label: 'Oryx'  },
          { value: 'JNP',   label: 'JNP'   },
          { value: 'TOTAL', label: 'Total'  },
        ])
        setSizes([
          { value: 'KG_6',  label: '6 kg'  },
          { value: 'KG_12', label: '12 kg' },
          { value: 'KG_25', label: '25 kg' },
        ])
      } finally {
        setOptionsLoading(false)
      }
    }
    fetchOptions()
  }, [])

  const handleSearch = async () => {
    setError(null)
    setGeoError(null)

    if (!brand || !size) {
      setError('Veuillez sélectionner une marque et une taille.')
      return
    }

    if (!navigator.geolocation) {
      setGeoError('La géolocalisation n\'est pas disponible sur votre appareil.')
      return
    }

    setLoading(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          const response = await apiClient.get('/api/public/sellers', {
            params: { latitude, longitude, radius, brand, size },
          })
          setResults(response.data.slice(0, 3))
        } catch {
          setError('Erreur lors de la recherche. Veuillez réessayer.')
        } finally {
          setLoading(false)
        }
      },
      (err) => {
        setLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Accès à la position refusé. Autorisez la géolocalisation dans les paramètres de votre navigateur.')
        } else {
          setGeoError('Impossible de récupérer votre position. Vérifiez vos paramètres.')
        }
      },
      { timeout: 10000, maximumAge: 60000 }
    )
  }

  const brandDisplay = brands.find(b => b.value === brand)?.label ?? ''
  const sizeDisplay  = sizes.find(s => s.value === size)?.label ?? ''

  return (
    <div className="min-h-screen bg-warm">

      {/* Hero */}
      <div className="bg-hero px-4 pt-5 pb-28">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 rounded-xl p-1.5">
                <Flame className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-extrabold text-white tracking-tight">RapidGaz</span>
            </div>
            <Link href="/login">
              <button className="flex items-center gap-1.5 text-sm font-semibold text-white/90
                                 bg-white/15 hover:bg-white/25 border border-white/25
                                 px-4 py-2 rounded-xl transition-colors">
                <LogIn className="h-4 w-4" />
                Espace vendeur
              </button>
            </Link>
          </div>

          <div className="space-y-2">
            <h1 className="text-[2.1rem] font-extrabold text-white leading-tight tracking-tight">
              Trouvez du gaz<br />près de chez vous
            </h1>
            <p className="text-orange-100 text-sm font-medium">
              Localisez les vendeurs disponibles autour de vous en quelques secondes.
            </p>
          </div>
        </div>
      </div>

      {/* Search card */}
      <div className="max-w-lg mx-auto px-4 -mt-20 space-y-4">
        <div className="bg-white rounded-3xl shadow-soft p-5 space-y-4">

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-orange-500 shrink-0" />
            <span className="text-sm font-semibold text-foreground">Rechercher autour de moi</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <PickerTrigger
              label="Marque"
              placeholder={optionsLoading ? 'Chargement…' : 'Choisir'}
              value={brandDisplay}
              onClick={() => !optionsLoading && setActiveModal('brand')}
            />
            <PickerTrigger
              label="Taille"
              placeholder={optionsLoading ? 'Chargement…' : 'Format'}
              value={sizeDisplay}
              onClick={() => !optionsLoading && setActiveModal('size')}
            />
          </div>

          {/* Rayon de recherche */}
          <div className="space-y-1.5">
            <p className="field-label">Zone de recherche</p>
            <div className="flex gap-2">
              {[1, 2, 5].map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => setRadius(km)}
                  className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-all duration-150 border
                              ${radius === km
                                ? 'bg-orange-500 text-white border-orange-500 shadow-orange'
                                : 'bg-muted/60 text-muted-foreground border-border hover:border-orange-300 hover:text-foreground'
                              }`}
                >
                  {km} km
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 rounded-xl text-sm text-red-600 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={handleSearch}
            disabled={loading || optionsLoading}
            className="w-full h-13 bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                       text-white font-bold rounded-xl shadow-orange transition-all duration-150
                       flex items-center justify-center gap-2 text-base disabled:opacity-70"
          >
            {loading ? (
              <><Loader2 className="h-5 w-5 animate-spin" />Localisation en cours…</>
            ) : (
              <><Search className="h-5 w-5" />Rechercher</>
            )}
          </button>
        </div>

        {geoError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center space-y-2">
            <AlertCircle className="h-7 w-7 text-red-400 mx-auto" />
            <p className="font-bold text-red-700 text-sm">Position refusée</p>
            <p className="text-xs text-red-500 leading-relaxed">{geoError}</p>
          </div>
        )}

        {results !== null && !loading && (
          <div className="space-y-3 pb-10">
            {results.length === 0 ? (
              <div className="text-center py-14 space-y-3">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Wind className="h-7 w-7 text-muted-foreground" />
                </div>
                <p className="font-bold text-foreground">Aucun vendeur trouvé</p>
                <p className="text-sm text-muted-foreground">
                  Essayez une autre marque, taille, ou élargissez votre zone.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                  {results.length} vendeur{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
                </p>
                {results.map((r, i) => (
                  <SearchResultCard key={i} result={r} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Modales */}
      <PickerModal
        open={activeModal === 'brand'}
        onClose={() => setActiveModal(null)}
        title="Marque de gaz"
        options={brands}
        value={brand}
        onChange={setBrand}
        loading={optionsLoading}
      />
      <PickerModal
        open={activeModal === 'size'}
        onClose={() => setActiveModal(null)}
        title="Format (kg)"
        options={sizes}
        value={size}
        onChange={setSize}
        loading={optionsLoading}
      />
    </div>
  )
}
