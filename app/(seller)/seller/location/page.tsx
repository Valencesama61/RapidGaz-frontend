'use client'

import { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import apiClient from '@/lib/axios'
import { Location } from '@/types'
import { MapPin, Loader2, AlertCircle, CheckCircle2, Navigation } from 'lucide-react'

function Feedback({ type, message }: { type: 'error' | 'success'; message: string }) {
  const styles = type === 'error'
    ? 'bg-red-50 border-red-100 text-red-600'
    : 'bg-emerald-50 border-emerald-100 text-emerald-700'
  const Icon = type === 'error' ? AlertCircle : CheckCircle2
  return (
    <div className={`flex items-start gap-2.5 px-3.5 py-3 rounded-xl border text-sm font-medium ${styles}`}>
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      {message}
    </div>
  )
}

export default function SellerLocationPage() {
  const [currentLocation, setCurrentLocation] = useState<Location | null>(null)
  const [hasLocation, setHasLocation] = useState(false)
  const [loading, setLoading] = useState(true)
  const [geoLoading, setGeoLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [manualLat, setManualLat] = useState('')
  const [manualLng, setManualLng] = useState('')

  const fetchLocation = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get<Location>('/api/v1/seller/me/location')
      setCurrentLocation(res.data)
      setHasLocation(true)
      setManualLat(String(res.data.latitude))
      setManualLng(String(res.data.longitude))
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status !== 404) setError('Impossible de charger la localisation.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchLocation() }, [fetchLocation])

  const saveLocation = async (lat: number, lng: number) => {
    setSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const body = { latitude: lat, longitude: lng }
      const res = hasLocation
        ? await apiClient.put<Location>('/api/v1/seller/me/location', body)
        : await apiClient.post<Location>('/api/v1/seller/me/location', body)
      setCurrentLocation(res.data)
      setHasLocation(true)
      setManualLat(String(res.data.latitude))
      setManualLng(String(res.data.longitude))
      setSuccess('Position enregistrée.')
    } catch {
      setError('Impossible de sauvegarder la position.')
    } finally {
      setSaving(false)
    }
  }

  const handleUseMyPosition = () => {
    setError(null)
    setSuccess(null)
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée par votre navigateur.')
      return
    }
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoLoading(false)
        saveLocation(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        setGeoLoading(false)
        setError('Accès refusé. Autorisez la localisation dans les paramètres de votre navigateur (icône cadenas).')
      },
      { timeout: 10000 }
    )
  }

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const lat = parseFloat(manualLat)
    const lng = parseFloat(manualLng)
    if (isNaN(lat) || isNaN(lng)) { setError('Coordonnées invalides.'); return }
    await saveLocation(lat, lng)
  }

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
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Vendeur</p>
        <h1 className="text-2xl font-extrabold text-foreground">Ma localisation</h1>
      </div>

      {/* Position actuelle */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-card p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${currentLocation ? 'bg-emerald-50' : 'bg-muted'}`}>
            <MapPin className={`h-5 w-5 ${currentLocation ? 'text-emerald-500' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Position actuelle</p>
            {currentLocation ? (
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5">Aucune position enregistrée</p>
            )}
          </div>
        </div>
      </div>

      {/* GPS */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-card p-5 space-y-4">
        <div>
          <p className="text-sm font-bold text-foreground">Utiliser ma position GPS</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Votre navigateur demandera l&apos;accès à votre position.
          </p>
        </div>
        <button
          onClick={handleUseMyPosition}
          disabled={geoLoading || saving}
          className="w-full h-13 bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                     text-white font-bold rounded-xl shadow-orange transition-all duration-150
                     flex items-center justify-center gap-2 text-sm disabled:opacity-70"
        >
          {geoLoading || saving
            ? <><Loader2 className="h-5 w-5 animate-spin" />{saving ? 'Enregistrement…' : 'Récupération GPS…'}</>
            : <><Navigation className="h-5 w-5" />Utiliser ma position</>
          }
        </button>
      </div>

      {/* Saisie manuelle */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-card p-5 space-y-4">
        <div>
          <p className="text-sm font-bold text-foreground">Saisie manuelle</p>
          <p className="text-xs text-muted-foreground mt-0.5">Entrez vos coordonnées GPS directement.</p>
        </div>

        <form onSubmit={handleManualSave} className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="latitude" className="field-label">Latitude</label>
            <Input
              id="latitude"
              type="number"
              inputMode="decimal"
              step="any"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              placeholder="ex: 6.3654"
              className="h-13 rounded-xl border-border bg-muted/50 text-sm font-medium
                         focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:border-orange-400"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="longitude" className="field-label">Longitude</label>
            <Input
              id="longitude"
              type="number"
              inputMode="decimal"
              step="any"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              placeholder="ex: 2.4183"
              className="h-13 rounded-xl border-border bg-muted/50 text-sm font-medium
                         focus-visible:ring-2 focus-visible:ring-orange-500/30 focus-visible:border-orange-400"
              required
            />
          </div>

          {error  && <Feedback type="error"   message={error} />}
          {success && <Feedback type="success" message={success} />}

          <button
            type="submit"
            disabled={saving}
            className="w-full h-13 border border-orange-300 text-orange-600 font-bold rounded-xl
                       hover:bg-orange-50 active:bg-orange-100 transition-colors
                       flex items-center justify-center gap-2 text-sm disabled:opacity-70"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" />Enregistrement…</> : 'Enregistrer manuellement'}
          </button>
        </form>
      </div>
    </div>
  )
}
