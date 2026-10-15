export type PurchaseStatus = 'PENDING' | 'RECEIVED' | 'CANCELLED'
export interface PurchaseLineApi {
  purchaseItemId: number
  productId: number
  productName: string
  sku: string
  quantity: number
  unitCost: string
  subtotal: string
}
export interface PurchaseOperationApi {
  operationId: number
  requestId: string
  kind: 'RECEIVE' | 'CANCEL'
  userId: number
  userName: string
  reason: string
  updateCost: boolean
  createdAt: string
}
export interface PurchaseApi {
  purchaseId: number
  requestId: string
  supplierId: number
  supplierName: string
  supplierDocument: string | null
  userId: number
  userName: string
  reference: string | null
  notes: string | null
  status: PurchaseStatus
  total: string
  createdAt: string
  updatedAt: string
  receivedAt: string | null
  cancelledAt: string | null
  items: PurchaseLineApi[]
  operations: PurchaseOperationApi[]
}
export interface PurchasePage {
  items: PurchaseApi[]
  total: number
  page: number
  limit: number
}
export interface CreatePurchaseBody {
  requestId: string
  supplierId: number
  reference: string | null
  notes: string | null
  items: { productId: number; quantity: number; unitCost: string }[]
}
