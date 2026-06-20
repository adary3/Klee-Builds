import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { TeamTable } from '@/components/settings/TeamTable'

export const metadata: Metadata = { title: 'Team' }

export default function TeamSettingsPage({ params }: { params: { locale: string } }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Manage members, roles, and access."
        breadcrumbs={[
          { label: 'Settings', href: `/${params.locale}/settings` },
          { label: 'Team' },
        ]}
      />
      <TeamTable />
    </div>
  )
}
