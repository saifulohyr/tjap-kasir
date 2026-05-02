'use client'

import { CircleDollarSign, Receipt, Utensils, TrendingUp, Timer, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAnalyticsStore } from "@/store/useAnalyticsStore"

interface TopItem {
  id: string
  title: string
  category: string
  qty: number
  revenue: number
}

interface RecentTxn {
  id: string
  ticket_number: string
  type: string
  amount: number
}

export default function AnalyticsPage() {
  const [revenue, setRevenue] = useState(0)
  const [revenueCash, setRevenueCash] = useState(0)
  const [revenueQris, setRevenueQris] = useState(0)
  const [txnCnt, setTxnCnt] = useState(0)
  const [bestSeller, setBestSeller] = useState({ title: 'No Data', category: '-', qty: 0})
  const [recentTxns, setRecentTxns] = useState<RecentTxn[]>([])
  const [topItems, setTopItems] = useState<TopItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const selectedDate = useAnalyticsStore(state => state.selectedDate)
  const isToday = selectedDate === new Date().toLocaleDateString('en-CA')
  const dateLabel = isToday ? 'Today' : selectedDate

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const start = new Date(selectedDate)
        start.setHours(0, 0, 0, 0)
        
        const end = new Date(selectedDate)
        end.setHours(23, 59, 59, 999)

        // Fetch day's transactions
        const { data: txns } = await supabase
          .from('transactions')
          .select('*')
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
          .order('created_at', { ascending: false })

        // Fetch day's transaction items linked to products
        const { data: items } = await supabase
          .from('transaction_items')
          .select(`
            *,
            products (
              category
            )
          `)
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())

        if (txns) {
          setTxnCnt(txns.length)
          setRevenue(txns.reduce((sum, t) => sum + Number(t.total_amount), 0))
          setRevenueCash(txns.filter(t => t.payment_method === 'Cash').reduce((sum, t) => sum + Number(t.total_amount), 0))
          setRevenueQris(txns.filter(t => t.payment_method === 'QRIS').reduce((sum, t) => sum + Number(t.total_amount), 0))
          setRecentTxns(txns.slice(0, 5).map((t, idx) => ({
            id: t.id,
            ticket_number: t.ticket_number,
            type: t.order_type, // Using actual data from DB
            amount: Number(t.total_amount)
          })))
        }

        if (items) {
          const itemMap: Record<string, TopItem> = {}
          items.forEach(item => {
            const pid = item.product_id || 'unknown'
            if (!itemMap[pid]) {
              itemMap[pid] = {
                id: pid,
                title: item.title,
                category: (item.products as { category?: string } | null)?.category || 'MIXED',
                qty: 0,
                revenue: 0
              }
            }
            itemMap[pid].qty += item.quantity
            itemMap[pid].revenue += (item.quantity * Number(item.price_at_time))
          })

          const sortedItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty)
          setTopItems(sortedItems)
          
          if (sortedItems.length > 0) {
            setBestSeller({
              title: sortedItems[0].title,
              category: sortedItems[0].category,
              qty: sortedItems[0].qty
            })
          }
        }
      } catch (err) {
        console.error("Aggregation error:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchAnalytics()
  }, [selectedDate])

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 flex-1 flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
        <p className="font-mono text-on-surface-variant animate-pulse">Aggregating Ledgers...</p>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto w-full overflow-y-auto animate-fade-in">
      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Total Revenue Today */}
        <div className="bg-surface-container-low p-6 lg:p-8 rounded-lg relative overflow-hidden group hover:bg-surface-container-lowest transition-colors shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CircleDollarSign className="w-16 h-16" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-xs uppercase text-secondary tracking-widest mb-4 font-bold">Total Revenue {isToday ? 'Today' : dateLabel}</p>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xl lg:text-3xl font-bold text-primary">IDR</span>
            <h3 className="font-mono text-3xl lg:text-4xl font-bold text-on-surface">{revenue.toLocaleString('id-ID')}</h3>
          </div>
          <div className="mt-4 flex gap-4 text-[10px] font-mono tracking-wider font-bold">
            <div className="flex flex-col">
              <span className="text-secondary opacity-80 uppercase">Tunai</span>
              <span className="text-on-surface">Rp {revenueCash.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-secondary opacity-80 uppercase">QRIS</span>
              <span className="text-on-surface">Rp {revenueQris.toLocaleString('id-ID')}</span>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-[#2d5a27]">
            <TrendingUp className="w-4 h-4" />
            <span className="font-mono text-xs">{isToday ? 'Live Calculation' : 'Archived Ledger'}</span>
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-surface-container-low p-6 lg:p-8 rounded-lg relative overflow-hidden group hover:bg-surface-container-lowest transition-colors shadow-sm">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Receipt className="w-16 h-16" strokeWidth={1.5} />
          </div>
          <p className="font-mono text-xs uppercase text-secondary tracking-widest mb-4 font-bold">Total Transactions</p>
          <h3 className="font-mono text-4xl lg:text-5xl font-bold text-on-surface">{txnCnt}</h3>
          <div className="mt-6 flex items-center gap-2 text-tertiary">
            <Timer className="w-4 h-4" />
            <span className="font-mono text-xs">{isToday ? "Today's active shifts" : "Historical Shifts"}</span>
          </div>
        </div>

        {/* Best Seller */}
        <div className="bg-surface-container-low p-6 lg:p-8 rounded-lg relative overflow-hidden group hover:bg-surface-container-lowest transition-colors border-l-4 border-primary shadow-sm flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Utensils className="w-16 h-16" strokeWidth={1.5} />
          </div>
          <div>
            <p className="font-mono text-xs uppercase text-secondary tracking-widest mb-4 font-bold">Best Seller {isToday ? 'Today' : dateLabel}</p>
            <h3 className="font-serif text-2xl lg:text-3xl font-bold text-on-surface mb-1 truncate pr-8">{bestSeller.title}</h3>
            <p className="font-body text-sm text-on-secondary-container italic uppercase text-[10px] tracking-wider">{bestSeller.category}</p>
          </div>
          <div className="mt-4 flex items-end">
            <span className="font-mono text-3xl font-bold text-primary">{bestSeller.qty}</span>
            <span className="font-mono text-xs text-on-surface-variant ml-2 font-bold mb-1">Units Sold</span>
          </div>
        </div>
      </section>

      {/* Sales Trend Section (Bento Style Layout) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Sales Trend Chart */}
        <div className="lg:col-span-2 bg-surface-container-lowest p-6 lg:p-8 rounded-lg shadow-[0_4px_24px_rgba(62,39,35,0.03)] flex flex-col">
          <div className="flex justify-between items-start lg:items-center mb-10 flex-col lg:flex-row gap-4">
            <div>
              <h4 className="font-serif text-xl lg:text-2xl font-bold text-on-surface">Hourly Performance</h4>
              <p className="font-body text-sm text-on-surface-variant opacity-80 mt-1">Real-time sales trajectory based on ledger entries</p>
            </div>
            <div className="flex gap-2 items-center">
              <span className="h-3 w-3 rounded-full bg-primary inline-block"></span>
              <span className="font-mono text-[10px] uppercase text-secondary tracking-wider font-bold">Actual Sales</span>
            </div>
          </div>
          {/* Simulated Line Chart */}
          <div className="relative h-64 w-full flex items-end justify-between px-2 pt-8 mt-auto">
            {/* Chart Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between border-b border-outline-variant/20 pb-6 pt-4">
              <div className="w-full border-t border-outline-variant/10"></div>
              <div className="w-full border-t border-outline-variant/10"></div>
              <div className="w-full border-t border-outline-variant/10"></div>
              <div className="w-full border-t border-outline-variant/10"></div>
            </div>
            {/* Chart Line Path (SVG) */}
            <svg className="absolute inset-0 h-full w-full pb-6" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M0,90 Q15,85 25,70 T50,55 T75,40 T100,20" fill="none" stroke="#610000" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
              <path d="M0,90 Q15,85 25,70 T50,55 T75,40 T100,20 L100,100 L0,100 Z" fill="url(#grad1)" opacity="0.1"></path>
              <defs>
                <linearGradient id="grad1" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#8B0000', stopOpacity: 1 }}></stop>
                  <stop offset="100%" style={{ stopColor: '#8B0000', stopOpacity: 0 }}></stop>
                </linearGradient>
              </defs>
            </svg>
            {/* Hourly Labels */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-between font-mono text-[10px] text-on-surface-variant font-bold">
              <span>08:00</span>
              <span className="hidden sm:inline">10:00</span>
              <span>12:00</span>
              <span className="hidden sm:inline">14:00</span>
              <span>16:00</span>
              <span className="hidden sm:inline">18:00</span>
              <span>20:00</span>
            </div>
          </div>
        </div>

        {/* Recent Big Transactions */}
        <div className="bg-surface-container-high p-6 lg:p-8 rounded-lg shadow-sm border border-outline-variant/10">
          <h4 className="font-serif text-xl font-bold text-on-surface mb-6">Archive Highlight</h4>
          <div className="space-y-6">
            {recentTxns.length === 0 ? (
              <p className="font-mono text-xs text-on-surface-variant italic opacity-60">No transactions recorded yet.</p>
            ) : (
              recentTxns.map((txn) => (
                <div key={txn.id} className="flex justify-between items-center pb-4 border-b border-outline-variant/20 last:border-0 last:pb-0">
                  <div>
                    <p className="font-mono text-xs text-on-surface-variant">{txn.ticket_number}</p>
                    <p className="font-body text-sm font-semibold text-on-surface mt-1">{txn.type}</p>
                  </div>
                  <p className="font-mono text-sm font-bold text-primary">Rp {(txn.amount/1000).toFixed(0)}k</p>
                </div>
              ))
            )}
          </div>
          <div className="mt-8 bg-surface/80 p-4 rounded-lg border border-outline-variant/20 text-center shadow-sm">
            <p className="font-mono text-[10px] uppercase tracking-tighter text-secondary mb-1 font-bold">Latest sync</p>
            <p className="font-serif text-lg lg:text-xl italic text-tertiary font-bold">Real-time DB</p>
          </div>
        </div>
      </section>

      {/* Bottom Table - Ledger Style */}
      <section className="bg-surface-container-low rounded-lg overflow-hidden shadow-sm">
        <div className="px-6 lg:px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center">
          <h4 className="font-serif text-lg lg:text-xl font-bold text-on-surface">Top Selling Items</h4>
          <a className="text-primary font-mono text-[10px] lg:text-xs uppercase hover:underline font-bold" href="/inventory">View All Manifest</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-surface-container-highest/50">
              <tr>
                <th className="px-6 lg:px-8 py-4 font-mono text-xs uppercase tracking-wider text-on-surface-variant font-bold">Rank</th>
                <th className="px-6 lg:px-8 py-4 font-mono text-xs uppercase tracking-wider text-on-surface-variant font-bold">Item Name</th>
                <th className="px-6 lg:px-8 py-4 font-mono text-xs uppercase tracking-wider text-on-surface-variant font-bold">Category</th>
                <th className="px-6 lg:px-8 py-4 font-mono text-xs uppercase tracking-wider text-on-surface-variant text-right font-bold">Qty</th>
                <th className="px-6 lg:px-8 py-4 font-mono text-xs uppercase tracking-wider text-on-surface-variant text-right font-bold">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {topItems.length === 0 ? (
                <tr>
                   <td colSpan={5} className="text-center py-8 font-mono text-sm opacity-60">No sales detected yet.</td>
                </tr>
              ) : (
                topItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-surface-container-lowest transition-colors group">
                    <td className="px-6 lg:px-8 py-5 font-mono text-sm text-secondary font-bold">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="px-6 lg:px-8 py-5 font-body text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                      {item.title}
                    </td>
                    <td className="px-6 lg:px-8 py-5 font-mono text-[10px]">
                      <span className="bg-surface-container-highest text-on-surface-variant px-2 py-1 rounded font-bold tracking-wider uppercase">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 lg:px-8 py-5 font-mono text-sm text-right">{item.qty}</td>
                    <td className="px-6 lg:px-8 py-5 font-mono text-sm text-right font-bold text-primary">
                      {item.revenue.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
