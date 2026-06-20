'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { Globe } from 'lucide-react'
import { locales, type Locale } from '@/i18n'
import { cn } from '@/lib/utils/cn'

const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  fr: 'Français',
  ar: 'العربية',
}

const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  fr: '🇫🇷',
  ar: '🇸🇦',
}

interface LanguageSwitcherProps {
  className?: string
}

export function LanguageSwitcher({ className }: LanguageSwitcherProps) {
  const locale = useLocale() as Locale
  const router = useRouter()
  const pathname = usePathname()

  function switchLocale(nextLocale: Locale) {
    if (nextLocale === locale) return
    // Replace the locale segment in the current path
    // e.g. /en/finance/invoices → /fr/finance/invoices
    const segments = pathname.split('/')
    segments[1] = nextLocale
    router.push(segments.join('/'))
  }

  return (
    <div className={cn('relative group', className)}>
      <button
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
        aria-label="Switch language"
      >
        <Globe className="h-4 w-4" />
        <span>{LOCALE_FLAGS[locale]}</span>
        <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
      </button>

      {/* Dropdown */}
      <div className="absolute top-full right-0 mt-1 w-40 rounded-lg border bg-popover shadow-md opacity-0 pointer-events-none group-focus-within:opacity-100 group-focus-within:pointer-events-auto transition-opacity z-50">
        {locales.map((loc) => (
          <button
            key={loc}
            onClick={() => switchLocale(loc)}
            className={cn(
              'flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg',
              loc === locale && 'font-medium text-primary'
            )}
          >
            <span>{LOCALE_FLAGS[loc]}</span>
            <span>{LOCALE_LABELS[loc]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
