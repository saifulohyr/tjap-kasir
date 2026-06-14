'use client'

import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import BluetoothPrinterProvider from '@/providers/BluetoothPrinterProvider'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <BluetoothPrinterProvider>
      <div className="flex h-screen overflow-hidden bg-surface w-full">
        <Sidebar />
        <div className="flex-1 pl-16 xl:pl-64 flex flex-col h-screen transition-all duration-300 min-w-0 w-full">
          <TopBar />
          {children}
        </div>
      </div>
    </BluetoothPrinterProvider>
  )
}

