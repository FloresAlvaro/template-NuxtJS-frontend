export interface SalesReport {
  from: string
  to: string
  saleCount: number
  originalTotal: string
  adjustedTotal: string
  paid: string
  refunded: string
  balanceDue: string
  refundDue: string
}
export interface TopProductsReport {
  items: {
    productId: number
    sku: string
    productName: string
    quantity: string
    netTotal: string
  }[]
}
export interface InventoryReport {
  productCount: number
  outOfStock: number
  lowStock: number
  available: number
  quantity: string
}
export interface LowStockReport {
  items: {
    productId: number
    name: string
    sku: string
    inventory: { quantity: number; minStock: number } | null
  }[]
  total: number
  page: number
  limit: number
}
