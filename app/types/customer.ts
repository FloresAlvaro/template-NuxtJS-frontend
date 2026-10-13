export interface CustomerApi {
  customerId: number
  userId: number | null
  name: string
  document: string | null
  phone: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}
export interface CustomerPage {
  items: CustomerApi[]
  total: number
  page: number
  limit: number
}
