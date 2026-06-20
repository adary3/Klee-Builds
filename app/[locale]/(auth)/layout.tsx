import type { Metadata } from 'next'
import { useTranslations } from 'next-intl'

export const metadata: Metadata = {
  title: 'Sign in',
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <span className="text-2xl font-bold text-primary">Kleenah</span>
            <p className="text-sm text-muted-foreground mt-1">
              Built for African business.
            </p>
          </div>
          {children}
        </div>
      </div>

      {/* Right: brand panel — hidden on mobile */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-primary p-12 text-white">
        <div className="max-w-md text-center space-y-6">
          <div className="text-5xl font-bold">Kleenah</div>
          <p className="text-xl text-blue-100">
            The ERP built for African SMEs. Invoices, expenses, team management — all in one place.
          </p>
          <div className="grid grid-cols-2 gap-4 text-left text-sm text-blue-100 mt-8">
            {[
              '✓ Multi-currency invoicing',
              '✓ Mobile money support',
              '✓ Works in EN, FR, Arabic',
              '✓ Built for African markets',
            ].map((feature) => (
              <div key={feature}>{feature}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
