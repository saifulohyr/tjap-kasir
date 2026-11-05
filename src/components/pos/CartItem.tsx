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
  onUpdateNote,
}: CartItemProps) {
  const [isOpenNote, setIsOpenNote] = useState(Boolean(note))
  const formattedPrice = `Rp ${(price * quantity).toLocaleString('id-ID')}`

  const handleAddChip = (chip: string) => {
    if (!note) {
      onUpdateNote(id, chip)
    } else if (!note.includes(chip)) {
      onUpdateNote(id, `${note}, ${chip}`)
    }
  }

  return (
    <div className="bg-slate-50/70 p-3 rounded-xl flex flex-col gap-2.5 border border-slate-200/70 group hover:border-slate-300 transition-colors">
      <div className="flex gap-3 items-center">
        <div className="relative w-10 h-10 rounded-lg bg-white border border-slate-200/80 overflow-hidden flex-shrink-0 flex items-center justify-center">
          {imageUrl ? (
            <Image src={imageUrl} alt={title} fill sizes="40px" className="object-cover" />
          ) : (
            <span className="font-mono font-bold text-xs text-red-600">TC</span>
          )}
        </div>

        <div className="flex-1 w-full overflow-hidden">
          <div className="flex justify-between items-start gap-2">
            <h4 className="text-xs lg:text-sm font-semibold text-slate-900 leading-tight truncate">
              {title}
            </h4>
            <span className="font-mono text-xs lg:text-sm font-bold text-slate-900 shrink-0">
              {formattedPrice}
            </span>
          </div>

          <div className="flex items-center justify-between mt-2">
            {/* Quantity Stepper */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onDecrement(id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-red-400 hover:text-red-600 active:scale-95 transition-all shadow-2xs"
                title="Kurang 1"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="font-mono text-xs w-6 text-center font-bold text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => onIncrement(id)}
                className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-red-400 hover:text-red-600 active:scale-95 transition-all shadow-2xs"
                title="Tambah 1"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              {hasNoteField && !isOpenNote && !note && (
                <button
                  type="button"
                  onClick={() => setIsOpenNote(true)}
                  className="text-[11px] font-mono text-red-600 flex items-center gap-1 hover:underline"
                >
                  <StickyNote className="w-3 h-3" />
                  + Catatan
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemove(id)}
                className="text-slate-400 hover:text-red-600 transition-colors p-1"
                title="Hapus item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {hasNoteField && (isOpenNote || Boolean(note)) && (
        <div className="bg-white p-2.5 rounded-lg border border-slate-200/90 text-xs shadow-2xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold flex items-center gap-1">
              <StickyNote className="w-3 h-3 text-red-600" />
              Catatan Khusus
            </span>
            <button
              type="button"
              onClick={() => {
                onUpdateNote(id, '')
                setIsOpenNote(false)
              }}
              className="text-slate-400 hover:text-red-600"
              title="Hapus catatan"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs focus:ring-1 focus:ring-red-500 focus:border-red-500 outline-none transition-all placeholder:text-slate-400"
            placeholder="Contoh: Es sedikit, pedas, pisah sambal..."
            value={note || ''}
            onChange={(e) => onUpdateNote(id, e.target.value)}
          />

          <div className="flex flex-wrap gap-1 mt-2">
            {QUICK_NOTES.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleAddChip(chip)}
                className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-300 rounded-md border border-slate-200 text-slate-600 transition-colors"
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
