'use client'

import { usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Menu, Bell } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'
import { LanguageSwitcher } from './LanguageSwitcher'

const ROUTE_LABELS: Record<string, string> = {
  finance: 'Finance', invoices: 'Invoices', expenses: 'Expenses',
  inventory: 'Inventory', crm: 'CRM', hr: 'HR', projects: 'Projects',
  purchasing: 'Purchasing', reports: 'Reports', settings: 'Settings',
}

interface NavbarProps { onMenuClick?: () => void }

export function Navbar({ onMenuClick }: NavbarProps) {
  const locale = useLocale()
  const pathname = usePathname()
  const segments = pathname.replace(`/${locale}`, '').split('/').filter(Boolean)
  const currentKey = segments[0] ?? 'dashboard'
  const pageTitle = ROUTE_LABELS[currentKey] ?? 'Dashboard'

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur px-4">
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          className="flex md:hidden h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors"
        >
          <Menu className="h-4 w-4" />
        </button>
      )}
      <h2 className="text-sm font-semibold">{pageTitle}</h2>
      <div className="flex-1" />
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
        <button className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted transition-colors">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}