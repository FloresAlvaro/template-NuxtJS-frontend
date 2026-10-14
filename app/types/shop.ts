export interface ShopProduct {
  imageUrl: string | null
  productId: number
  name: string
  sku: string
  description: string | null
  salePrice: string
  quantity: number
  availableQuantity: number
}
export interface ShopPage {
  items: ShopProduct[]
  total: number
  page: number
  limit: number
}
