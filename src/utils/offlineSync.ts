export interface OfflineTransaction {
  id: string
  items: Array<{
    id: string
    title: string
    quantity: number
    price: number
    note?: string | null
  }>
  total: number
  paymentMethod: string
  orderType: string
  customerName?: string | null
  cashierName?: string | null
  timestamp: number
  ticketNumber: string
}

const STORAGE_KEY = 'tjap_offline_tx_queue'
const PRODUCTS_CACHE_KEY = 'tjap_products_cache'

export function getOfflineQueue(): OfflineTransaction[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveOfflineTransaction(tx: Omit<OfflineTransaction, 'id' | 'timestamp'>): OfflineTransaction {
  const queue = getOfflineQueue()
  const newTx: OfflineTransaction = {
    ...tx,
    id: `off_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now()
  }
  queue.push(newTx)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue))
  window.dispatchEvent(new Event('offline-queue-changed'))
  return newTx
}

export function cacheProducts(products: unknown[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(products))
  } catch {
    // quota exceeded or private mode
  }
}

export function getCachedProducts(): unknown[] | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PRODUCTS_CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const queue = getOfflineQueue()
  if (queue.length === 0) return { synced: 0, failed: 0 }

  let synced = 0
  let failed = 0
  const remaining: OfflineTransaction[] = []

  for (const tx of queue) {
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: tx.items,
          total: tx.total,
          paymentMethod: tx.paymentMethod,
          orderType: tx.orderType,
          customerName: tx.customerName,
          cashierName: tx.cashierName
        })
      })

      if (res.ok) {
        synced++
      } else {
        failed++
        remaining.push(tx)
      }
    } catch {
      failed++
      remaining.push(tx)
    }
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining))
  window.dispatchEvent(new Event('offline-queue-changed'))
  return { synced, failed }
}
