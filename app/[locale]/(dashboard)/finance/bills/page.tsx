import type { Metadata } from 'next'
export const metadata: Metadata = { title: 'Bills' }
export default function Page() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Bills</h1>
      <p className="text-muted-foreground">Built in Session 3 (Finance module)</p>
    </div>
  )
}
