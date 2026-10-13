export interface ProductApi {
  productId: number
  subCategoryId: number
  name: string
  sku: string
  barcode: string | null
  description: string | null
  cost?: string
  salePrice: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductPage {
  items: ProductApi[]
  total: number
  page: number
  limit: number
}

