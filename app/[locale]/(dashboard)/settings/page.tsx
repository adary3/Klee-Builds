import type { Metadata } from 'next'
import Link from 'next/link'
import { Building2, Users2, Shield, User } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'

export const metadata: Metadata = { title: 'Settings' }

const SETTINGS_SECTIONS = [
  {
    href: 'company',
    icon: Building2,
    title: 'Company profile',
    description: 'Logo, name, currency, bank details, and address.',
  },
  {
    href: 'team',
    icon: Users2,
    title: 'Team',
    description: 'Invite members, change roles, deactivate users.',
  },
  {
    href: 'roles',
    icon: Shield,
    title: 'Roles & permissions',
    description: 'Create custom roles and configure what each can access.',
  },
  {
    href: 'account',
    icon: User,
    title: 'My account',
    description: 'Update your name, photo, and password.',
  },
]

export default function SettingsPage({ params }: { params: { locale: string } }) {
  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Settings"
        description="Manage your company, team, and account."
      />
      <div className="grid gap-3">
        {SETTINGS_SECTIONS.map((section) => {
          const Icon = section.icon
          return (
            <Link
              key={section.href}
              href={`/${params.locale}/settings/${section.href}`}
              className="flex items-center gap-4 rounded-xl border bg-card p-5 hover:bg-muted/30 transition-colors group"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{section.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{section.description}</p>
              </div>
              <span className="text-muted-foreground text-lg">›</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
