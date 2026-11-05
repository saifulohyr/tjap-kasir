'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Utensils,
  MonitorCheck,
  Package,
  BarChart3,
  LogOut,
} from 'lucide-react'

export default function Sidebar() {
  const pathname = usePathname()

  const tabs = [
    { label: 'POS', href: '/pos', icon: MonitorCheck },
    { label: 'Kitchen', href: '/kitchen', icon: Utensils },
    { label: 'Inventory', href: '/inventory', icon: Package },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  ]

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      window.location.href = '/'
    }
  }

  return (
    <>
      {/* ── Desktop & Tablet Sidebar (Left) ── */}
      <aside className="hidden md:flex fixed left-0 top-0 h-full flex-col py-6 z-50 bg-white w-16 xl:w-64 border-r border-slate-200 shadow-sm transition-all duration-300">
        {/* Brand */}
        <div className="px-3 xl:px-6 mb-8">
          <div className="flex items-center gap-3 justify-center xl:justify-start">
            <div className="w-10 h-10 rounded-full overflow-hidden shadow-xs shrink-0 border border-slate-200 bg-white">
              <Image
                src="/logo.png"
                alt="Tjap Chacoh"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                priority
              />
            </div>
            <div className="hidden xl:block min-w-0">
              <h1 className="font-bold text-base text-slate-900 tracking-tight leading-tight truncate">
                Tjap Chacoh
              </h1>
              <p className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                POS & Kitchen
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 space-y-1 px-2">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href
            const Icon = tab.icon

            return (
              <Link
                key={tab.href}
                href={tab.href}
                title={tab.label}
                className={`flex items-center gap-3 px-3 xl:px-4 py-3 rounded-xl transition-all group justify-center xl:justify-start ${
                  isActive
                    ? 'bg-red-50 text-red-600 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-red-600' : 'text-slate-500 group-hover:text-slate-900'}`} />
                <span className="font-mono text-xs uppercase tracking-wider hidden xl:inline">
                  {tab.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Logout */}
        <div className="px-2 xl:px-4 mt-auto">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 xl:px-4 py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all group justify-center xl:justify-start"
            title="Logout"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="font-mono text-xs uppercase tracking-wider hidden xl:inline">
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 z-40 flex items-center justify-around px-2 shadow-lg">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center flex-1 py-1.5 transition-colors ${
                isActive ? 'text-red-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? 'bg-red-50' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono tracking-wider mt-0.5">
                {tab.label}
              </span>
            </Link>
          )
        })}

        <button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center flex-1 py-1.5 text-slate-400 hover:text-red-600 transition-colors"
          title="Logout"
        >
          <div className="p-1">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono tracking-wider mt-0.5">
            Exit
          </span>
        </button>
      </nav>
    </>
  )
}
