import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { RegisterForm } from '@/components/auth/RegisterForm'

export const metadata: Metadata = { title: 'Create account' }

export default async function RegisterPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations('auth')
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('register')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('hasAccount')}{' '}
          <Link href={`/${locale}/login`} className="text-primary underline underline-offset-4 hover:text-primary/80">
            {t('login')}
          </Link>
        </p>
      </div>
      <RegisterForm />
    </div>
  )
}
