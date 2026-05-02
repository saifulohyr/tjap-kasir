'use client'

import Link from 'next/link'
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
    { label: 'Kitchen', href: '/', icon: Utensils },
    { label: 'Inventory', href: '/inventory', icon: Package },
    { label: 'Analytics', href: '/analytics', icon: BarChart3 },
  ]

  return (
    <aside className="fixed left-0 top-0 h-full flex flex-col py-6 z-50 bg-[#fbf3e4] w-16 xl:w-64 shadow-[4px_0_24px_rgba(62,39,35,0.05)] border-r border-[#e3beb8]/15 transition-all duration-300">
      {/* Brand / Profile */}
      <div className="px-3 xl:px-6 mb-8">
        <h1 className="font-serif text-xl xl:text-2xl italic font-bold text-[#610000] text-center xl:text-left truncate">
          <span className="xl:hidden">TC</span>
          <span className="hidden xl:inline">Tjap Chacoh</span>
        </h1>

      </div>

      {/* Navigation Tabs */}
      <nav className="flex-1 space-y-1 px-1 xl:px-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href
          const Icon = tab.icon

          return (
            <Link
              key={tab.href}
              href={tab.href}
              title={tab.label}
              className={`flex items-center gap-3 px-3 xl:px-4 py-3 rounded-lg transition-all group justify-center xl:justify-start ${
                isActive
                  ? 'bg-white text-[#8B0000] shadow-sm xl:translate-x-1'
                  : 'text-[#3b290c] opacity-60 hover:opacity-100 hover:bg-[#fff8ef]'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className={`font-mono text-xs uppercase tracking-wider hidden xl:inline ${isActive ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="px-2 xl:px-4 mt-auto">
        <Link
          href="/login"
          className="flex items-center gap-3 px-3 xl:px-4 py-3 mt-4 text-[#3b290c] opacity-60 hover:opacity-100 hover:bg-[#fff8ef] rounded-lg transition-all group justify-center xl:justify-start"
        >
          <LogOut className="w-5 h-5 shrink-0 group-hover:text-primary transition-colors" />
          <span className="font-mono text-xs uppercase tracking-wider group-hover:text-primary transition-colors hidden xl:inline">Logout</span>
        </Link>
      </div>
    </aside>
  )
}
