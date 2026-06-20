import type { Metadata } from 'next'
import { PageHeader } from '@/components/shared/PageHeader'
import { CompanyProfileForm } from '@/components/settings/CompanyProfileForm'

export const metadata: Metadata = { title: 'Company Profile' }

export default function CompanySettingsPage({ params }: { params: { locale: string } }) {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Company profile"
        description="Update your company information, logo, and bank details."
        breadcrumbs={[
          { label: 'Settings', href: `/${params.locale}/settings` },
          { label: 'Company' },
        ]}
      />
      <CompanyProfileForm />
    </div>
  )
}
