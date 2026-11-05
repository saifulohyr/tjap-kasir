'use client'

import { Banknote, X, Delete, CheckCircle2, Loader2, Printer, QrCode } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/useCartStore'
import { ReceiptData } from './PrintReceipt'
import { useBluetoothPrinter } from '@/hooks/useBluetoothPrinter'
import { generateEscPosReceipt } from '@/utils/escpos'
import { saveOfflineTransaction } from '@/utils/offlineSync'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onReceiptReady: (data: ReceiptData) => void
  btHook: ReturnType<typeof useBluetoothPrinter>
}

export default function PaymentModal({ isOpen, onClose, onReceiptReady, btHook }: PaymentModalProps) {
  const { cart, getSubtotal, clearCart, orderType } = useCartStore()
  const [cashReceivedStr, setCashReceivedStr] = useState('0')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [cashierName, setCashierName] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QRIS'>('Cash')
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null)

  const { isConnected, isConnecting, error: btError, connect, print } = btHook
  const [changeDueSnapshot, setChangeDueSnapshot] = useState(0)
  
  const total = getSubtotal()

  // Reset calculator when modal newly opens
  useEffect(() => {
    if (isOpen) {
      setCashReceivedStr(useCartStore.getState().getSubtotal().toString())
      setIsProcessing(false)
      setIsSuccess(false)
      setChangeDueSnapshot(0)
      setCashierName('')
      setCustomerName('')
      setPaymentMethod('Cash')
    }
  }, [isOpen])

  // Automatically adjust cash received when payment method changes
  useEffect(() => {
    if (paymentMethod === 'QRIS') {
      setCashReceivedStr(total.toString())
    } else if (isOpen) {
      setCashReceivedStr(total.toString())
    }
  }, [paymentMethod, total, isOpen])

  if (!isOpen) return null

  const handleNumpad = (num: string | number) => {
    if (paymentMethod === 'QRIS') return
    setCashReceivedStr(prev => {
      if (prev === '0') return num.toString()
      return prev + num.toString()
    })
  }
  
  const handleDelete = () => {
    if (paymentMethod === 'QRIS') return
    setCashReceivedStr(prev => {
      if (prev.length <= 1) return '0'
      return prev.slice(0, -1)
    })
  }

  const cashReceived = parseInt(cashReceivedStr) || 0
  const changeDue = Math.max(0, cashReceived - total)
  
  // Smart quick cash options (Uang Pas + rounded Indonesian Rupiah bills)
  const getQuickCashOptions = (): number[] => {
    if (total <= 0) return [10000, 20000, 50000, 100000]
    const opts = new Set<number>()
    opts.add(total) // Uang pas

    const next10k = Math.ceil(total / 10000) * 10000
    if (next10k > total) opts.add(next10k)

    for (const bill of [20000, 50000, 100000]) {
      if (bill > total) opts.add(bill)
    }

    if (total >= 100000) {
      const next50k = Math.ceil(total / 50000) * 50000
      if (next50k > total) opts.add(next50k)
      const next100k = Math.ceil(total / 100000) * 100000
      if (next100k > total) opts.add(next100k)
    }

    return Array.from(opts).sort((a, b) => a - b).slice(0, 4)
  }

  const quickCashList = getQuickCashOptions()
  
  const handleCheckout = async () => {
    if (cashReceived < total) {
      alert("Uang yang diterima kurang!")
      return
    }

    setIsProcessing(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          total,
          paymentMethod,
          orderType,
          customerName: customerName || null,
          cashierName: cashierName || 'Kasir'
        })
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Checkout failed')
      }

      const { ticketNumber, dailySequence } = data

      // Snapshot receipt data BEFORE clearing cart, and send to parent
      const receiptSnapshot: ReceiptData = {
        ticketNumber,
        items: cart.map(i => ({ title: i.title, quantity: i.quantity, price: i.price, note: i.note })),
        total,
        cashReceived,
        changeDue,
        date: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
        cashierName: cashierName || 'Shift Active',
        customerName: customerName || undefined,
        paymentMethod,
        orderType,
        dailySequence
      }

      // Send receipt data to parent (page level) BEFORE clearing cart
      onReceiptReady(receiptSnapshot)
      setLastReceipt(receiptSnapshot)
      setChangeDueSnapshot(changeDue)

      clearCart()
      setIsSuccess(true)
    } catch (e: unknown) {
      console.error(e)
      
      // Offline fallback: if network is down, queue transaction locally
      const isNetworkDown = typeof window !== 'undefined' && (!window.navigator.onLine || (e instanceof TypeError && e.message.includes('fetch')))
      if (isNetworkDown) {
        const offlineTicket = `TX-OFF-${Math.floor(1000 + Math.random() * 9000)}`
        saveOfflineTransaction({
          items: cart,
          total,
          paymentMethod,
          orderType: orderType || 'Dine In',
          customerName: customerName || null,
          cashierName: cashierName || 'Kasir',
          ticketNumber: offlineTicket
        })

        const receiptSnapshot: ReceiptData = {
          ticketNumber: offlineTicket,
          items: cart.map(i => ({ title: i.title, quantity: i.quantity, price: i.price, note: i.note })),
          total,
          cashReceived,
          changeDue,
          date: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) + ' (OFFLINE)',
          cashierName: cashierName || 'Shift Active',
          customerName: customerName || undefined,
          paymentMethod,
          orderType,
          dailySequence: 0
        }

        onReceiptReady(receiptSnapshot)
        setLastReceipt(receiptSnapshot)
        setChangeDueSnapshot(changeDue)

        clearCart()
        setIsSuccess(true)
        alert("MODE OFFLINE:\nKoneksi internet tidak tersedia. Transaksi berhasil disimpan di perangkat lokal dan struk siap dicetak. Transaksi akan otomatis tersinkronisasi ke server saat online.")
        return
      }

      const msg = e instanceof Error ? e.message : 'Unknown error'
      alert(`Transaction Error: ${msg}`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePrint = async () => {
    if (isConnected && lastReceipt) {
      try {
        // Fallback to plain text header since hardware doesn't support the raster image command
        const buffer = generateEscPosReceipt(lastReceipt, "TJAP CHACOH", "Ciguling, Gang Bima No.20C\nMajenang")
        await print(buffer)
        return
      } catch (err) {
        console.error("Bluetooth print failed, falling back to window.print", err)
      }
    }

    // Fallback
    setTimeout(() => {
      window.print()
    }, 100)
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 sm:p-6 md:p-8 animate-fade-in">
      <div className="absolute inset-0 bg-tertiary/20 backdrop-blur-md transition-opacity" onClick={isSuccess ? undefined : onClose}></div>

      <div className="relative w-full max-w-4xl bg-white rounded-2xl flex flex-col md:flex-row overflow-hidden border border-slate-200 shadow-2xl max-h-[94vh] overflow-y-auto custom-scrollbar">
        
        {isSuccess ? (
          <div className="w-full flex flex-col items-center justify-center p-8 md:p-12 py-16 text-center">
            <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-5 animate-slide-up">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl md:text-3xl text-slate-900 font-bold mb-2 animate-slide-up" style={{ animationDelay: '0.1s'}}>Pembayaran Berhasil!</h1>
            <p className="font-mono text-slate-500 mb-8 animate-slide-up text-sm md:text-base" style={{ animationDelay: '0.2s'}}>Kembalian: <strong className="text-xl md:text-2xl text-slate-900 font-bold">Rp {changeDueSnapshot.toLocaleString('id-ID')}</strong></p>
            
            <div className="flex gap-3 w-full max-w-sm flex-col animate-slide-up" style={{ animationDelay: '0.3s'}}>
              {!isConnected && (
                <button 
                  onClick={connect}
                  disabled={isConnecting}
                  className="w-full py-2.5 bg-blue-50 text-blue-600 font-bold rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors shadow-2xs flex items-center justify-center gap-2 uppercase tracking-wide text-xs font-mono"
                >
                  {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />} 
                  {isConnecting ? 'Menghubungkan...' : 'Hubungkan Printer Thermal'}
                </button>
              )}
              {btError && <p className="text-red-500 text-[10px] font-mono">{btError}</p>}
              
              <div className="flex gap-3 w-full flex-col sm:flex-row">
                <button 
                  onClick={handlePrint}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl border border-slate-200 transition-colors shadow-2xs flex items-center justify-center gap-2 text-xs md:text-sm font-mono"
                >
                  <Printer className="w-4 h-4" /> Cetak Struk
                </button>
                <button 
                  onClick={onClose}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-600/20 active:scale-95 transition-all text-xs md:text-sm font-mono"
                >
                  Pesanan Baru
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Left Sidebar - Payment Method */}
            <aside className="w-full md:w-1/3 bg-slate-50 p-5 md:p-6 flex flex-col gap-4 md:gap-6 border-b md:border-b-0 md:border-r border-slate-200">
              <div>
                <h2 className="text-xl md:text-2xl text-slate-900 font-bold">Metode Bayar</h2>
                <p className="font-mono text-[10px] uppercase tracking-wider text-slate-500 font-semibold mt-0.5">Pilih cara pembayaran</p>
              </div>
              <nav className="flex md:flex-col gap-2.5">
                <button 
                  onClick={() => setPaymentMethod('Cash')}
                  className={`flex-1 md:flex-none flex items-center gap-3 p-3 rounded-xl border transition-all shadow-2xs cursor-pointer ${
                    paymentMethod === 'Cash' 
                      ? 'bg-white text-red-600 border-red-500 shadow-sm font-bold' 
                      : 'bg-transparent text-slate-600 border-slate-200 hover:bg-white'
                  }`}
                >
                  <Banknote className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                  <span className="font-semibold text-sm md:text-base">Tunai</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`flex-1 md:flex-none flex items-center gap-3 p-3 rounded-xl border transition-all shadow-2xs cursor-pointer ${
                    paymentMethod === 'QRIS' 
                      ? 'bg-white text-red-600 border-red-500 shadow-sm font-bold' 
                      : 'bg-transparent text-slate-600 border-slate-200 hover:bg-white'
                  }`}
                >
                  <QrCode className="w-5 h-5 md:w-6 md:h-6 shrink-0" />
                  <span className="font-semibold text-sm md:text-base">QRIS</span>
                </button>
              </nav>
            </aside>

            {/* Right Main Content - Cash Calculator */}
            <main className="flex-1 p-5 md:p-7 flex flex-col gap-5 md:gap-6 bg-white">
              <div className="flex justify-between items-start">
                <div className="space-y-0.5">
                  <span className="font-mono text-[10px] md:text-xs text-slate-400 uppercase tracking-wider font-bold block">Total Tagihan</span>
                  <h1 className="font-mono text-2xl md:text-4xl font-bold text-red-600">Rp {total.toLocaleString('id-ID')}</h1>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors active:scale-95">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start flex-1">
                {/* Numpad Input Area */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="font-mono text-[10px] md:text-xs uppercase text-slate-500 font-bold tracking-wider block">Uang Diterima (Cash)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-slate-400 font-bold">Rp</span>
                      <input 
                        className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 py-3 pl-11 pr-4 font-mono text-xl md:text-2xl focus:outline-none text-slate-900 font-bold rounded-xl transition-colors" 
                        type="text" 
                        readOnly
                        value={cashReceived.toLocaleString('id-ID')}
                      />
                    </div>
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className={`flex flex-wrap gap-1.5 transition-opacity duration-300 ${paymentMethod === 'QRIS' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                    {quickCashList.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setCashReceivedStr(opt.toString())}
                        className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                          cashReceived === opt
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {opt === total ? 'Uang Pas' : `Rp ${opt.toLocaleString('id-ID')}`}
                      </button>
                    ))}
                  </div>

                  <div className={`grid grid-cols-3 gap-1.5 transition-opacity duration-300 ${paymentMethod === 'QRIS' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '00', 0].map((num) => (
                      <button 
                        key={num} 
                        onClick={() => handleNumpad(num)}
                        className="h-11 md:h-12 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 font-mono text-base md:text-lg font-bold text-slate-800 rounded-xl transition-colors active:scale-95 shadow-2xs cursor-pointer"
                      >
                        {num}
                      </button>
                    ))}
                    <button onClick={handleDelete} className="h-11 md:h-12 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl flex items-center justify-center transition-colors active:scale-95 shadow-2xs cursor-pointer">
                      <Delete className="w-5 h-5 text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Change Due & Action */}
                <div className="flex flex-col h-full gap-4">
                  <div className="bg-slate-50 p-4 md:p-5 rounded-xl border border-slate-200 flex-1 flex flex-col justify-center">
                    <label className="font-mono text-[10px] md:text-xs uppercase text-slate-500 mb-1.5 block font-bold tracking-wider">
                      {cashReceived >= total ? 'Kembalian (Change Due)' : 'Kurang Bayar'}
                    </label>
                    <div className="flex flex-col justify-center">
                      <span className={`font-mono text-2xl md:text-3xl font-bold ${
                        cashReceived >= total ? 'text-slate-900' : 'text-red-600'
                      }`}>
                        {cashReceived >= total 
                          ? `Rp ${changeDue.toLocaleString('id-ID')}`
                          : `- Rp ${(total - cashReceived).toLocaleString('id-ID')}`
                        }
                      </span>
                      <div className="mt-2.5 flex gap-2">
                        {cashReceived >= total ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold text-[10px] rounded uppercase tracking-wider">
                            Uang Cukup ✓
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 font-mono font-bold text-[10px] rounded uppercase tracking-wider">
                            Kurang Pembayaran
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 mt-auto pt-1">
                    <div className="mb-2 flex gap-2.5">
                      <div className="flex-1">
                        <label className="font-mono text-[10px] uppercase text-slate-500 mb-1 block font-bold tracking-wider">Nama Pelanggan</label>
                        <input 
                          type="text" 
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Opsional (Cth: Budi)"
                          className={`w-full bg-slate-50 border border-slate-200 focus:border-red-500 px-3 py-2 text-xs md:text-sm font-mono text-slate-900 focus:outline-none rounded-lg transition-colors`}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="font-mono text-[10px] uppercase text-slate-500 mb-1 block font-bold tracking-wider">Nama Kasir</label>
                        <input 
                          type="text" 
                          value={cashierName}
                          onChange={(e) => setCashierName(e.target.value)}
                          placeholder="Harus diisi"
                          className={`w-full bg-slate-50 border ${cashierName.trim() === '' ? 'border-red-400 focus:border-red-500' : 'border-slate-200 focus:border-red-500'} px-3 py-2 text-xs md:text-sm font-mono text-slate-900 focus:outline-none rounded-lg transition-colors`}
                        />
                      </div>
                    </div>
                    <button 
                      onClick={handleCheckout} 
                      disabled={isProcessing || cashReceived < total || cashierName.trim() === ''}
                      className={`w-full bg-red-600 hover:bg-red-700 text-white py-3.5 md:py-4 rounded-xl font-bold text-sm md:text-base flex items-center justify-center gap-2 shadow-md shadow-red-600/20 transition-all cursor-pointer ${
                        isProcessing || cashReceived < total || cashierName.trim() === '' ? 'opacity-50 cursor-not-allowed grayscale' : 'active:scale-[0.98]'
                      }`}
                    >
                      {isProcessing ? 'Memproses...' : 'Konfirmasi Pembayaran'}
                      {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </main>
          </>
        )}
      </div>
    </div>
  )
}
