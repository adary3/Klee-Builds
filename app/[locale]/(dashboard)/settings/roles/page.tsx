import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { RoleBuilder } from '@/components/settings/RoleBuilder'

export const metadata: Metadata = { title: 'Roles & Permissions' }

export default function RolesSettingsPage({ params }: { params: { locale: string } }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles & permissions"
        description="Define what each role can access and do."
        breadcrumbs={[
          { label: 'Settings', href: `/${params.locale}/settings` },
          { label: 'Roles' },
        ]}
      />
      <RoleBuilder />
    </div>
  )
}
