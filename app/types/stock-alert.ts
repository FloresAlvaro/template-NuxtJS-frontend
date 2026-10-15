export interface StockAlertApi {
  productId: number
  name: string
  sku: string
  category: string
  subCategory: string
  quantity: number
  reservedQuantity: number
  availableQuantity: number
  minStock: number
  suggestedQuantity: number
  severity: 'OUT_OF_STOCK' | 'LOW_STOCK'
}
export interface StockAlertPage {
  data: StockAlertApi[]
  total: number
  page: number
  limit: number
  asOf: string
  summary: { total: number; outOfStock: number; lowStock: number }
}
