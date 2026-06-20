import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { ExpenseTable } from '@/components/finance/ExpenseTable'

export const metadata: Metadata = { title: 'Expenses' }

export default function ExpensesPage({ params }: { params: { locale: string } }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description="Track and categorise your business spending."
        breadcrumbs={[{ label: 'Finance', href: `/${params.locale}/finance` }, { label: 'Expenses' }]}
      />
      <ExpenseTable />
    </div>
  )
}
