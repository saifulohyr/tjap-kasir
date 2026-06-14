import { create } from 'zustand'

interface KitchenStore {
  /** Map of orderId → Set of checked itemIds */
  itemChecks: Record<string, Set<string>>
  toggleItemCheck: (orderId: string, itemId: string) => void
  clearOrderChecks: (orderId: string) => void
  isItemChecked: (orderId: string, itemId: string) => boolean
  getCheckedCount: (orderId: string, itemIds: string[]) => number
  allItemsDone: (orderId: string, itemIds: string[]) => boolean
}

export const useKitchenStore = create<KitchenStore>((set, get) => ({
  itemChecks: {},

  toggleItemCheck: (orderId, itemId) => {
    set(prev => {
      const current = new Set(prev.itemChecks[orderId] || [])
      if (current.has(itemId)) {
        current.delete(itemId)
      } else {
        current.add(itemId)
      }
      return { itemChecks: { ...prev.itemChecks, [orderId]: current } }
    })
  },

  clearOrderChecks: (orderId) => {
    set(prev => {
      const next = { ...prev.itemChecks }
      delete next[orderId]
      return { itemChecks: next }
    })
  },

  isItemChecked: (orderId, itemId) => {
    return get().itemChecks[orderId]?.has(itemId) ?? false
  },

  getCheckedCount: (orderId, itemIds) => {
    const checked = get().itemChecks[orderId]
    if (!checked) return 0
    return itemIds.filter(id => checked.has(id)).length
  },

  allItemsDone: (orderId, itemIds) => {
    if (itemIds.length === 0) return true
    return get().getCheckedCount(orderId, itemIds) === itemIds.length
  },
}))
