import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { ReportsView } from '@/components/finance/ReportsView'

export const metadata: Metadata = { title: 'Reports' }

export default function ReportsPage({ params }: { params: { locale: string } }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Profit & Loss and financial performance."
        breadcrumbs={[{ label: 'Finance', href: `/${params.locale}/finance` }, { label: 'Reports' }]}
      />
      <ReportsView />
    </div>
  )
}
