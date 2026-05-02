'use client'

import Image from "next/image"
import { Edit, Trash2, Plus, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Product } from "@/types/database.types"
import ProductModal from "@/components/inventory/ProductModal"
import { useSearchStore } from "@/store/useSearchStore"

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const searchQuery = useSearchStore(state => state.inventorySearch)

  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      if (error) {
        console.error("Failed fetching products:", error)
      }
      if (data) {
        setProducts(data as Product[])
      }
    } catch (err) {
      console.error("Failed fetching inventory", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleAdd = () => {
    setSelectedProduct(null)
    setIsModalOpen(true)
  }

  const handleEdit = (prod: Product) => {
    setSelectedProduct(prod)
    setIsModalOpen(true)
  }

  const handleDelete = async (prod: Product) => {
    if (!confirm(`Are you sure you want to delete ${prod.title}?\nIf this product has order history, deletion might fail due to database constraints.`)) {
      return
    }

    try {
      const { error } = await supabase.from('products').delete().eq('id', prod.id)
      
      if (error) {
        // Handle PostgREST foreign key violation (23503)
        if (error.code === '23503') {
          alert(`LOCKED: Cannot delete ${prod.title} because it has transaction history.\n\nPlease EDIT the product and set stock to 0 instead.`)
        } else {
          throw error
        }
      } else {
        alert(`${prod.title} deleted successfully.`)
        fetchProducts()
      }
    } catch (err: unknown) {
      console.error(err)
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      alert(`Deletion failed. Error: ${errorMsg}`)
    }
  }

  // Derived filtered products
  const filteredProducts = searchQuery.trim() === '' 
    ? products 
    : products.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      )

  return (
    <section className="p-4 lg:p-8 flex-1 overflow-y-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4">
        <div>
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-tertiary">Inventory &amp; Menu</h2>
          <p className="font-body text-on-surface-variant opacity-70 mt-1 italic text-sm lg:text-base">Formal record of all stocked provisions and kitchen supplies.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={handleAdd} className="px-4 py-2 bg-primary text-white rounded-lg font-mono text-[10px] lg:text-xs uppercase tracking-wider hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm font-bold">
            <Plus className="w-4 h-4" />
            Add Menu
          </button>
        </div>
      </div>

      {/* Ledger Table Container */}
      <div className="bg-surface-container-lowest rounded-xl shadow-[0_4px_24px_rgba(62,39,35,0.03)] overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-surface-container-low">
              <th className="px-4 lg:px-6 py-5 font-serif font-bold text-tertiary text-base lg:text-lg border-b border-outline-variant/10">SKU</th>
              <th className="px-4 lg:px-6 py-5 font-serif font-bold text-tertiary text-base lg:text-lg border-b border-outline-variant/10">Name</th>
              <th className="px-4 lg:px-6 py-5 font-serif font-bold text-tertiary text-base lg:text-lg border-b border-outline-variant/10">Category</th>
              <th className="px-4 lg:px-6 py-5 font-serif font-bold text-tertiary text-base lg:text-lg border-b border-outline-variant/10">Price</th>
              <th className="px-4 lg:px-6 py-5 font-serif font-bold text-tertiary text-base lg:text-lg border-b border-outline-variant/10 text-center">Stock Level</th>
              <th className="px-4 lg:px-6 py-5 font-serif font-bold text-tertiary text-base lg:text-lg border-b border-outline-variant/10">Status</th>
              <th className="px-4 lg:px-6 py-5 font-serif font-bold text-tertiary text-base lg:text-lg border-b border-outline-variant/10 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 font-mono text-on-surface-variant opacity-60">
                  {searchQuery ? `No records match "${searchQuery}"` : "No inventory records found."}
                </td>
              </tr>
            ) : (
              filteredProducts.map((prod) => {
                const stock = Math.max(0, prod.stock)
                const isComingSoon = prod.stock_status === 'coming_soon'
                const isOutOfStock = !isComingSoon && stock === 0
                const isCritical = !isComingSoon && stock > 0 && stock <= 10
                
                // Assuming 50 is standard maximum bin capacity for visual percentages
                const stockPercentage = Math.min(100, Math.floor((stock / 50) * 100))

                return (
                  <tr key={prod.id} className="hover:bg-surface transition-colors group">
                    <td className="px-4 lg:px-6 py-5 font-mono text-xs lg:text-sm text-on-surface-variant">{prod.sku}</td>
                    <td className="px-4 lg:px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-surface-container-high flex-shrink-0 overflow-hidden border border-outline-variant/10 relative">
                          <Image fill sizes="40px" className="object-cover" alt={prod.title} src={prod.image_url || '/placeholder.jpg'} />
                        </div>
                        <span className="font-body font-semibold text-tertiary text-sm lg:text-base">{prod.title}</span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-5">
                      <span className="px-3 py-1 bg-surface-container-high text-on-surface rounded-full font-mono text-[10px] uppercase tracking-tighter">
                        {prod.category}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-5 font-mono font-bold text-on-surface text-sm lg:text-base">
                      {isComingSoon ? (
                        <span className="text-on-surface-variant/50 text-xs italic">Coming Soon</span>
                      ) : (
                        `Rp ${prod.price.toLocaleString('id-ID')}`
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-5">
                      {!isComingSoon ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-16 lg:w-24 bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${isOutOfStock ? 'bg-transparent' : isCritical ? 'bg-error' : 'bg-primary'}`} 
                              style={{ width: `${stockPercentage}%` }}
                            ></div>
                          </div>
                          <span className={`font-mono text-[10px] lg:text-xs font-bold ${isCritical ? 'text-error' : 'text-on-surface'}`}>{stock} Units</span>
                        </div>
                      ) : (
                        <div className="flex justify-center text-on-surface-variant/40 font-mono text-[10px] uppercase">
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-5">
                      <div className={`flex items-center gap-2 ${isComingSoon ? 'text-tertiary' : isOutOfStock ? 'text-on-surface-variant/40' : isCritical ? 'text-error' : 'text-[#2d5a27]'}`}>
                        <span className={`w-2 h-2 rounded-full ${isComingSoon ? 'bg-tertiary' : isOutOfStock ? 'bg-on-surface-variant/40' : isCritical ? 'bg-error' : 'bg-[#2d5a27]'}`}></span>
                        <span className="font-body text-xs font-medium">
                          {isComingSoon ? 'Coming Soon' : isOutOfStock ? 'Out-of-Stock' : isCritical ? 'Critical Stock' : 'In-Stock'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-5 text-right space-x-1 lg:space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(prod)} className="p-2 text-on-surface-variant hover:text-primary transition-colors hover:bg-primary-fixed rounded-lg"><Edit className="w-4 h-4 lg:w-5 lg:h-5" /></button>
                      <button onClick={() => handleDelete(prod)} className="p-2 text-on-surface-variant hover:text-error transition-colors hover:bg-error-container/30 rounded-lg"><Trash2 className="w-4 h-4 lg:w-5 lg:h-5" /></button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        
        {/* Pagination / Footer */}
        <div className="px-4 lg:px-6 py-4 bg-surface-container-low flex flex-col sm:flex-row justify-between items-center border-t border-outline-variant/10 gap-4">
          <p className="font-body text-xs text-on-surface-variant">Showing <span className="font-bold">{filteredProducts.length}</span> items in Archive</p>
        </div>
      </div>

      <ProductModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        product={selectedProduct} 
        onSuccess={() => {
          fetchProducts() // Refresh lists
        }}
      />
    </section>
  )
}
