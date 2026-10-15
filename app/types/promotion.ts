export interface PromotionApi {
  promotionId: number
  code: string
  name: string
  percentBps: number
  startsAt: string
  endsAt: string
  isActive: boolean
  allowSeller: boolean
  minSubtotal: string
  version: number
}
export interface PromotionPage {
  items: PromotionApi[]
  total: number
  page: number
  limit: number
}
