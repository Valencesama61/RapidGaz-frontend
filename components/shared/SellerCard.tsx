'use client'

import { AdminSeller } from '@/types'
import { Phone, Mail, ChevronRight } from 'lucide-react'

interface Props {
  seller: AdminSeller
  onSuspend?: (id: number) => void
  onReactivate?: (id: number) => void
  onClick?: (id: number) => void
  loading?: boolean
}

export function SellerCard({ seller, onSuspend, onReactivate, onClick, loading }: Props) {
  const isSuspended = !seller.isActive

  return (
    <div
      className="bg-white rounded-2xl border border-border/60 shadow-card overflow-hidden
                 hover:shadow-soft transition-shadow cursor-pointer"
      onClick={() => onClick?.(seller.id)}
    >
      <div className="px-4 py-3.5 flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-foreground text-sm">{seller.displayName}</p>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full
              ${isSuspended
                ? 'bg-red-50 text-red-600 border border-red-200'
                : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}>
              {isSuspended ? 'Suspendu' : 'Actif'}
            </span>
            {!isSuspended && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
                ${seller.isOpen
                  ? 'bg-orange-50 text-orange-600 border-orange-200'
                  : 'bg-muted text-muted-foreground border-border'
                }`}>
                {seller.isOpen ? 'Ouvert' : 'Fermé'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Mail className="h-3 w-3 shrink-0" />
            <span className="truncate">{seller.email}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3 shrink-0" />
            <span>{seller.phone}</span>
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
      </div>

      {(onSuspend || onReactivate) && (
        <div
          className="px-4 pb-3 flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {!isSuspended && onSuspend && (
            <button
              disabled={loading}
              onClick={() => onSuspend(seller.id)}
              className="flex-1 h-9 border border-red-200 text-red-600 text-xs font-semibold
                         rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Suspendre
            </button>
          )}
          {isSuspended && onReactivate && (
            <button
              disabled={loading}
              onClick={() => onReactivate(seller.id)}
              className="flex-1 h-9 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold
                         rounded-xl transition-colors disabled:opacity-50"
            >
              Réactiver
            </button>
          )}
        </div>
      )}
    </div>
  )
}
