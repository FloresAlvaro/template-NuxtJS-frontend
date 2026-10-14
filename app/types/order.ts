import type { SaleApi } from './sale'
export type OrderStatus =
  'PENDING' | 'CONFIRMED' | 'READY' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED'
export interface OrderApi {
  orderId: number
  requestId: string
  customerId: number
  customerName: string
  customerDocument: string | null
  status: OrderStatus
  fulfillment: 'PICKUP'
  total: string
  createdAt: string
  expiresAt: string
  confirmedAt: string | null
  readyAt: string | null
  completedAt: string | null
  cancelledAt: string | null
  items: {
    orderItemId: number
    productId: number
    productName: string
    sku: string
    quantity: number
    unitPrice: string
    subtotal: string
  }[]
  sale: Pick<
    SaleApi,
    | 'saleId'
    | 'status'
    | 'total'
    | 'adjustedTotal'
    | 'paid'
    | 'refunded'
    | 'balanceDue'
    | 'refundDue'
  > | null
  operations?: {
    operationId: number
    kind: string
    userName: string
    reason: string
    createdAt: string
  }[]
}
export interface OrderPage {
  items: OrderApi[]
  total: number
  page: number
  limit: number
}
export interface CreateOrderPayload {
  requestId: string
  items: { productId: number; quantity: number; expectedUnitPrice: string }[]
}
