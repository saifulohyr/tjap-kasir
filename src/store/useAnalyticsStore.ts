import { create } from 'zustand'

interface AnalyticsStore {
  selectedDate: string
  setSelectedDate: (date: string) => void
}

export const useAnalyticsStore = create<AnalyticsStore>((set) => ({
  // Initialize empty — will be set to today on client-side mount to avoid SSR/client mismatch
  selectedDate: '', 
  setSelectedDate: (date) => set({ selectedDate: date })
}))
