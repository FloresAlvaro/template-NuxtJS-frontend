export interface CashRegisterApi {
  registerId: number
  name: string
  isActive: boolean
}
export interface CashShiftApi {
  requestId: string
  shiftId: number
  registerId: number
  register?: CashRegisterApi
  userId: number
  userName: string
  openingAmount: string
  openedAt: string
  closedAt: string | null
  expectedAmount: string | null
  countedAmount: string | null
  difference: string | null
  closeReason: string | null
  summary?: {
    expectedAmount: string
    lastMovementId: number
    netPayments: { CASH: string; CARD: string; TRANSFER: string }
  }
}
export interface CashMovementApi {
  movementId: number
  kind: 'CASH_IN' | 'CASH_OUT' | 'PAYMENT' | 'REFUND'
  method: 'CASH' | 'CARD' | 'TRANSFER'
  amount: string
  reason: string
  userName: string
  createdAt: string
  saleOperation: { saleId: number } | null
}
export interface CashPage<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
