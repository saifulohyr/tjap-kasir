'use client'

import { useEffect, useRef } from 'react'

// Timeout 15 menit inaktif / layar HP mati
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000 
const CHECK_INTERVAL_MS = 10 * 1000 
const STORAGE_KEY = 'tjap_last_active'

export default function SessionAutoLock() {
  const isLockingRef = useRef(false)

  useEffect(() => {
    // Inisialisasi timestamp aktivitas awal
    if (!localStorage.getItem(STORAGE_KEY)) {
      localStorage.setItem(STORAGE_KEY, Date.now().toString())
    }

    const lockSession = async () => {
      if (isLockingRef.current) return
      isLockingRef.current = true
      try {
        sessionStorage.setItem('tjap_locked', '1')
        await fetch('/api/auth/logout', { method: 'POST' })
      } catch (err) {
        console.error('Logout error on auto lock:', err)
      } finally {
        window.location.href = '/'
      }
    }

    let lastRecorded = 0
    const recordActivity = () => {
      const now = Date.now()
      // Throttle update localStorage tiap 5 detik
      if (now - lastRecorded > 5000) {
        lastRecorded = now
        localStorage.setItem(STORAGE_KEY, now.toString())
      }
    }

    const checkInactivity = () => {
      const raw = localStorage.getItem(STORAGE_KEY)
      const last = raw ? parseInt(raw, 10) : Date.now()
      if (Date.now() - last >= INACTIVITY_TIMEOUT_MS) {
        lockSession()
      }
    }

    // Tangkap aktivitas sentuh layar / klik / ketik kasir
    const events = ['pointerdown', 'touchstart', 'keydown', 'scroll']
    events.forEach((evt) => window.addEventListener(evt, recordActivity, { passive: true }))

    // Deteksi saat layar HP dibuka kembali setelah mati lama
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity()
      }
    }

    const handleFocus = () => {
      checkInactivity()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    // Cek berkala jika layar menyala tapi tidak disentuh
    const intervalId = setInterval(checkInactivity, CHECK_INTERVAL_MS)

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, recordActivity))
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
      clearInterval(intervalId)
    }
  }, [])

  return null
}
