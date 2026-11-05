'use client'

import { Loader2, Search, Trash2, FolderOpen, ShoppingCart, X, Printer } from 'lucide-react'
import ProductCard from '@/components/pos/ProductCard'
import CartItem from '@/components/pos/CartItem'
import PaymentModal from '@/components/pos/PaymentModal'
import SavedDraftsModal from '@/components/pos/SavedDraftsModal'
import PrintReceipt, { ReceiptData } from '@/components/pos/PrintReceipt'
import { useState, useEffect, useCallback } from 'react'
import { useCartStore } from '@/store/useCartStore'
import { Product } from '@/types/database.types'
import { cacheProducts, getCachedProducts } from '@/utils/offlineSync'
import { useBluetoothPrinter } from '@/hooks/useBluetoothPrinter'
import { generateEscPosReceipt } from '@/utils/escpos'

const categories = ['All', 'Khopi', 'Non-Khopi', 'Snack', 'Makanan', 'Topping']

export default function PosPage() {
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
  const [isDraftsOpen, setIsDraftsOpen] = useState(false)
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [lastReceiptData, setLastReceiptData] = useState<ReceiptData | null>(null)
  const btHook = useBluetoothPrinter()

  // Persist last receipt to localStorage so it survives tab navigation
  useEffect(() => {
    const saved = localStorage.getItem('tjap-last-receipt')
    if (saved) {
      try { setLastReceiptData(JSON.parse(saved)) } catch { /* ignore */ }
    }
  }, [])

  /** Callback from PaymentModal — stores receipt data at page level for printing */
  const handleReceiptReady = useCallback((data: ReceiptData) => {
    setLastReceiptData(data)
    localStorage.setItem('tjap-last-receipt', JSON.stringify(data))
  }, [])
  
  const { cart, drafts, addToCart, removeFromCart, updateQuantity, updateNote, getSubtotal, clearCart, saveDraft, orderType, setOrderType } = useCartStore()

  useEffect(() => {
    // 1. Initial hydrate from offline cache if available
    const cached = getCachedProducts()
    if (cached && Array.isArray(cached) && cached.length > 0) {
      setProducts(cached as Product[])
      setIsLoading(false)
    }

    // 2. Fetch fresh from server
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products')
        const data = await res.json()
        if (Array.isArray(data)) {
          setProducts(data as Product[])
          cacheProducts(data)
        }
      } catch (err) {
        console.warn("Failed fetching products from network, falling back to cache", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProducts()
  }, [])

  let filteredProducts = activeCategory === 'All' 
    ? products 
    : products.filter(p => p.category?.toUpperCase() === activeCategory.replace('-', ' ').toUpperCase())

  if (searchQuery.trim().length > 0) {
    filteredProducts = filteredProducts.filter(p => 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.sku.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const subtotal = getSubtotal()
  const total = subtotal // Add tax calculations here if applicable.

  return (
    <>
      <div className="flex flex-1 overflow-hidden">
        {/* ── Product Section (Left) ── */}
        <div className="flex-1 flex flex-col p-4 lg:p-6 xl:p-8 gap-5 overflow-y-auto custom-scrollbar min-w-0">
          
          {/* Header Controls: Search & Tabs */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between shrink-0">
            {/* Category Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0 max-w-full">
              {categories.map((cat) => (
                <button 
                  onClick={() => setActiveCategory(cat)}
                  key={cat}
                  className={`px-4 py-2 rounded-xl font-mono text-xs uppercase tracking-wider whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                    activeCategory === cat 
                    ? 'bg-red-600 text-white shadow-xs font-bold' 
                    : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari menu / SKU..."
                className="w-full bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-8 font-body text-sm text-slate-900 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 shadow-2xs transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Product Bento Grid */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
               <Loader2 className="w-8 h-8 text-red-600 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3 lg:gap-4 animate-fade-in" style={{ animationFillMode: 'both' }}>
              {filteredProducts.length === 0 ? (
                <div className="col-span-full h-40 flex items-center justify-center font-mono text-slate-400">
                  Menu tidak ditemukan.
                </div>
              ) : (
                filteredProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    title={prod.title}
                    sku={prod.sku}
                    price={prod.price}
                    category={prod.category || 'Lainnya'}
                    stock={prod.stock}
                    stockStatus={prod.stock_status}
                    onAdd={() => addToCart(prod)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* Mobile Cart Overlay */}
        {isCartOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-2xs"
            onClick={() => setIsCartOpen(false)}
          />
        )}

        {/* ── Smart Cart Drawer (Right) ── */}
        <section className={`
          fixed inset-y-0 right-0 transform transition-transform duration-300 z-50
          lg:relative lg:transform-none lg:z-10
          w-[90vw] sm:w-88 xl:w-[380px] bg-white h-full border-l border-slate-200 flex flex-col shadow-2xl lg:shadow-none shrink-0
          ${isCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-4 lg:p-5 pb-3 flex justify-between items-start border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base lg:text-lg text-slate-900">Pesanan Aktif</h2>
                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-mono text-[11px] font-bold">
                  {cart.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              </div>
              <button 
                onClick={() => setIsDraftsOpen(true)}
                className="font-mono text-[11px] uppercase mt-1 flex items-center gap-1 text-slate-500 hover:text-red-600 font-bold transition-all"
              >
                <FolderOpen className="w-3.5 h-3.5" />
                Draft Tersimpan ({drafts.length})
              </button>
            </div>
            <div className="flex items-center gap-1">
              {cart.length > 0 && (
                <button 
                  onClick={clearCart}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Kosongkan Keranjang"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="px-4 lg:px-5 py-2.5 border-b border-slate-100 bg-slate-50/50">
            <select 
              value={orderType} 
              onChange={(e) => setOrderType(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-1.5 px-3 font-mono text-xs uppercase tracking-wider text-slate-700 font-medium focus:outline-none focus:border-red-500 transition-colors cursor-pointer shadow-2xs"
            >
              <option value="Dine In">Dine In (Makan di Tempat)</option>
              <option value="Takeaway">Takeaway (Bungkus)</option>
            </select>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 lg:px-5 pt-3 space-y-2.5 custom-scrollbar">
            {cart.length === 0 ? (
               <div className="h-full flex items-center justify-center text-slate-400 text-sm font-mono">
                 Keranjang masih kosong.
               </div>
            ) : (
              cart.map((item) => (
                <CartItem
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  price={item.price}
                  quantity={item.quantity}
                  note={item.note}
                  imageUrl={item.imageUrl}
                  hasNoteField={item.hasNoteField}
                  onIncrement={(id) => updateQuantity(id, item.quantity + 1)}
                  onDecrement={(id) => updateQuantity(id, item.quantity - 1)}
                  onRemove={(id) => removeFromCart(id)}
                  onUpdateNote={updateNote}
                />
              ))
            )}
          </div>

          {/* Checkout Footer */}
          <div className="p-4 lg:p-5 bg-white border-t border-slate-200 space-y-3">
            <div className="flex justify-between text-xs lg:text-sm text-slate-500">
              <span>Subtotal</span>
              <span className="font-mono text-slate-700 font-medium">Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            
            <div className="h-[1px] bg-slate-100"></div>
            
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-sm lg:text-base text-slate-900">Total Tagihan</span>
              <span className="font-mono text-xl lg:text-2xl font-bold text-red-600">Rp {total.toLocaleString('id-ID')}</span>
            </div>
            
            <div className="pt-2 space-y-2.5">
              <div className="flex gap-2">
                <button 
                  onClick={() => saveDraft()}
                  disabled={cart.length === 0}
                  className={`flex-1 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-mono text-xs uppercase transition-colors font-bold tracking-wider ${cart.length === 0 ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                >
                  Simpan Draft
                </button>
              </div>

              {lastReceiptData && (
                <div className="bg-red-50/70 border border-red-200/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600 font-bold">Pesanan Terakhir</span>
                    <button
                      onClick={() => {
                        setLastReceiptData(null)
                        localStorage.removeItem('tjap-last-receipt')
                      }}
                      className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-red-600">{lastReceiptData.ticketNumber}</span>
                    {lastReceiptData.dailySequence > 0 && (
                      <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold">#{lastReceiptData.dailySequence}</span>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      if (btHook.isConnected && lastReceiptData) {
                        try {
                          const buffer = generateEscPosReceipt(lastReceiptData, "TJAP CHACOH", "Ciguling, Gang Bima No.20C\nMajenang")
                          await btHook.print(buffer)
                          return
                        } catch (err) {
                          console.error("Bluetooth print failed, falling back to window.print", err)
                        }
                      }
                      setTimeout(() => window.print(), 100)
                    }}
                    className="w-full py-2 bg-red-600 text-white rounded-lg font-mono text-xs uppercase hover:bg-red-700 active:scale-[0.98] transition-all font-bold tracking-wider flex justify-center items-center gap-2 shadow-2xs"
                  >
                    <Printer className="w-4 h-4" /> Cetak Ulang Struk
                  </button>
                </div>
              )}

              <button 
                onClick={() => {
                  if (cart.length > 0) setIsPaymentModalOpen(true)
                }}
                disabled={cart.length === 0}
                className={`w-full bg-red-600 hover:bg-red-700 text-white py-3.5 rounded-xl font-bold text-base tracking-tight shadow-md shadow-red-600/20 active:scale-[0.98] transition-all cursor-pointer ${cart.length === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}>
                Bayar Sekarang
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Mobile Sticky Cart Bar above bottom navigation */}
      {cart.length > 0 && !isCartOpen && (
        <div className="lg:hidden fixed bottom-18 left-3 right-3 z-30 animate-slide-up">
          <div 
            onClick={() => setIsCartOpen(true)}
            role="button"
            className="w-full bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between cursor-pointer active:scale-[0.98] transition-all border border-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold text-xs">
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </div>
              <div>
                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Total Pesanan</p>
                <p className="font-mono text-sm font-bold text-white">
                  Rp {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toLocaleString('id-ID')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 rounded-xl font-semibold text-xs transition-colors">
              <span>Buka Keranjang</span>
              <ShoppingCart className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      )}

      {/* Receipt component at PAGE level — always in the DOM for print */}
      <PrintReceipt data={lastReceiptData} />

      <PaymentModal 
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onReceiptReady={handleReceiptReady}
        btHook={btHook}
      />

      <SavedDraftsModal
        isOpen={isDraftsOpen}
        onClose={() => setIsDraftsOpen(false)}
      />
    </>
  )
}
