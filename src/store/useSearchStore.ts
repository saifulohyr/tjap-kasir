import { create } from 'zustand'

interface SearchStore {
  inventorySearch: string
  setInventorySearch: (q: string) => void
}

export const useSearchStore = create<SearchStore>((set) => ({
  inventorySearch: '',
  setInventorySearch: (q) => set({ inventorySearch: q })
}))
