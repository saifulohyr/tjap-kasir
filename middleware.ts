import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuthToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('tjap_auth')?.value
  const { pathname } = request.nextUrl

  // Allow login endpoint and public static assets
  if (pathname.startsWith('/api/auth/login')) {
    return NextResponse.next()
  }

  const isValid = authCookie ? await verifyAuthToken(authCookie) : false

  // 1. API routes protection (except auth login)
  if (pathname.startsWith('/api/')) {
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized: Session invalid or expired' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // 2. Unauthenticated user accessing dashboard routes -> redirect to root (Login)
  if (!isValid && pathname !== '/') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 3. Authenticated user accessing root (Login) -> redirect to POS
  if (isValid && pathname === '/') {
    return NextResponse.redirect(new URL('/pos', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icon.jpg|manifest.webmanifest).*)',
  ],
}
