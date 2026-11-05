'use client'

import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import SessionAutoLock from '@/components/auth/SessionAutoLock'
import BluetoothPrinterProvider from '@/providers/BluetoothPrinterProvider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BluetoothPrinterProvider>
      <SessionAutoLock />
      <div className="flex h-screen overflow-hidden bg-surface w-full">
        <Sidebar />
        <div className="flex-1 pl-0 md:pl-16 xl:pl-64 pb-16 md:pb-0 flex flex-col h-screen transition-all duration-300 min-w-0 w-full">
          <TopBar />
          {children}
        </div>
      </div>
    </BluetoothPrinterProvider>
  )
}
