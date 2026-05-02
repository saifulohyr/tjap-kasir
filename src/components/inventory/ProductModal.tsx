'use client'

import { X, Save, Box, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Product } from '@/types/database.types'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  product: Product | null // null means Create mode
}

const CATEGORIES = ['KHOPI', 'NON KHOPI', 'SNACK', 'MAKANAN', 'TOPPING']

export default function ProductModal({ isOpen, onClose, onSuccess, product }: ProductModalProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const isEdit = !!product

  const [formData, setFormData] = useState({
    title: '',
    sku: '',
    category: 'KHOPI',
    price: 0,
    stock: 0,
    stock_status: 'in_stock',
    image_url: ''
  })

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setFormData({
          title: product.title,
          sku: product.sku,
          category: product.category,
          price: product.price,
          stock: product.stock,
          stock_status: product.stock_status,
          image_url: product.image_url || ''
        })
      } else {
        setFormData({
          title: '',
          sku: '',
          category: 'KHOPI',
          price: 0,
          stock: 99,
          stock_status: 'in_stock',
          image_url: ''
        })
      }
    }
  }, [isOpen, product])

  if (!isOpen) return null

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'stock' ? Number(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsProcessing(true)

    try {
      const payload = {
        title: formData.title,
        sku: formData.sku,
        category: formData.category,
        price: formData.price,
        stock: formData.stock,
        stock_status: formData.stock_status,
        image_url: formData.image_url || null
      }

      if (isEdit && product) {
        const { error } = await supabase.from('products').update(payload).eq('id', product.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('products').insert([payload])
        if (error) throw error
      }

      onSuccess()
      onClose()
    } catch (error: unknown) {
      console.error(error)
      const msg = error instanceof Error ? error.message : 'Unknown error'
      alert(`Error saving product: ${msg}`)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-tertiary/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-surface-container-low parchment-glow rounded-xl flex flex-col overflow-hidden border border-outline-variant/15 shadow-[0_32px_64px_rgba(62,39,35,0.12)] max-h-full">
        
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-highest/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl md:text-2xl text-tertiary font-bold">
                {isEdit ? 'Edit Product Record' : 'New Product Record'}
              </h2>
              <p className="font-mono text-[10px] uppercase tracking-widest text-secondary">
                Master Inventory Ledger
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <form id="productForm" onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Product Name *</label>
                <input required name="title" value={formData.title} onChange={handleChange} type="text" className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-2.5 font-body text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="e.g., Kopi Gula Aren" />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">SKU Code *</label>
                <input required name="sku" value={formData.sku} onChange={handleChange} type="text" className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-2.5 font-mono text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all uppercase" placeholder="e.g., KHOPI-099" />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Category *</label>
                <select required name="category" value={formData.category} onChange={handleChange} className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-2.5 font-mono text-xs uppercase outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer">
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Price (Rp) *</label>
                <input required name="price" value={formData.price} onChange={handleChange} type="number" min="0" className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-2.5 font-mono text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Initial Stock *</label>
                <input required name="stock" value={formData.stock} onChange={handleChange} type="number" min="0" className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-2.5 font-mono text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Availability Status *</label>
                <select name="stock_status" value={formData.stock_status} onChange={handleChange} className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-2.5 font-body text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all cursor-pointer">
                  <option value="in_stock">In Stock (Active)</option>
                  <option value="coming_soon">Coming Soon (Inactive)</option>
                </select>
              </div>

            </div>

            <div className="space-y-2">
              <label className="font-mono text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">Image URL (Optional)</label>
              <input name="image_url" value={formData.image_url} onChange={handleChange} type="url" className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-2.5 font-mono text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="https://example.com/image.jpg" />
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 bg-surface-container-high border-t border-outline-variant/10 flex justify-end gap-3 rounded-b-xl">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-2.5 rounded-lg font-mono text-xs uppercase tracking-wider text-on-surface hover:bg-surface-variant transition-colors font-bold"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            form="productForm" 
            disabled={isProcessing}
            className="px-6 py-2.5 rounded-lg bg-primary text-white font-mono text-xs uppercase tracking-wider hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEdit ? 'Update Ledger' : 'Save Record'}
          </button>
        </div>

      </div>
    </div>
  )
}
