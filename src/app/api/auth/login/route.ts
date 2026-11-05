import { NextResponse } from 'next/server'
import { verifyPin, createAuthToken } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const { pin } = await req.json()
    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'PIN wajib diisi' }, { status: 400 })
    }

    if (!verifyPin(pin)) {
      return NextResponse.json({ error: 'PIN salah. Silakan coba lagi.' }, { status: 401 })
    }

    const token = await createAuthToken('staff')

    const response = NextResponse.json({ success: true, message: 'Autentikasi berhasil' })
    response.cookies.set({
      name: 'tjap_auth',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    })

    return response
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Server error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
