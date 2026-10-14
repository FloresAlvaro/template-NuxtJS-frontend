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
    reservedQuantity: number
    availableQuantity: number
    inventory: { quantity: number; minStock: number } | null
  }[]
  total: number
  page: number
  limit: number
}

export interface SalesSeriesReport {
  group: 'DAY' | 'MONTH'
  timeZone: string
  items: {
    date: string
    saleCount: number
    originalTotal: string
    adjustedTotal: string
  }[]
}
export interface SellersReport {
  total: number
  limit: number
  items: {
    userId: number
    sellerName: string
    saleCount: number
    originalTotal: string
    adjustedTotal: string
  }[]
}
export interface PaymentMethodsReport {
  items: {
    method: 'CASH' | 'CARD' | 'TRANSFER'
    paymentCount: number
    amount: string
  }[]
}
