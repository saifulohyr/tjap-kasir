'use client'

import { Banknote, X, Delete, CheckCircle2, Loader2, Printer, QrCode } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCartStore } from '@/store/useCartStore'
import { supabase } from '@/lib/supabase'
import { ReceiptData } from './PrintReceipt'
import { useBluetoothPrinter } from '@/hooks/useBluetoothPrinter'
import { generateEscPosReceipt, convertImageToEscPos } from '@/utils/escpos'

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onReceiptReady: (data: ReceiptData) => void
}

export default function PaymentModal({ isOpen, onClose, onReceiptReady }: PaymentModalProps) {
  const { cart, getSubtotal, clearCart, orderType } = useCartStore()
  const [cashReceivedStr, setCashReceivedStr] = useState('0')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [cashierName, setCashierName] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'QRIS'>('Cash')
  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null)

  const { isConnected, isConnecting, error: btError, connect, print } = useBluetoothPrinter()
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
  
  const handleCheckout = async () => {
    if (cashReceived < total) {
      alert("Uang yang diterima kurang!")
      return
    }

    setIsProcessing(true)
    try {
      const ticketNumber = `TX-${Math.floor(10000 + Math.random() * 90000)}`
      
      const { data: txn, error } = await supabase.from('transactions').insert({
        ticket_number: ticketNumber,
        total_amount: total,
        payment_method: paymentMethod,
        status: 'Completed',
        order_type: orderType
      }).select().single()

      if (error) throw error

      if (txn) {
        const items = cart.map(item => ({
          transaction_id: txn.id,
          product_id: item.id,
          title: item.title,
          quantity: item.quantity,
          price_at_time: item.price,
          note: item.note ?? null
        }))

        const { error: itemsError } = await supabase.from('transaction_items').insert(items)
        if (itemsError) throw itemsError

        // Deduct stock natively
        for (const item of cart) {
          const { data: prod } = await supabase.from('products').select('stock').eq('id', item.id).single()
          if (prod) {
            await supabase.from('products').update({ stock: Math.max(0, prod.stock - item.quantity) }).eq('id', item.id)
          }
        }
      }

      // Snapshot receipt data BEFORE clearing cart, and send to parent
      const receiptSnapshot: ReceiptData = {
        ticketNumber,
        items: cart.map(i => ({ title: i.title, quantity: i.quantity, price: i.price })),
        total,
        cashReceived,
        changeDue,
        date: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
        cashierName: cashierName || 'Shift Active',
        paymentMethod,
        orderType
      }

      // Send receipt data to parent (page level) BEFORE clearing cart
      onReceiptReady(receiptSnapshot)
      setLastReceipt(receiptSnapshot)
      setChangeDueSnapshot(changeDue)

      clearCart()
      setIsSuccess(true)
    } catch (e) {
      console.error(e)
      alert("Transaction Error: Verify database connectivity or RLS permissions.")
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

      <div className="relative w-full max-w-5xl bg-surface-container-low parchment-glow rounded-xl flex flex-col md:flex-row overflow-hidden border border-outline-variant/15 shadow-[0_32px_64px_rgba(62,39,35,0.12)] max-w-4xl">
        
        {isSuccess ? (
          <div className="w-full flex flex-col items-center justify-center p-12 py-24 text-center">
            <div className="w-24 h-24 bg-[#2d5a27]/10 text-[#2d5a27] rounded-full flex items-center justify-center mb-6 animate-slide-up">
              <CheckCircle2 className="w-12 h-12" />
            </div>
            <h1 className="font-serif text-4xl text-tertiary font-bold mb-2 animate-slide-up" style={{ animationDelay: '0.1s'}}>Pembayaran Berhasil!</h1>
            <p className="font-mono text-on-surface-variant mb-12 animate-slide-up" style={{ animationDelay: '0.2s'}}>Kembalian: <strong className="text-xl">Rp {changeDueSnapshot.toLocaleString('id-ID')}</strong></p>
            
            <div className="flex gap-4 w-full max-w-sm flex-col animate-slide-up" style={{ animationDelay: '0.3s'}}>
              {!isConnected && (
                <button 
                  onClick={connect}
                  disabled={isConnecting}
                  className="w-full py-3 bg-blue-50 text-blue-600 font-bold rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm flex items-center justify-center gap-2 uppercase tracking-wide text-xs font-mono"
                >
                  {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />} 
                  {isConnecting ? 'Menghubungkan...' : 'Connect Bluetooth Printer'}
                </button>
              )}
              {btError && <p className="text-error text-[10px] font-mono">{btError}</p>}
              
              <div className="flex gap-4 w-full flex-col md:flex-row">
                <button 
                  onClick={handlePrint}
                  className="flex-1 py-4 bg-surface-container-highest text-primary font-bold rounded-xl border border-primary/20 hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center gap-2 uppercase tracking-wide text-xs md:text-sm font-mono"
                >
                  <Printer className="w-5 h-5" /> Cetak Struk
                </button>
                <button 
                  onClick={onClose}
                  className="flex-1 py-4 varnish-cta text-white font-bold rounded-xl shadow-lg border border-primary/20 hover:opacity-90 active:scale-95 transition-all text-xs md:text-sm uppercase tracking-wide font-mono"
                >
                  Pesanan Baru
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Left Sidebar - Payment Method */}
            <aside className="w-full md:w-1/3 bg-surface-container-high p-6 md:p-8 flex flex-col gap-6 md:gap-8 border-b md:border-b-0 md:border-r border-outline-variant/10">
              <div>
                <h2 className="font-serif text-2xl md:text-3xl text-primary mb-2 font-bold">Payment Method</h2>
                <p className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-on-surface-variant font-bold">Select Transaction Type</p>
              </div>
              <nav className="flex flex-col gap-3 md:gap-4">
                <button 
                  onClick={() => setPaymentMethod('Cash')}
                  className={`flex items-center gap-4 p-3 md:p-4 rounded-lg border-2 transition-all duration-300 shadow-sm ${
                    paymentMethod === 'Cash' 
                      ? 'bg-surface-container-lowest text-primary border-primary/20' 
                      : 'bg-transparent text-on-surface-variant border-transparent hover:bg-surface-container-low'
                  }`}
                >
                  <Banknote className="w-6 h-6 md:w-7 md:h-7" />
                  <span className="font-serif italic text-lg md:text-xl font-bold">Tunai</span>
                </button>
                <button 
                  onClick={() => setPaymentMethod('QRIS')}
                  className={`flex items-center gap-4 p-3 md:p-4 rounded-lg border-2 transition-all duration-300 shadow-sm ${
                    paymentMethod === 'QRIS' 
                      ? 'bg-surface-container-lowest text-primary border-primary/20' 
                      : 'bg-transparent text-on-surface-variant border-transparent hover:bg-surface-container-low'
                  }`}
                >
                  <QrCode className="w-6 h-6 md:w-7 md:h-7" />
                  <span className="font-serif italic text-lg md:text-xl font-bold">QRIS</span>
                </button>
              </nav>
            </aside>

            {/* Right Main Content - Cash Calculator */}
            <main className="flex-1 p-6 md:p-8 flex flex-col gap-6 md:gap-8 bg-surface-container-lowest">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] md:text-xs text-on-surface-variant uppercase tracking-tighter font-bold mb-1 block">Total Billable</span>
                  <h1 className="font-mono text-3xl md:text-5xl font-bold text-tertiary">Rp {total.toLocaleString('id-ID')}</h1>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full transition-colors active:scale-95">
                  <X className="w-5 h-5 md:w-6 md:h-6 text-on-surface-variant" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start flex-1">
                {/* Numpad Input Area */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="font-mono text-[10px] md:text-xs uppercase text-on-secondary-container font-bold tracking-wider block">Uang Diterima (Cash Received)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-mono text-on-surface-variant font-bold">Rp</span>
                      <input 
                        className="w-full bg-surface-container-low border-b-2 border-primary pt-6 pb-2 px-12 font-mono text-2xl md:text-3xl focus:outline-none text-tertiary font-bold rounded-t-lg" 
                        type="text" 
                        readOnly
                        value={cashReceived.toLocaleString('id-ID')}
                      />
                    </div>
                  </div>
                  <div className={`grid grid-cols-3 gap-2 transition-opacity duration-300 ${paymentMethod === 'QRIS' ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, '00', 0].map((num) => (
                      <button 
                        key={num} 
                        onClick={() => handleNumpad(num)}
                        className="h-12 md:h-14 bg-surface-container-low font-mono text-lg md:text-xl font-bold text-on-surface hover:bg-surface-variant rounded-lg transition-colors active:scale-95 shadow-sm"
                      >
                        {num}
                      </button>
                    ))}
                    <button onClick={handleDelete} className="h-12 md:h-14 bg-primary-container/10 text-primary-container hover:bg-primary-container/20 rounded-lg flex items-center justify-center transition-colors active:scale-95 shadow-sm">
                      <Delete className="w-6 h-6 text-primary" />
                    </button>
                  </div>
                </div>

                {/* Change Due & Action */}
                <div className="flex flex-col h-full gap-4 md:gap-6">
                  <div className="bg-surface-container-low p-5 md:p-6 rounded-xl border border-outline-variant/10 flex-1 flex flex-col justify-center">
                    <label className="font-mono text-[10px] md:text-xs uppercase text-on-surface-variant mb-2 md:mb-4 block font-bold tracking-wider">Kembalian (Change Due)</label>
                    <div className="flex flex-col justify-center">
                      <span className="font-mono text-3xl md:text-4xl text-primary font-bold">Rp {changeDue.toLocaleString('id-ID')}</span>
                      <div className="mt-3 md:mt-4 flex gap-2">
                        {cashReceived >= total && (
                          <span className="px-2 py-1 bg-secondary-container text-on-secondary-container font-mono font-bold text-[10px] rounded uppercase tracking-wider">
                            Sufficient Funds
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 mt-auto pt-2">
                    <div className="mb-3">
                      <label className="font-mono text-[10px] uppercase text-on-surface-variant mb-1 block font-bold tracking-wider">Nama Kasir (Shift)</label>
                      <input 
                        type="text" 
                        value={cashierName}
                        onChange={(e) => setCashierName(e.target.value)}
                        placeholder="Harus diisi (Cth: Ahong)"
                        className={`w-full bg-surface-container-low border ${cashierName.trim() === '' ? 'border-error/60 focus:border-error' : 'border-outline-variant/30 focus:border-primary'} px-3 py-2 text-xs md:text-sm font-mono text-tertiary focus:outline-none rounded-lg transition-colors`}
                      />
                    </div>
                    <button 
                      onClick={handleCheckout} 
                      disabled={isProcessing || cashReceived < total || cashierName.trim() === ''}
                      className={`w-full varnish-cta text-white py-4 md:py-5 rounded-lg font-serif italic text-lg md:text-xl font-bold flex items-center justify-center gap-3 shadow-xl transition-all hover:bg-primary-container ${
                        isProcessing || cashReceived < total || cashierName.trim() === '' ? 'opacity-50 cursor-not-allowed grayscale' : 'active:scale-[0.98] hover:opacity-90'
                      }`}
                    >
                      {isProcessing ? 'Processing...' : 'Konfirmasi Pembayaran'}
                      {isProcessing ? <Loader2 className="w-5 h-5 md:w-6 md:h-6 animate-spin" /> : <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />}
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
