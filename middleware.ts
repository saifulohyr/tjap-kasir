import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const authCookie = request.cookies.get('tjap_auth')
  const { pathname } = request.nextUrl

  // 1. If no cookie and trying to access dashboard routes -> Redirect to root (Login)
  if (!authCookie && pathname !== '/') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 2. If already logged in and trying to access root (Login) -> Redirect to POS
  if (authCookie && pathname === '/') {
    return NextResponse.redirect(new URL('/pos', request.url))
  }

  return NextResponse.next()
}

// Ensure middleware doesn't run on static files or API routes
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icon.jpg).*)',
  ],
}
