import type { Metadata } from 'next'
import { CompanyWizard } from '@/components/onboarding/CompanyWizard'

export const metadata: Metadata = { title: 'Set up your company' }

export default function OnboardingPage() {
  return <CompanyWizard />
}
