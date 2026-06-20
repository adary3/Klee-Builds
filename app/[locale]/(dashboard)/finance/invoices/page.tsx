import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/PageHeader'
import { InvoiceTable } from '@/components/finance/InvoiceTable'

export const metadata: Metadata = { title: 'Invoices' }

export default function InvoicesPage({ params }: { params: { locale: string } }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="Create, send, and track your invoices."
        breadcrumbs={[{ label: 'Finance', href: `/${params.locale}/finance` }, { label: 'Invoices' }]}
      />
      <InvoiceTable />
    </div>
  )
}
