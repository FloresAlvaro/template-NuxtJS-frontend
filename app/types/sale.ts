export interface SaleItemApi {
  listUnitPrice:string
  unitDiscount:string
  returnedQuantity: number
  saleItemId: number
  productId: number
  productName: string
  sku: string
  quantity: number
  unitPrice: string
  subtotal: string
}
export interface SaleApi {
  grossTotal:string
  discountTotal:string
  promotionSnapshot:{promotionId:number;code:string;name:string;percentBps:number;version:number}|null
  status: 'ACTIVE' | 'PARTIALLY_RETURNED' | 'RETURNED' | 'CANCELLED'
  paid: string
  refunded: string
  adjustedTotal: string
  balanceDue: string
  refundDue: string
  operations: SaleOperationApi[]
  saleId: number
  requestId: string
  customerId: number
  customerName: string
  customerDocument: string | null
  sellerName: string
  total: string
  createdAt: string
  items: SaleItemApi[]
}
export interface SalePage {
  items: SaleApi[]
  total: number
  page: number
  limit: number
}

export interface SaleOperationApi {
  cashMovement: {shiftId:number}|null
  operationId: number
  kind: 'PAYMENT' | 'REFUND' | 'RETURN' | 'CANCEL'
  amount: string
  method: 'CASH' | 'CARD' | 'TRANSFER' | null
  reason: string
  userName: string
  createdAt: string
  items: { saleItemId: number; quantity: number; subtotal: string }[]
}
