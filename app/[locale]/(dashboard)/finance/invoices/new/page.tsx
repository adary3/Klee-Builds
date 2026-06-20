import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { InvoiceForm } from '@/components/finance/InvoiceForm'

export const metadata: Metadata = { title: 'New Invoice' }

export default function NewInvoicePage({ params }: { params: { locale: string } }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Invoice"
        breadcrumbs={[
          { label: 'Finance', href: `/${params.locale}/finance` },
          { label: 'Invoices', href: `/${params.locale}/finance/invoices` },
          { label: 'New' },
        ]}
      />
      <InvoiceForm />
    </div>
  )
}
