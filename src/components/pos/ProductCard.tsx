import { Plus, Coffee, CupSoda, Cookie, UtensilsCrossed, Sparkles } from 'lucide-react'

interface ProductCardProps {
  title: string
  sku: string
  price: number
  stock: number
  stockStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' | string
  category?: string
  onAdd: () => void
}

export default function ProductCard({
  title,
  sku,
  price,
  stock,
  stockStatus,
  category,
  onAdd,
}: ProductCardProps) {
  const isOutOfStock = stockStatus === 'Out of Stock' || stock <= 0
  const isLowStock = stockStatus === 'Low Stock' || (stock > 0 && stock <= 5)

  const formattedPrice = `Rp ${price.toLocaleString('id-ID')}`

  const getCategoryIcon = () => {
    const iconClass =
      'w-10 h-10 lg:w-12 lg:h-12 text-slate-400 group-hover:text-red-600 group-hover:scale-105 transition-all duration-300'

    switch (category?.toUpperCase()) {
      case 'KHOPI':
        return <Coffee className={iconClass} strokeWidth={1.75} />
      case 'NON-KHOPI':
        return <CupSoda className={iconClass} strokeWidth={1.75} />
      case 'SNACK':
        return <Cookie className={iconClass} strokeWidth={1.75} />
      case 'MAKANAN':
        return <UtensilsCrossed className={iconClass} strokeWidth={1.75} />
      case 'TOPPING':
        return <Sparkles className={iconClass} strokeWidth={1.75} />
      default:
        return <Coffee className={iconClass} strokeWidth={1.75} />
    }
  }

  return (
    <div
      onClick={onAdd}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onAdd()
        }
      }}
      className={`group bg-white p-3 lg:p-3.5 rounded-xl border border-slate-200/80 hover:border-red-400 hover:shadow-md transition-all active:scale-[0.98] select-none cursor-pointer flex flex-col justify-between ${
        isOutOfStock ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      <div>
        {/* Visual Box with Category Badge */}
        <div className="aspect-[4/3] rounded-lg bg-slate-50 border border-slate-100/80 mb-3 overflow-hidden relative flex items-center justify-center group-hover:bg-red-50/30 transition-colors">
          {category && (
            <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold tracking-wider bg-white/90 text-slate-600 border border-slate-200/60 shadow-2xs">
              {category}
            </span>
          )}
          {getCategoryIcon()}
        </div>

        {/* Product Info */}
        <h3 className="font-semibold text-xs lg:text-sm text-slate-900 line-clamp-2 leading-snug">
          {title}
        </h3>
        <p className="font-mono text-[10px] text-slate-400 uppercase mt-0.5">
          {sku}
        </p>
      </div>

      {/* Footer: Price + Quick Add Button */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
        <span className="font-mono text-xs lg:text-sm font-bold text-red-600">
          {formattedPrice}
        </span>

        <button
          type="button"
          aria-label={`Tambah ${title}`}
          className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-red-600 text-slate-600 group-hover:text-white flex items-center justify-center transition-all shadow-2xs shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
