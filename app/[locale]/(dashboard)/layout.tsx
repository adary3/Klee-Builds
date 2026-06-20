'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from '@/components/shared/Sidebar'
import { Navbar } from '@/components/shared/Navbar'
import { CompanyProvider } from '@/components/shared/CompanyProvider'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMobileSidebarOpen(false)
  }, [pathname])

  return (
    <CompanyProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="hidden md:flex">
          <Sidebar />
        </div>

        {mobileSidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
            <div className="relative z-50 flex h-full w-60">
              <Sidebar />
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <Navbar onMenuClick={() => setMobileSidebarOpen((v) => !v)} />
          <main className="flex-1 overflow-y-auto">
            <div className="px-4 py-6 md:px-6 lg:px-8 max-w-screen-2xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </CompanyProvider>
  )
}