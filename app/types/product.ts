export interface ProductApi {
  reservedQuantity: number
  availableQuantity: number
  quantity: number
  minStock: number
  stockStatus: 'OUT_OF_STOCK' | 'LOW_STOCK' | 'AVAILABLE'
  imageUrl: string | null
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
