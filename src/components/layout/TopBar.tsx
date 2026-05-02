'use client'

import { usePathname } from 'next/navigation'
import { Calendar, Clock, Search, Download, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import ExcelJS from 'exceljs'
import { useSearchStore } from '@/store/useSearchStore'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'

export default function TopBar() {
  const pathname = usePathname()
  const isPos = pathname === '/pos'
  const isInventory = pathname === '/inventory'
  const isAnalytics = pathname === '/analytics'

  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState(new Date())
  const [isExporting, setIsExporting] = useState(false)

  const inventorySearch = useSearchStore((state) => state.inventorySearch)
  const selectedDate = useAnalyticsStore((state) => state.selectedDate)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const selectedDate = useAnalyticsStore.getState().selectedDate
      const start = new Date(selectedDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(selectedDate)
      end.setHours(23, 59, 59, 999)

      // Fetch all items from selected date
      const { data: items, error } = await supabase
        .from('transaction_items')
        .select(`
          *,
          transactions ( ticket_number, created_at ),
          products ( category )
        `)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false })

      if (error) throw error

      if (!items || items.length === 0) {
        alert("Tidak ada data penjualan untuk tanggal ini.")
        setIsExporting(false)
        return
      }

      // Process Excel with ExcelJS
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'Tjap Chacoh POS'
      
      const sheet = workbook.addWorksheet('Sales Report')

      // Main Big Header
      sheet.mergeCells('A1:G2')
      const titleCell = sheet.getCell('A1')
      titleCell.value = `TJAP CHACOH - DAILY SALES REPORT\nDate: ${selectedDate}`
      titleCell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } }
      titleCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B0000' } }

      // Analytics Summary
      const totalRevenue = items.reduce((sum, item) => sum + (item.quantity * item.price_at_time), 0)
      const totalTxns = new Set(items.map(i => i.transaction_id)).size
      
      sheet.addRow([])
      sheet.addRow(['Performance metrics:', ''])
      sheet.getCell('A5').font = { bold: true, italic: true }
      
      sheet.addRow(['Total Revenue:', `Rp ${totalRevenue.toLocaleString('id-ID')}`])
      sheet.addRow(['Total Transactions:', totalTxns])
      sheet.addRow(['Items Sold:', items.reduce((sum, i) => sum + i.quantity, 0)])
      sheet.getCell('A6').font = { bold: true }; sheet.getCell('B6').font = { bold: true, color: { argb: 'FF8B0000'} }
      sheet.getCell('A7').font = { bold: true }
      sheet.getCell('A8').font = { bold: true }
      
      sheet.addRow([])

      // Table Header Row
      const tableHeader = sheet.addRow(["Waktu", "ID Transaksi", "Kategori", "Item Name", "Qty", "Harga Satuan", "Total (Rp)"])
      tableHeader.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      tableHeader.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B290C' } }
        cell.alignment = { horizontal: 'center' }
        cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} }
      })

      // Add Data Rows
      items.forEach(idx => {
        const t = idx.transactions as { ticket_number: string, created_at: string } | null
        const p = idx.products as { category?: string } | null
        const timeStr = t ? new Date(t.created_at).toLocaleTimeString('en-GB') : '-'
        
        const row = sheet.addRow([
          timeStr,
          t?.ticket_number || '-',
          p?.category || '-',
          idx.title,
          idx.quantity,
          idx.price_at_time,
          (idx.quantity * idx.price_at_time)
        ])
        
        // Add minimal borders and alignment
        row.eachCell((cell, colNumber) => {
          cell.border = { bottom: {style: 'hair'} }
          if (colNumber === 5 || colNumber === 6 || colNumber === 7) cell.alignment = { horizontal: 'right' }
          if (colNumber === 1 || colNumber === 2) cell.alignment = { horizontal: 'center' }
        })
      })

      // Column widths
      sheet.getColumn(1).width = 12
      sheet.getColumn(2).width = 16
      sheet.getColumn(3).width = 15
      sheet.getColumn(4).width = 30
      sheet.getColumn(5).width = 8
      sheet.getColumn(6).width = 15
      sheet.getColumn(7).width = 18

      // Trigger Download Blob
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `TjapChacoh_Sales_${selectedDate}.xlsx`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      console.error(e)
      alert("Gagal melakukan export.")
    } finally {
      setIsExporting(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    const timer = setInterval(() => setNow(new Date()), 1000)

    // Initialize selectedDate on client side to avoid SSR hydration mismatch
    if (!useAnalyticsStore.getState().selectedDate) {
      useAnalyticsStore.getState().setSelectedDate(new Date().toLocaleDateString('en-CA'))
    }

    return () => clearInterval(timer)
  }, [])

  const formattedDate = mounted 
    ? now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
    : '-- --- ----'
    
  const formattedTime = mounted 
    ? now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    : '--:--'

  return (
    <header className="flex justify-between items-center px-4 lg:px-8 py-3 lg:py-4 w-full bg-[#fff8ef] z-40 sticky top-0 border-b border-[#e3beb8]/15 gap-4">
      {/* ── Left Section ── */}
      <div className="flex items-center gap-4 lg:gap-8 animate-fade-in min-w-0 flex-1">
        {isPos ? (
          <div className="flex items-center gap-2 lg:gap-4 shrink-0">
            <h1 className="font-serif text-lg lg:text-2xl italic font-bold text-[#610000] tracking-tight">Tjap Chacoh</h1>
            <div className="h-4 lg:h-6 w-[1px] bg-outline-variant/30 hidden sm:block"></div>
            <h2 className="font-serif text-base lg:text-lg text-tertiary font-bold pl-1 lg:pl-0">Point of Sales</h2>
          </div>
        ) : isInventory ? (
          <>
            <div className="shrink-0">
              <h1 className="font-serif text-lg lg:text-2xl italic font-bold text-[#610000] tracking-tight">Tjap Chacoh</h1>
              <span className="font-mono text-[10px] uppercase text-on-surface-variant/40 tracking-widest">Master Inventory Ledger</span>
            </div>
          </>
        ) : isAnalytics ? (
          <>
            <div className="flex items-center gap-2 lg:gap-4 shrink-0">
              <h1 className="font-serif text-lg lg:text-2xl italic font-bold text-[#610000] tracking-tight">Tjap Chacoh</h1>
              <div className="h-4 lg:h-6 w-[1px] bg-outline-variant/30 hidden sm:block"></div>
              <h2 className="font-serif text-base lg:text-lg text-tertiary font-bold pl-1 lg:pl-0">Sales Analytics</h2>
            </div>
          </>
        ) : (
          <>
            <h1 className="font-serif text-lg lg:text-2xl italic font-bold text-[#610000] whitespace-nowrap">
              Tjap Chacoh
            </h1>
            <div className="h-6 w-[1px] bg-outline-variant/30 hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
              <span className="font-mono text-[10px] lg:text-xs uppercase tracking-widest text-secondary whitespace-nowrap">
                Kitchen Live
              </span>
            </div>
          </>
        )}
      </div>

      {/* ── Right Section ── */}
      <div className="flex items-center gap-4 lg:gap-6 animate-fade-in shrink-0" style={{ animationDelay: '100ms' }}>
        {isPos ? (
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-2 text-tertiary">
              <Calendar className="w-4 h-4 text-outline" />
              <span className="font-mono text-[10px] lg:text-xs hidden sm:inline">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-tertiary">
              <Clock className="w-4 h-4 text-outline" />
              <span className="font-mono text-[10px] lg:text-xs hidden sm:inline">{formattedTime}</span>
            </div>
          </div>
        ) : isInventory ? (
          <div className="flex items-center gap-3 lg:gap-4">
            <div className="relative flex items-center bg-surface-container-low px-3 py-2 rounded-full border border-outline-variant/10">
              <Search className="w-4 h-4 text-outline" />
              <input
                className="bg-transparent border-none focus:ring-0 text-sm font-body w-32 lg:w-48 text-on-surface outline-none ml-2"
                placeholder="Search Archives..."
                type="text"
                value={inventorySearch}
                onChange={(e) => useSearchStore.getState().setInventorySearch(e.target.value)}
              />
            </div>
          </div>
        ) : isAnalytics ? (
          <div className="flex items-center gap-4 lg:gap-6">
            <div className="hidden sm:flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/20 hover:border-primary/30 transition-colors">
              <Calendar className="w-4 h-4 text-primary" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => useAnalyticsStore.getState().setSelectedDate(e.target.value)}
                className="bg-transparent border-none focus:ring-0 font-mono text-xs uppercase text-on-surface font-bold outline-none cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-3 lg:gap-4">
              <button 
                id="export-excel-btn" 
                onClick={handleExport}
                disabled={isExporting}
                className="bg-primary hover:bg-primary-container text-on-primary px-4 lg:px-6 py-2 lg:py-2.5 rounded-lg flex items-center gap-2 transition-all active:scale-95 font-body font-semibold text-xs lg:text-sm shadow-sm hover:shadow-md disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span className="hidden sm:inline">{isExporting ? 'Exporting...' : 'Export to Excel'}</span>
                <span className="sm:hidden">Export</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 text-[#3b290c]/70">
            <div className="flex items-center gap-2 text-tertiary">
              <Calendar className="w-4 h-4 text-outline cursor-pointer hover:text-primary transition-colors" />
              <span className="font-mono text-[10px] hidden sm:inline">{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2 text-tertiary mr-2">
              <Clock className="w-4 h-4 text-outline cursor-pointer hover:text-primary transition-colors" />
              <span className="font-mono text-[10px] hidden sm:inline">{formattedTime}</span>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
