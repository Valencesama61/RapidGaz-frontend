'use client'

import { SearchResult } from '@/types'
import { Phone, MapPin, Navigation2 } from 'lucide-react'

interface Props {
  result: SearchResult
}

export function SearchResultCard({ result }: Props) {
  const { displayName, phone, distance, googleMapsUrl, product } = result

  const stockOk = product.stockQuantity > 5

  return (
    <div className="bg-white rounded-2xl shadow-card border border-border/60 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-start justify-between">
        <div className="space-y-0.5">
          <h3 className="font-bold text-foreground text-base leading-tight">{displayName}</h3>
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-1.5 text-sm text-orange-500 font-medium"
          >
            <Phone className="h-3.5 w-3.5" />
            {phone}
          </a>
        </div>
        <div className="flex items-center gap-1 bg-orange-50 text-orange-600 text-sm font-bold
                        px-2.5 py-1 rounded-xl shrink-0">
          <MapPin className="h-3.5 w-3.5" />
          {distance} km
        </div>
      </div>

      {/* Divider */}
      <div className="mx-4 h-px bg-border/60" />

      {/* Product info */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg">
              {product.brand}
            </span>
            <span className="text-sm text-muted-foreground font-medium">
              {product.size.replace('KG_', '').replace('12', '12')} kg
            </span>
          </div>
          <p className={`text-xs font-semibold ${stockOk ? 'text-emerald-600' : 'text-red-500'}`}>
            {product.stockQuantity} bouteille{product.stockQuantity > 1 ? 's' : ''} disponible{product.stockQuantity > 1 ? 's' : ''}
          </p>
        </div>
        <p className="text-xl font-extrabold text-foreground tracking-tight">
          {product.price.toLocaleString()}
          <span className="text-xs font-semibold text-muted-foreground ml-1">FCFA</span>
        </p>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <button
          onClick={() => window.open(googleMapsUrl, '_blank')}
          className="w-full h-12 bg-orange-500 hover:bg-orange-600 active:bg-orange-700
                     text-white font-bold rounded-xl shadow-orange transition-all duration-150
                     flex items-center justify-center gap-2 text-sm"
        >
          <Navigation2 className="h-4 w-4" />
          Ouvrir l&apos;itinéraire
        </button>
      </div>
    </div>
  )
}
