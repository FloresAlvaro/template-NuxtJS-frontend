import type { OrderStatus } from '~/types/order'
export const orderStatusLabels: Record<OrderStatus, string> = {
  PENDING: 'Pendiente de confirmación',
  CONFIRMED: 'Confirmado',
  READY: 'Listo para retirar',
  COMPLETED: 'Entregado',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Reserva vencida',
}
export const orderActionLabels = {
  confirm: 'Confirmar pedido',
  ready: 'Marcar listo',
  complete: 'Registrar entrega',
  cancel: 'Cancelar pedido',
}
export const orderOperationLabels: Record<string, string> = {
  CONFIRM: 'Confirmación',
  READY: 'Preparación',
  COMPLETE: 'Entrega',
  CANCEL: 'Cancelación',
}
