export interface InventoryApi {
  productId: number
  reservedQuantity: number
  availableQuantity: number
  quantity: number
  minStock: number
  stockStatus: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'AVAILABLE'
}
export type MovementType = 'ENTRY' | 'EXIT' | 'ADJUSTMENT'
export interface StockMovementApi {
  stockMovementId: number
  type: MovementType
  quantity: number
  previousQuantity: number
  resultingQuantity: number
  reason: string
  createdAt: string
  user: { userId: number; name: string }
  operationItem?: { operation: { saleId: number } } | null
  saleItem?: { saleId: number } | null
}
export interface StockMovementPage {
  items: StockMovementApi[]
  total: number
  page: number
  limit: number
}
