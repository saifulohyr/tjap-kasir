import { create } from 'zustand'
import { CartItem, Product } from '@/types/database.types'

interface SavedDraft {
  id: string
  items: CartItem[]
  timestamp: string
  name: string
  orderType: string
}

interface CartStore {
  cart: CartItem[]
  drafts: SavedDraft[]
  orderType: string
  setOrderType: (type: string) => void
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  updateNote: (productId: string, note: string) => void
  saveDraft: (name?: string) => void
  loadDraft: (draftId: string) => void
  deleteDraft: (draftId: string) => void
  clearCart: () => void
  getSubtotal: () => number
}

export const useCartStore = create<CartStore>((set, get) => ({
  cart: [],
  drafts: [],
  orderType: 'Dine In',
  setOrderType: (type) => set({ orderType: type }),
  addToCart: (product) => {
    const cart = get().cart
    const existingItem = cart.find(item => item.id === product.id)
    if (existingItem) {
      set({
        cart: cart.map(item =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      })
    } else {
      set({
        cart: [...cart, {
          id: product.id,
          title: product.title,
          price: product.price,
          quantity: 1,
          imageUrl: product.image_url,
          hasNoteField: true // Allow assigning notes on checkout conceptually
        }]
      })
    }
  },
  removeFromCart: (productId) => {
    set({ cart: get().cart.filter(item => item.id !== productId) })
  },
  updateQuantity: (productId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId)
    } else {
      set({
        cart: get().cart.map(item =>
          item.id === productId ? { ...item, quantity } : item
        )
      })
    }
  },
  updateNote: (productId, note) => {
    set({
      cart: get().cart.map(item =>
        item.id === productId ? { ...item, note } : item
      )
    })
  },
  saveDraft: (name) => {
    const { cart, drafts, orderType, clearCart } = get()
    if (cart.length === 0) return
    const newDraft: SavedDraft = {
      id: crypto.randomUUID(),
      items: [...cart],
      timestamp: new Date().toISOString(),
      name: name || `Draft ${drafts.length + 1}`,
      orderType
    }
    set({ drafts: [...drafts, newDraft] })
    clearCart()
  },
  loadDraft: (draftId) => {
    const draft = get().drafts.find(d => d.id === draftId)
    if (draft) {
      set({ cart: [...draft.items], orderType: draft.orderType || 'Dine In' })
      get().deleteDraft(draftId) // remove from drafts when restoring
    }
  },
  deleteDraft: (draftId) => {
    set({ drafts: get().drafts.filter(d => d.id !== draftId) })
  },
  clearCart: () => set({ cart: [] }),
  getSubtotal: () => {
    return get().cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }
}))
