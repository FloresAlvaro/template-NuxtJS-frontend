export interface OrderNotificationApi {
  notificationId: number
  orderId: number
  userId: number
  status: 'CONFIRMED' | 'READY' | 'CANCELLED' | 'EXPIRED'
  recipient: string
  subject: string
  body: string
  attempts: number
  nextAttemptAt: string
  deliveredAt: string | null
  lastError: string | null
  readAt: string | null
  createdAt: string
}
export interface NotificationPage {
  items: OrderNotificationApi[]
  total: number
  unread: number
  page: number
  limit: number
}
