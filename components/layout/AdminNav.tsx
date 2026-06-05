'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, ShieldCheck, Tag, Flame, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

export function AdminNav() {
  const pathname = usePathname()
  const router   = useRouter()
  const { role, logout } = useAuthStore()

  const navItems = [
    { href: '/admin/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
    { href: '/admin/sellers',   label: 'Vendeurs',   icon: Users },
    { href: '/admin/catalog',   label: 'Catalogue',  icon: Tag },
    ...(role === 'SUPER_ADMIN'
      ? [{ href: '/admin/users', label: 'Admins', icon: ShieldCheck }]
      : []),
  ]

  const handleLogout = () => { logout(); router.push('/') }

  return (
    <>
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-border/70 h-screen fixed left-0 top-0">
        <div className="px-6 py-5 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-500 rounded-xl flex items-center justify-center shadow-orange">
              <Flame className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-base font-extrabold text-foreground tracking-tight">RapidGaz</span>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider leading-none mt-0.5">
                Espace Admin
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-150',
                  isActive ? 'bg-orange-50 text-orange-600' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}>
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  isActive ? 'bg-orange-100' : 'bg-muted')}>
                  <Icon className={cn('h-4 w-4', isActive ? 'text-orange-600' : 'text-muted-foreground')} />
                </div>
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="px-3 py-4 border-t border-border/60">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold
                       text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all duration-150">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
              <LogOut className="h-4 w-4" />
            </div>
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Bottom bar mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border/70 z-50">
        <div className="flex">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link key={item.href} href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 min-h-[60px] flex-1 transition-colors',
                  isActive ? 'text-orange-500' : 'text-muted-foreground'
                )}>
                <div className={cn('w-10 h-6 rounded-full flex items-center justify-center', isActive ? 'bg-orange-50' : '')}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn('text-[10px] font-semibold', isActive ? 'text-orange-500' : '')}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
