'use client'

import { X, Search, FileText, Trash2, CheckCircle2 } from 'lucide-react'
import { useCartStore } from '@/store/useCartStore'
import { useState } from 'react'

interface SavedDraftsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SavedDraftsModal({ isOpen, onClose }: SavedDraftsModalProps) {
  const { drafts, loadDraft, deleteDraft } = useCartStore()
  const [searchTerm, setSearchTerm] = useState('')

  if (!isOpen) return null

  const filteredDrafts = drafts.filter(draft => 
    draft.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        
        <div className="p-6 border-b border-outline-variant/15 flex justify-between items-center bg-surface-container-lowest z-10">
          <div>
            <h2 className="font-serif text-2xl font-bold text-tertiary">Open Tabs</h2>
            <p className="font-mono text-xs text-on-surface-variant opacity-80 mt-1">Manage parked ledgers & waiting orders</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-surface-variant rounded-full transition-colors">
            <X className="w-5 h-5 text-on-surface-variant" />
          </button>
        </div>

        <div className="p-6 bg-surface-container-low border-b border-outline-variant/10">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tabs or table numbers..."
              className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-lg py-2.5 pl-10 pr-4 font-mono text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-surface-container-lowest">
          {drafts.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-on-surface-variant/50">
              <FileText className="w-8 h-8 mb-3 opacity-30" />
              <p className="font-mono text-sm italic">No open tabs found.</p>
            </div>
          ) : filteredDrafts.length === 0 ? (
            <div className="h-40 flex flex-col items-center justify-center text-on-surface-variant/50">
              <p className="font-mono text-sm italic">No tabs match your search.</p>
            </div>
          ) : (
            filteredDrafts.map(draft => (
              <div key={draft.id} className="bg-surface-container-low border border-outline-variant/15 p-4 rounded-lg flex items-center justify-between group hover:border-primary/30 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-serif text-lg font-bold text-on-surface">{draft.name}</h4>
                    <span className="font-mono text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded tracking-wider">
                      {draft.items.length} ITEMS
                    </span>
                  </div>
                  <p className="font-mono text-xs text-on-surface-variant opacity-70">
                    Saved: {new Date(draft.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary mr-4 hidden sm:block">
                    Rp {draft.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('id-ID')}
                  </span>
                  <button 
                    onClick={() => {
                      loadDraft(draft.id)
                      onClose()
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg font-mono text-xs font-bold uppercase transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Restore
                  </button>
                  <button 
                    onClick={() => deleteDraft(draft.id)}
                    className="p-2 text-on-surface-variant hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}
