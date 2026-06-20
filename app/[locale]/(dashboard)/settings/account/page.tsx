import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { AccountSettingsForm } from '@/components/settings/AccountSettingsForm'

export const metadata: Metadata = { title: 'My Account' }

export default function AccountSettingsPage({ params }: { params: { locale: string } }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My account"
        description="Update your name, avatar, and password."
        breadcrumbs={[
          { label: 'Settings', href: `/${params.locale}/settings` },
          { label: 'Account' },
        ]}
      />
      <AccountSettingsForm />
    </div>
  )
}
