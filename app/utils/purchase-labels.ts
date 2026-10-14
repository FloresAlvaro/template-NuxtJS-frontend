import type { PurchaseStatus } from '~/types/purchase'
export const purchaseStatusLabels: Record<PurchaseStatus, string> = {
  PENDING: 'Pendiente',
  RECEIVED: 'Recibida',
  CANCELLED: 'Cancelada',
}
