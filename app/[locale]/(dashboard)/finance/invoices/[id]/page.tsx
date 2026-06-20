import type { Metadata } from 'next'
import { InvoiceDetail } from '@/components/finance/InvoiceDetail'

export const metadata: Metadata = { title: 'Invoice' }

export default function InvoiceDetailPage({ params }: { params: { id: string; locale: string } }) {
  return <InvoiceDetail invoiceId={params.id} />
}
