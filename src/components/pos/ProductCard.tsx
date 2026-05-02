import { PlusCircle, Coffee, CupSoda, Cookie, UtensilsCrossed, Sparkles } from 'lucide-react'

interface ProductCardProps {
  title: string
  sku: string
  price: number
  stock: number
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' | string
  imageUrl?: string
  category?: string
  onAdd: () => void
}

export default function ProductCard({ title, sku, price, stock, stockStatus, imageUrl, category, onAdd }: ProductCardProps) {
  const isLowStock = stockStatus === 'Low Stock'
  const isOutOfStock = stockStatus === 'Out of Stock'

  const formattedPrice = price.toLocaleString('id-ID').replace(',', '.')

  const getCategoryIcon = () => {
    switch (category?.toUpperCase()) {
      case 'KHOPI': return <Coffee className="w-16 h-16 text-tertiary/30 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
      case 'NON-KHOPI': return <CupSoda className="w-16 h-16 text-tertiary/30 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
      case 'SNACK': return <Cookie className="w-16 h-16 text-tertiary/30 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
      case 'MAKANAN': return <UtensilsCrossed className="w-16 h-16 text-tertiary/30 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
      case 'TOPPING': return <Sparkles className="w-16 h-16 text-tertiary/30 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
      default: return <Coffee className="w-16 h-16 text-tertiary/30 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.5} />
    }
  }

  return (
    <div onClick={onAdd} className={`group bg-surface-container-lowest p-3 lg:p-4 rounded-xl shadow-sm border border-outline-variant/10 hover:border-primary/20 hover:shadow-md transition-all cursor-pointer ${isOutOfStock ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="aspect-[4/3] rounded-lg bg-surface-container mb-3 overflow-hidden relative flex items-center justify-center group-hover:bg-surface-container-high transition-colors">
        {getCategoryIcon()}
      </div>
      
      <div className="flex justify-between items-start gap-2">
        <div className="min-w-0">
          <h3 className="font-body font-semibold text-sm text-on-surface truncate">{title}</h3>
          <p className="font-mono text-[10px] text-primary/60 uppercase mt-0.5">SKU: {sku}</p>
        </div>
        <span className="font-mono text-sm font-bold text-primary shrink-0">
          {formattedPrice}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${
            isOutOfStock ? 'bg-error' : isLowStock ? 'bg-orange-400' : 'bg-green-500'
          }`}></div>
          <span className="text-[10px] font-mono opacity-60">
            {stockStatus} ({stock})
          </span>
        </div>
        <PlusCircle className="w-5 h-5 text-outline group-hover:text-primary transition-colors" />
      </div>
    </div>
  )
}
