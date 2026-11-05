'use client'

import { useState } from 'react'
import { Minus, Plus, Trash2, StickyNote, X } from 'lucide-react'
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

const QUICK_NOTES = ['Es Sedikit', 'Less Sugar', 'Pedas', 'Panas', 'Bungkus']

export default function CartItem({
  id,
  title,
  price,
  quantity,
  imageUrl,
  hasNoteField = true,
  note,
  onIncrement,
  onDecrement,
  onRemove,
  onUpdateNote
}: CartItemProps) {
  const [isOpenNote, setIsOpenNote] = useState(Boolean(note))
  const formattedPrice = (price * quantity).toLocaleString('id-ID').replace(',', '.')

  const handleAddChip = (chip: string) => {
    if (!note) {
      onUpdateNote(id, chip)
    } else if (!note.includes(chip)) {
      onUpdateNote(id, `${note}, ${chip}`)
    }
  }

  return (
    <div className="bg-surface p-3.5 rounded-lg flex flex-col gap-2.5 shadow-sm group border border-transparent hover:border-outline-variant/10 transition-colors">
      <div className="flex gap-3">
        <div className="relative w-11 h-11 rounded bg-surface-container-highest overflow-hidden flex-shrink-0 flex items-center justify-center">
          {imageUrl ? (
            <Image src={imageUrl} alt={title} fill sizes="44px" className="object-cover" />
          ) : (
            <span className="font-serif italic text-base text-outline-variant">T</span>
          )}
        </div>
        
        <div className="flex-1 w-full overflow-hidden">
          <div className="flex justify-between items-start gap-2">
            <h4 className="text-sm font-semibold font-body leading-tight truncate">{title}</h4>
            <span className="font-mono text-sm font-bold shrink-0">{formattedPrice}</span>
          </div>
          
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-2.5">
              <button 
                type="button"
                onClick={() => onDecrement(id)} 
                className="w-6 h-6 flex items-center justify-center rounded-full bg-surface-container-high text-primary active:scale-90 transition-transform"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-mono text-xs w-4 text-center font-bold">{quantity}</span>
              <button 
                type="button"
                onClick={() => onIncrement(id)} 
                className="w-6 h-6 flex items-center justify-center rounded-full bg-surface-container-high text-primary active:scale-90 transition-transform"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              {hasNoteField && !isOpenNote && !note && (
                <button
                  type="button"
                  onClick={() => setIsOpenNote(true)}
                  className="text-[11px] font-mono text-primary flex items-center gap-1 hover:underline"
                >
                  <StickyNote className="w-3 h-3" />
                  + Catatan
                </button>
              )}
              <button 
                type="button"
                onClick={() => onRemove(id)} 
                className="opacity-40 group-hover:opacity-100 text-error hover:text-red-700 transition-opacity p-0.5"
                title="Hapus item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {hasNoteField && (isOpenNote || Boolean(note)) && (
        <div className="bg-surface-container-low/70 p-2 rounded-md border border-outline-variant/10 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-on-surface-variant font-bold flex items-center gap-1">
              <StickyNote className="w-3 h-3 text-primary" />
              Catatan Khusus
            </span>
            <button
              type="button"
              onClick={() => {
                onUpdateNote(id, '')
                setIsOpenNote(false)
              }}
              className="text-on-surface-variant hover:text-error"
              title="Hapus catatan"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <input
            type="text"
            className="w-full bg-surface border border-outline-variant/20 rounded px-2 py-1 text-xs font-body focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-[11px]"
            placeholder="Contoh: Es sedikit, pedas, pisah sambal..."
            value={note || ''}
            onChange={(e) => onUpdateNote(id, e.target.value)}
          />

          <div className="flex flex-wrap gap-1 mt-1.5">
            {QUICK_NOTES.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleAddChip(chip)}
                className="text-[10px] font-mono px-1.5 py-0.5 bg-surface rounded border border-outline-variant/20 hover:border-primary/40 hover:text-primary transition-colors text-on-surface-variant"
              >
                +{chip}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
