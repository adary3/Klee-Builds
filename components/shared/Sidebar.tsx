'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import {
  LayoutDashboard, Receipt, Package, Users2,
  UserSquare2, FolderKanban, ShoppingCart, BarChart3,
  Settings, ChevronLeft, LogOut, Building2,
  FileText, CreditCard, TrendingUp, ChevronDown, ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCompanyStore } from '@/store/companyStore'
import { useAuthStore } from '@/store/authStore'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils/cn'

const FINANCE_SUB = [
  { href: '/finance',          label: 'Overview', icon: TrendingUp },
  { href: '/finance/invoices', label: 'Invoices', icon: FileText },
  { href: '/finance/expenses', label: 'Expenses', icon: CreditCard },
  { href: '/finance/reports',  label: 'Reports',  icon: BarChart3 },
]

const NAV_ITEMS = [
  { key: 'dashboard',  href: '',            icon: LayoutDashboard, label: 'Dashboard',  hasChildren: false },
  { key: 'finance',    href: '/finance',    icon: Receipt,         label: 'Finance',    hasChildren: true },
  { key: 'inventory',  href: '/inventory',  icon: Package,         label: 'Inventory',  hasChildren: false },
  { key: 'crm',        href: '/crm',        icon: Users2,          label: 'CRM',        hasChildren: false },
  { key: 'hr',         href: '/hr',         icon: UserSquare2,     label: 'HR',         hasChildren: false },
  { key: 'projects',   href: '/projects',   icon: FolderKanban,    label: 'Projects',   hasChildren: false },
  { key: 'purchasing', href: '/purchasing', icon: ShoppingCart,    label: 'Purchasing', hasChildren: false },
]

const PLAN_LABELS: Record<string, string> = {
  starter: 'Starter', growth: 'Growth', enterprise: 'Enterprise',
}

export function Sidebar() {
  const locale = useLocale()
  const pathname = usePathname()
  const supabase = createClient()
  const { company } = useCompanyStore()
  const { user } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [financeOpen, setFinanceOpen] = useState(pathname.includes('/finance'))

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = `/${locale}/login`
  }

  function isActive(href: string) {
    const full = `/${locale}${href}`
    if (href === '') return pathname === `/${locale}` || pathname === `/${locale}/`
    if (href === '/finance') return pathname === `/${locale}/finance`
    return pathname.startsWith(full)
  }

  return (
    <aside className={cn(
      'relative flex flex-col h-screen border-r bg-card transition-all duration-200 flex-shrink-0',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted transition-colors"
      >
        {collapsed
          ? <ChevronRight className="h-3 w-3" />
          : <ChevronLeft className="h-3 w-3" />
        }
      </button>

      {/* Company header */}
      <div className={cn('flex items-center gap-2.5 px-3 py-4 border-b', collapsed && 'justify-center px-2')}>
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          {company?.logo_url
            ? <img src={company.logo_url} alt={company.name} className="h-8 w-8 rounded-lg object-cover" />
            : <Building2 className="h-4 w-4" />
          }
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{company?.name ?? 'Kleenah'}</p>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {PLAN_LABELS[company?.plan ?? 'starter'] ?? 'Starter'}
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon

          if (item.hasChildren) {
            const financeActive = pathname.includes('/finance')
            return (
              <div key={item.key}>
                <button
                  onClick={() => { if (!collapsed) setFinanceOpen((v) => !v) }}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                    financeActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="truncate flex-1 text-left">{item.label}</span>
                      <ChevronDown className={cn('h-3 w-3 transition-transform', financeOpen && 'rotate-180')} />
                    </>
                  )}
                </button>

                {!collapsed && financeOpen && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l pl-3">
                    {FINANCE_SUB.map((sub) => {
                      const SubIcon = sub.icon
                      const subActive = isActive(sub.href)
                      return (
                        <Link
                          key={sub.href}
                          href={`/${locale}${sub.href}`}
                          className={cn(
                            'flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                            subActive
                              ? 'text-primary font-medium'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                          )}
                        >
                          <SubIcon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span>{sub.label}</span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const active = isActive(item.href)
          return (
            <Link
              key={item.key}
              href={`/${locale}${item.href}`}
              className={cn(
                'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t px-2 py-2 space-y-0.5">
        <Link
          href={`/${locale}/settings`}
          className={cn(
            'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>

        <Link
          href={`/${locale}/settings/account`}
          className={cn(
            'flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover:bg-muted transition-colors',
            collapsed && 'justify-center px-2'
          )}
        >
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase">
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" className="h-7 w-7 rounded-full object-cover" />
              : (user?.full_name?.[0] ?? 'U')
            }
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">{user?.full_name ?? 'User'}</p>
            </div>
          )}
          {!collapsed && (
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button
                onClick={(e) => { e.preventDefault(); handleLogout() }}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </Link>
      </div>
    </aside>
  )
}