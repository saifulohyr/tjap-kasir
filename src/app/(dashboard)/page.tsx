'use client'

import { MoreVertical, CheckCircle2, Loader2, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

type TransactionItem = {
  id: string
  title: string
  quantity: number
  note: string | null
}

type Order = {
  id: string
  ticket_number: string
  order_type: string
  created_at: string
  kitchen_status: 'pending' | 'cooking' | 'completed'
  transaction_items: TransactionItem[]
}

export default function KitchenDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastSync, setLastSync] = useState<string>('--:--:--')

  const fetchOrders = async () => {
    // Only fetch today's orders to avoid massive payload
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('transactions')
      .select(`
        id, ticket_number, order_type, created_at, kitchen_status,
        transaction_items ( id, title, quantity, note )
      `)
      .gte('created_at', today.toISOString())
      .in('status', ['Completed']) // Only paid ones
      .order('created_at', { ascending: true }) // Oldest first
      
    if (error) {
      console.error("Error fetching orders:", error)
    }
    if (data) {
      setOrders(data as unknown as Order[])
    }
    setLastSync(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
    setIsLoading(false)
  }

  useEffect(() => {
    // initial fetch
    // eslint-disable-next-line
    fetchOrders()

    const channel = supabase.channel('kitchen-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => {
          fetchOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const updateKitchenStatus = async (id: string, status: 'cooking' | 'completed') => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, kitchen_status: status } : o))
    await supabase.from('transactions').update({ kitchen_status: status }).eq('id', id)
  }

  const incoming = orders.filter(o => o.kitchen_status === 'pending')
  const processing = orders.filter(o => o.kitchen_status === 'cooking')
  const done = orders.filter(o => o.kitchen_status === 'completed').sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  // format time mm:ss since created
  const formatTime = (iso: string) => {
    const date = new Date(iso)
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  const calculateElapsed = (iso: string) => {
    const diff = Math.floor((new Date().getTime() - new Date(iso).getTime()) / 60000)
    return diff > 0 ? `${diff}m` : '<1m'
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-tertiary">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="font-mono text-sm uppercase tracking-widest font-bold">Sinkronisasi Dapur...</span>
      </div>
    )
  }

  return (
    <>
      <div className="flex-1 p-4 lg:p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6 overflow-hidden bg-background">
        
        {/* ── Column: Incoming (Pending) ── */}
        <div className="flex flex-col h-full space-y-3 min-w-0">
          <div className="flex items-center justify-between px-1 shrink-0">
            <h3 className="font-serif text-lg lg:text-xl font-bold text-tertiary flex items-center gap-2">
              Pesanan Masuk
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-[10px] lg:text-xs font-mono">{incoming.length.toString().padStart(2, '0')}</span>
            </h3>
            <MoreVertical className="w-5 h-5 text-outline cursor-pointer hover:text-primary transition-colors" />
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {incoming.length === 0 ? (
               <div className="h-full flex items-center justify-center font-mono opacity-40 text-sm">Belum ada pesanan masuk.</div>
            ) : (
              incoming.map((order, idx) => (
                <div key={order.id} className="order-card-gradient rounded-xl p-4 lg:p-5 border border-outline-variant/20 shadow-sm relative overflow-hidden flex flex-col gap-3 animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] text-secondary uppercase tracking-widest">{order.ticket_number}</span>
                      <h4 className="font-serif text-base lg:text-lg font-bold text-on-surface truncate">{order.order_type}</h4>
                    </div>
                    <div className="font-mono text-xs lg:text-sm font-bold text-error bg-error-container/30 px-2 py-1 rounded shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(order.created_at)}
                    </div>
                  </div>
                  <div className="space-y-1.5 py-2 border-y border-outline-variant/10">
                    {order.transaction_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="text-sm text-on-surface font-semibold shrink-0">{item.quantity}x {item.title}</p>
                          {item.note && <p className="text-[10px] font-mono text-error uppercase italic truncate">Note: {item.note}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => updateKitchenStatus(order.id, 'cooking')}
                    className="w-full py-2.5 bg-primary text-white rounded-lg font-bold text-sm tracking-widest uppercase hover:bg-primary-hover active:scale-[0.98] transition-all shadow-button">
                    Proses Sekarang
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Column: Processing (Cooking) ── */}
        <div className="flex flex-col h-full space-y-3 min-w-0">
          <div className="flex items-center justify-between px-1 shrink-0">
            <h3 className="font-serif text-lg lg:text-xl font-bold text-tertiary flex items-center gap-2">
              Sedang Dibuat
              <span className="bg-secondary/10 text-secondary px-2 py-0.5 rounded text-[10px] lg:text-xs font-mono">{processing.length.toString().padStart(2, '0')}</span>
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
            {processing.length === 0 ? (
               <div className="h-full flex items-center justify-center font-mono opacity-40 text-sm">Tidak ada yang sedang diproses.</div>
            ) : (
              processing.map((order) => (
                <div key={order.id} className="bg-surface-container-highest/30 rounded-xl p-4 lg:p-5 border border-primary/20 shadow-elevated relative flex flex-col gap-3 transition-transform hover:-translate-y-0.5 duration-300">
                  <div className="absolute top-0 right-0 w-12 h-1 bg-primary rounded-bl-sm"></div>
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] text-primary uppercase tracking-widest font-bold">In Production • {order.ticket_number}</span>
                      <h4 className="font-serif text-base lg:text-lg font-bold text-on-surface truncate">{order.order_type}</h4>
                    </div>
                    <div className="font-mono text-xs lg:text-sm font-bold text-on-primary bg-primary px-2 py-1 rounded shadow-sm shrink-0">
                      {calculateElapsed(order.created_at)}
                    </div>
                  </div>
                  <div className="space-y-1.5 py-2 border-y border-outline-variant/20">
                    {order.transaction_items.map((item) => (
                      <div key={item.id} className="flex flex-col items-start gap-0.5 w-full">
                        <p className="text-sm text-on-surface font-bold break-words">{item.quantity}x {item.title}</p>
                        {item.note && <span className="text-[10px] font-mono text-error font-bold uppercase animate-pulse">Note: {item.note}</span>}
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => updateKitchenStatus(order.id, 'completed')}
                    className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg font-bold text-sm tracking-widest uppercase shadow-button hover:opacity-90 active:scale-[0.98] transition-all">
                    Selesai
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Column: Done (Completed) ── */}
        <div className="flex flex-col h-full space-y-3 min-w-0 hidden xl:flex">
          <div className="flex items-center justify-between px-1 shrink-0">
            <h3 className="font-serif text-lg lg:text-xl font-bold text-tertiary flex items-center gap-2">
              Selesai
              <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded text-[10px] lg:text-xs font-mono">{done.length.toString().padStart(2, '0')}</span>
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar opacity-70 grayscale-[0.1] hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            {done.length === 0 ? (
               <div className="h-full flex items-center justify-center font-mono opacity-40 text-sm">Belum ada order selesai hari ini.</div>
            ) : (
              done.map((order) => (
                <div key={order.id} className="bg-surface-container-low rounded-xl p-4 lg:p-5 border border-outline-variant/10 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono text-[10px] text-secondary uppercase tracking-widest">{order.ticket_number}</span>
                      <h4 className="font-serif text-base lg:text-lg font-bold text-on-surface">{order.order_type}</h4>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0" />
                  </div>
                  <div className="space-y-1.5 py-2 border-y border-outline-variant/5">
                    {order.transaction_items.map(item => (
                       <p key={item.id} className="text-sm text-on-surface font-medium line-through opacity-70">{item.quantity}x {item.title}</p>
                    ))}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-secondary font-mono text-[10px] uppercase">
                    Closed • {formatTime(order.created_at)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ── System Status Bar ── */}
      <footer className="bg-surface-container-highest px-4 lg:px-8 py-2 flex flex-wrap justify-between items-center gap-2 border-t border-outline-variant/15 z-40 relative shrink-0">
        <div className="flex gap-4 lg:gap-6 items-center flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-secondary uppercase">All Orders:</span>
            <span className="font-mono text-[11px] font-bold text-on-surface">{orders.length}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="flex items-center gap-1 text-green-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="font-mono text-[10px] uppercase font-bold text-green-800">Realtime Active</span>
          </div>
          <span className="text-[10px] font-mono text-secondary uppercase hidden lg:inline">Last Sync: {lastSync}</span>
        </div>
      </footer>
    </>
  )
}
