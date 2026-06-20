// TODO: Module — Hr
import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Hr' }

export default function HrPage() {
  const planned = ['Employee profiles','Leave management,Payroll integration,Attendance tracking,Performance reviews']
  
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Hr</h1>
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          Coming Soon
        </span>
      </div>
      <p className="text-muted-foreground max-w-lg">
        The Hr module is under development. Here is what is planned:
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
