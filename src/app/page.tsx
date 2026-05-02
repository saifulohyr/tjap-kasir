'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Delete, LogIn } from 'lucide-react'
import PinDot from '@/components/login/PinDot'
import NumpadButton from '@/components/login/NumpadButton'

const PIN_LENGTH = 4
// TODO: Replace with Supabase staff table lookup (hashed PIN)
const VALID_PIN = '8691'

const NUMPAD_KEYS = [
  { digit: '1', letters: '' },
  { digit: '2', letters: 'abc' },
  { digit: '3', letters: 'def' },
  { digit: '4', letters: 'ghi' },
  { digit: '5', letters: 'jkl' },
  { digit: '6', letters: 'mno' },
  { digit: '7', letters: 'pqrs' },
  { digit: '8', letters: 'tuv' },
  { digit: '9', letters: 'wxyz' },
]

export default function LoginPage() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shake, setShake] = useState(false)

  const handleDigit = useCallback(
    (digit: string) => {
      if (pin.length >= PIN_LENGTH || isAuthenticating) return
      setError(null)
      setPin((prev) => prev + digit)
    },
    [pin.length, isAuthenticating]
  )

  const handleBackspace = useCallback(() => {
    if (isAuthenticating) return
    setError(null)
    setPin((prev) => prev.slice(0, -1))
  }, [isAuthenticating])

  const handleSubmit = useCallback(async () => {
    if (pin.length !== PIN_LENGTH || isAuthenticating) return

    setIsAuthenticating(true)
    setError(null)

    // Simulate network delay for realism
    await new Promise((resolve) => setTimeout(resolve, 600))

    if (pin === VALID_PIN) {
      // Set session cookie for 1 day
      document.cookie = "tjap_auth=true; path=/; max-age=86400; SameSite=Lax"
      router.push('/pos')
    } else {
      setShake(true)
      setError('PIN salah. Silakan coba lagi.')
      setTimeout(() => {
        setShake(false)
        setPin('')
      }, 600)
    }

    setIsAuthenticating(false)
  }, [pin, isAuthenticating, router])

  // Handle keyboard input
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key)
      } else if (e.key === 'Backspace') {
        handleBackspace()
      } else if (e.key === 'Enter') {
        handleSubmit()
      }
    },
    [handleDigit, handleBackspace, handleSubmit]
  )

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center p-4 md:p-6 relative overflow-y-auto"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Heritage Top Bar */}
      <div className="heritage-bar" />

      {/* ── Brand Header ── */}
      <div className="mb-6 md:mb-10 text-center animate-fade-in scale-90 md:scale-100">
        <h1 className="font-serif-display text-4xl md:text-6xl italic font-bold text-primary tracking-tight mb-2">
          Tjap Chacoh
        </h1>
        <p className="font-label text-[10px] md:text-sm uppercase tracking-[0.2em] text-tertiary/60">
          Sejak Kemarin Sore
        </p>
      </div>

      {/* ── PIN Card ── */}
      <div
        className={`w-full max-w-[360px] md:max-w-md bg-surface-container-low rounded-xl p-6 md:p-8 relative overflow-hidden border border-outline-variant/10 animate-slide-up ${
          shake ? 'animate-shake' : ''
        }`}
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        {/* Card Header */}
        <div className="mb-6 md:mb-8 text-center">
          <h2 className="font-headline text-xl md:text-2xl text-tertiary mb-4 md:mb-6">
            Staff Access Required
          </h2>

          {/* PIN Dots */}
          <div className="flex justify-center gap-4 mb-2" role="status" aria-label={`${pin.length} dari ${PIN_LENGTH} digit dimasukkan`}>
            {Array.from({ length: PIN_LENGTH }).map((_, i) => (
              <PinDot
                key={i}
                filled={i < pin.length}
                active={i === pin.length}
              />
            ))}
          </div>

          {/* Status / Error */}
          <div className="h-6 mt-4">
            {error ? (
              <p className="font-mono text-xs text-error animate-fade-in">
                {error}
              </p>
            ) : (
              <p className="font-mono text-[10px] text-tertiary/50 uppercase tracking-tighter">
                {isAuthenticating ? 'Memverifikasi...' : 'Security Protocol Active'}
              </p>
            )}
          </div>
        </div>

        {/* ── Number Pad ── */}
        <div className="grid grid-cols-3 gap-2 md:gap-3 mb-2 md:mb-4">
          {NUMPAD_KEYS.map(({ digit, letters }) => (
            <NumpadButton
              key={digit}
              letters={letters}
              onClick={() => handleDigit(digit)}
              ariaLabel={`Digit ${digit}`}
            >
              {digit}
            </NumpadButton>
          ))}

          {/* Backspace */}
          <NumpadButton
            variant="icon"
            onClick={handleBackspace}
            ariaLabel="Hapus digit terakhir"
          >
            <Delete className="w-5 h-5 text-tertiary" />
          </NumpadButton>

          {/* Zero */}
          <NumpadButton
            onClick={() => handleDigit('0')}
            ariaLabel="Digit 0"
          >
            0
          </NumpadButton>

          {/* Login */}
          <NumpadButton
            variant="action"
            onClick={handleSubmit}
            ariaLabel="Login"
          >
            <LogIn className="w-5 h-5" />
          </NumpadButton>
        </div>

      </div>



      {/* ── System Footer ── */}
      <footer className="mt-8 mb-4 w-full text-center">
        <p className="font-mono text-[10px] text-tertiary/40 uppercase tracking-[0.2em]">
          System V. 4.02 // Registry ID: TJAP-CH-001
        </p>
      </footer>
    </main>
  )
}
