export interface CategoryApi {
  categoryId: number
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CategoryCreatePayload {
  name: string
  description?: string
}
