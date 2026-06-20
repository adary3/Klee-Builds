import type { Metadata } from 'next'
import { Suspense } from 'react'
import { InviteForm } from '@/components/auth/InviteForm'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export const metadata: Metadata = { title: 'Accept invitation' }

export default function InvitePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Accept Invitation</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create your account to join your team on Kleenah.
        </p>
      </div>
      <Suspense fallback={<LoadingSpinner />}>
        <InviteForm />
      </Suspense>
    </div>
  )
}
