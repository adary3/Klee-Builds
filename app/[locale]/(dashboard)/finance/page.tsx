import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { FinanceDashboard } from '@/components/finance/FinanceDashboard'

export const metadata: Metadata = { title: 'Finance' }

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Revenue, expenses, and cash flow at a glance."
        breadcrumbs={[{ label: 'Finance' }]}
      />
      <FinanceDashboard />
    </div>
  )
}
