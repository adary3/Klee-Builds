// TODO: Module — Purchasing
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Purchasing' }

export default function PurchasingPage() {
  const planned = ['Purchase orders','Supplier management,Approval workflows,Goods receipt,Spend analytics']
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Purchasing</h1>
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          Coming Soon
        </span>
      </div>
      <p className="text-muted-foreground max-w-lg">
        The Purchasing module is under development. Here is what is planned:
      </p>
      <ul className="space-y-2">
        {planned.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
            {feature}
          </li>
        ))}
      </ul>
    </div>
  )
}
