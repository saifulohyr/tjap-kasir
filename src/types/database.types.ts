export interface CartItem {
  id: string
  title: string
  price: number
  quantity: number
  imageUrl: string
  hasNoteField?: boolean
  note?: string
}

export interface Product {
  id: string
  title: string
  sku: string
  category: string
  price: number
  stock: number
  stock_status: string
  image_url: string
}
