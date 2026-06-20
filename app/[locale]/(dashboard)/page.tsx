import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { OnboardingChecklist } from '@/components/onboarding/OnboardingChecklist'
import { FinanceDashboard } from '@/components/finance/FinanceDashboard'
import { PageHeader } from '@/components/shared/PageHeader'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const t = await getTranslations('nav')
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('dashboard')}
        description="Welcome back. Here is your business at a glance."
      />
      <OnboardingChecklist />
      <FinanceDashboard />
    </div>
  )
}