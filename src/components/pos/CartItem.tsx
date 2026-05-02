import { Minus, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'

interface CartItemProps {
  id: string
  title: string
  price: number
  quantity: number
  imageUrl?: string
  hasNoteField?: boolean
  note?: string
  onIncrement: (id: string) => void
  onDecrement: (id: string) => void
  onRemove: (id: string) => void
  onUpdateNote: (id: string, note: string) => void
}

export default function CartItem({ id, title, price, quantity, imageUrl, hasNoteField, note, onIncrement, onDecrement, onRemove, onUpdateNote }: CartItemProps) {
  const formattedPrice = (price * quantity).toLocaleString('id-ID').replace(',', '.')

  return (
    <div className="bg-surface p-4 rounded-lg flex gap-4 shadow-sm group border border-transparent hover:border-outline-variant/10 transition-colors">
      <div className="relative w-12 h-12 rounded bg-surface-container-highest overflow-hidden flex-shrink-0 flex items-center justify-center">
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill sizes="48px" className="object-cover" />
        ) : (
          <span className="font-serif italic text-lg text-outline-variant">T</span>
        )}
      </div>
      
      <div className="flex-1 w-full overflow-hidden">
        <div className="flex justify-between items-start gap-2">
          <h4 className="text-sm font-semibold font-body leading-tight truncate">{title}</h4>
          <span className="font-mono text-sm font-bold shrink-0">{formattedPrice}</span>
        </div>
        
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-3">
            <button onClick={() => onDecrement(id)} className="w-6 h-6 flex items-center justify-center rounded-full bg-surface-container-high text-primary active:scale-90 transition-transform">
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono text-sm w-4 text-center">{quantity}</span>
            <button onClick={() => onIncrement(id)} className="w-6 h-6 flex items-center justify-center rounded-full bg-surface-container-high text-primary active:scale-90 transition-transform">
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <button onClick={() => onRemove(id)} className="opacity-0 group-hover:opacity-100 text-error transition-opacity pr-1">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {hasNoteField && (
          <div className="mt-3">
            <textarea 
              className="w-full bg-surface-container-low border border-transparent rounded p-2 text-[10px] font-body focus:ring-1 focus:ring-primary focus:border-primary outline-none h-12 resize-none custom-scrollbar transition-all" 
              placeholder="Note: Extra spicy..."
              value={note || ''}
              onChange={(e) => onUpdateNote(id, e.target.value)}
            ></textarea>
          </div>
        )}
      </div>
    </div>
  )
}
