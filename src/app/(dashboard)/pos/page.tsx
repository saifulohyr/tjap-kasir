'use client'

import { Loader2, Search, Trash2, FolderOpen, ShoppingCart, X, Printer } from 'lucide-react'
import ProductCard from '@/components/pos/ProductCard'
import CartItem from '@/components/pos/CartItem'
import PaymentModal from '@/components/pos/PaymentModal'
import SavedDraftsModal from '@/components/pos/SavedDraftsModal'
import PrintReceipt, { ReceiptData } from '@/components/pos/PrintReceipt'
import { useState, useEffect, useCallback } from 'react'
import { useCartStore } from '@/store/useCartStore'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types/database.types'
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

  /** Callback from PaymentModal — stores receipt data at page level for printing */
  const handleReceiptReady = useCallback((data: ReceiptData) => {
    setLastReceiptData(data)
  }, [])
  
  const { cart, drafts, addToCart, removeFromCart, updateQuantity, updateNote, getSubtotal, clearCart, saveDraft, orderType, setOrderType } = useCartStore()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase.from('products').select('*')
        if (error) {
          console.error("Failed fetching products:", error)
        }
        if (data) {
          setProducts(data as Product[])
        }
      } catch (err) {
        console.error("Failed fetching products", err)
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
      <div className="bg-[#e3beb8]/30 h-[1px] w-full"></div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* ── Product Section (Left) ── */}
        <div className="flex-1 flex flex-col p-4 lg:p-6 xl:p-8 gap-6 overflow-y-auto custom-scrollbar min-w-0">
          
          {/* Header Controls: Search & Tabs */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between shrink-0">
            {/* Category Tabs */}
            <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar shrink-0 max-w-full">
              {categories.map((cat) => (
                <button 
                  onClick={() => setActiveCategory(cat)}
                  key={cat}
                  className={`px-5 py-2.5 rounded-full font-mono text-[11px] uppercase tracking-wider whitespace-nowrap transition-all shrink-0 ${
                    activeCategory === cat 
                    ? 'bg-primary text-white shadow-md scale-105' 
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative w-full sm:w-64 shrink-0">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-full py-2 pl-9 pr-4 font-body text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                >
                  <Loader2 className="w-3 h-3 opacity-0" /> {/* Spacer */}
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 font-bold text-[10px] bg-outline-variant/20 rounded-full w-4 h-4 flex items-center justify-center">X</span>
                </button>
              )}
            </div>
          </div>

          {/* Product Bento Grid */}
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
               <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 animate-fade-in" style={{ animationFillMode: 'both' }}>
              {filteredProducts.length === 0 ? (
                <div className="col-span-full h-40 flex items-center justify-center font-mono opacity-50">
                  No products found.
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
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setIsCartOpen(false)}
          />
        )}

        {/* ── Smart Cart Drawer (Right) ── */}
        <section className={`
          fixed inset-y-0 right-0 transform transition-transform duration-300 z-50
          lg:relative lg:transform-none lg:z-10
          w-[85vw] sm:w-80 xl:w-[380px] bg-surface-container-high h-full border-l border-outline-variant/15 flex flex-col shadow-2xl lg:shadow-[-4px_0_24px_rgba(62,39,35,0.02)] shrink-0
          ${isCartOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-4 lg:p-6 pb-2 flex justify-between items-start">
            <div>
              <h2 className="font-serif text-lg lg:text-xl font-bold text-tertiary">Active Ledger</h2>
              <button 
                onClick={() => setIsDraftsOpen(true)}
                className="font-mono text-[10px] uppercase mt-1 flex items-center gap-1 text-primary hover:underline font-bold transition-all"
              >
                <FolderOpen className="w-3 h-3" />
                Open Tabs ({drafts.length})
              </button>
            </div>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button 
                  onClick={clearCart}
                  className="p-2 text-error/70 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                  title="Clear Cart"
                >
                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              )}
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-tertiary hover:bg-black/5 rounded-lg transition-colors lg:hidden"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="px-4 lg:px-6 pb-3 border-b border-outline-variant/10">
            <select 
              value={orderType} 
              onChange={(e) => setOrderType(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-md py-1.5 px-3 font-mono text-[11px] uppercase tracking-wider text-on-surface-variant focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="Dine In">Dine In</option>
              <option value="Takeaway">Takeaway</option>
            </select>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 lg:px-6 pt-3 space-y-3 custom-scrollbar">
            {cart.length === 0 ? (
               <div className="h-full flex items-center justify-center text-on-surface-variant opacity-60 text-sm italic">
                 Cart is empty.
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
          <div className="p-4 lg:p-6 bg-surface-container-highest space-y-3 shadow-[0_-4px_24px_rgba(62,39,35,0.05)]">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-variant font-body">Subtotal</span>
              <span className="font-mono">{subtotal.toLocaleString('id-ID')}</span>
            </div>
            
            <div className="h-[1px] bg-outline-variant/20"></div>
            
            <div className="flex justify-between items-end">
              <span className="font-serif font-bold text-base lg:text-lg">Total</span>
              <span className="font-mono text-xl lg:text-2xl font-bold text-primary">{total.toLocaleString('id-ID')}</span>
            </div>
            
            <div className="pt-3 space-y-3">
              <div className="flex gap-2">
                <button 
                  onClick={() => saveDraft()}
                  disabled={cart.length === 0}
                  className={`flex-1 py-2.5 border border-primary text-primary rounded-lg font-mono text-[10px] lg:text-xs uppercase hover:bg-primary/5 transition-colors font-bold tracking-wider ${cart.length === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                >
                  Save Draft
                </button>

              </div>
              <button 
                onClick={() => {
                  if (cart.length > 0) setIsPaymentModalOpen(true)
                }}
                disabled={cart.length === 0}
                className={`w-full varnish-cta text-white py-4 rounded-lg font-serif text-lg lg:text-xl font-bold tracking-tight shadow-xl shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all ${cart.length === 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}>
                Bayar Sekarang
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Mobile FAB to open Cart */}
      <button 
        onClick={() => setIsCartOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-xl z-30 hover:bg-primary-hover active:scale-95 transition-all"
      >
        <ShoppingCart className="w-6 h-6" />
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 bg-error text-white text-xs rounded-full flex items-center justify-center font-bold shadow-sm border-2 border-[#fff8ef]">
            {cart.reduce((acc, item) => acc + item.quantity, 0)}
          </span>
        )}
      </button>

      {/* Floating Re-print Button — appears after a successful payment */}
      {lastReceiptData && (
        <div className="fixed bottom-24 lg:bottom-6 right-6 flex flex-col items-end gap-2 z-30 animate-fade-in">
          <div className="flex items-center gap-2 bg-surface-container-low border border-outline-variant/20 rounded-full pl-3 pr-1 py-1 shadow-lg text-xs font-mono text-on-surface-variant">
            <span className="hidden sm:inline truncate max-w-[140px]">{lastReceiptData.ticketNumber}</span>
            <button
              onClick={() => {
                setLastReceiptData(null)
              }}
              className="w-6 h-6 rounded-full hover:bg-surface-container-highest flex items-center justify-center transition-colors text-on-surface-variant/60 hover:text-on-surface"
              title="Tutup"
            >
              <X className="w-3 h-3" />
            </button>
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
              // Fallback
              setTimeout(() => {
                window.print()
              }, 100)
            }}
            className="flex items-center gap-2 bg-primary text-white px-4 py-3 rounded-full shadow-xl hover:opacity-90 active:scale-95 transition-all font-mono font-bold text-xs uppercase tracking-wide"
            title="Cetak ulang struk pesanan terakhir"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Ulang Struk</span>
          </button>
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
