import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = { title: 'Log in' }

export default async function LoginPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations('auth')
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t('login')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('noAccount')}{' '}
          <Link href={`/${locale}/register`} className="text-primary underline underline-offset-4 hover:text-primary/80">
            {t('signUpFree')}
          </Link>
        </p>
      </div>
      <LoginForm />
    </div>
  )
}
