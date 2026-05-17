'use client'

import { useEffect, useState } from 'react'

export default function InstallPrompt() {
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isDismissed, setIsDismissed] = useState(true) // Default true to prevent hydration mismatch, checked in useEffect

  useEffect(() => {
    // Check if dismissed previously
    const dismissed = localStorage.getItem('tjap-pwa-dismissed') === 'true'
    setIsDismissed(dismissed)

    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches || ('standalone' in window.navigator && (window.navigator as any).standalone)
    setIsStandalone(!!standalone)

    // Check if iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(ios)

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      }
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('tjap-pwa-dismissed', 'true')
  }

  // Don't show if installed, dismissed, or not ready
  if (isStandalone || isDismissed) {
    return null
  }

  // Show if Android has prompt ready OR is iOS (which has manual install only)
  if (!deferredPrompt && !isIOS) {
    return null
  }

  return (
    <div className="bg-primary text-white px-4 py-3 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shrink-0 z-50 sticky top-0">
      <div className="flex-1">
        <h4 className="font-bold font-serif text-sm">📱 Install Tjap Kasir ke Home Screen</h4>
        <p className="text-xs opacity-90 font-mono mt-0.5">
          {isIOS 
            ? 'Ketuk tombol Share di bawah layar lalu "Add to Home Screen" ➕' 
            : 'Akses lebih cepat & mode fullscreen layaknya aplikasi native.'}
        </p>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <button 
          onClick={handleDismiss}
          className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-mono font-bold hover:bg-black/10 rounded transition-colors text-white/80"
        >
          Nanti Saja
        </button>
        {!isIOS && (
          <button 
            onClick={handleInstallClick}
            className="flex-1 sm:flex-none px-3 py-1.5 text-xs font-mono font-bold bg-white text-primary rounded shadow-sm hover:bg-surface-container-lowest transition-colors"
          >
            Install Sekarang
          </button>
        )}
      </div>
    </div>
  )
}
