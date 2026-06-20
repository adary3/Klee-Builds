import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { ExpenseForm } from '@/components/finance/ExpenseForm'

export const metadata: Metadata = { title: 'New Expense' }

export default function NewExpensePage({ params }: { params: { locale: string } }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="New Expense"
        breadcrumbs={[
          { label: 'Finance', href: `/${params.locale}/finance` },
          { label: 'Expenses', href: `/${params.locale}/finance/expenses` },
          { label: 'New' },
        ]}
      />
      <ExpenseForm />
    </div>
  )
}
