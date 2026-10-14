export interface SupplierApi {
  supplierId: number
  name: string
  document: string | null
  contactName: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}
export interface SupplierPage {
  items: SupplierApi[]
  total: number
  page: number
  limit: number
}
