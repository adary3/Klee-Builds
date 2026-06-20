import createMiddleware from 'next-intl/middleware'
import { type NextRequest } from 'next/server'

const intlMiddleware = createMiddleware({
  locales: ['en', 'fr', 'ar'],
  defaultLocale: 'en',
  localePrefix: 'always',
})

export function middleware(request: NextRequest) {
  return intlMiddleware(request)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}