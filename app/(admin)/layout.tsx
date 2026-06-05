'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/authStore'
import { AdminNav } from '@/components/layout/AdminNav'
import { Loader2 } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { token, role, rehydrate } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    rehydrate()
    setMounted(true)
  }, [rehydrate])

  useEffect(() => {
    if (!mounted) return
    if (!token) {
      router.replace('/login')
    } else if (role && role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
      router.replace('/seller/dashboard')
    }
  }, [mounted, token, role, router])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  if (!token || (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) return null

  return (
    <div className="min-h-screen bg-warm">
      <AdminNav />
      <main className="md:ml-64 pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
