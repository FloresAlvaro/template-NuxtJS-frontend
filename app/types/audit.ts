export interface AuditEntryApi {
  auditId: number
  actorId: number | null
  actorName: string
  entity: string
  entityId: number
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  createdAt: string
}
export interface AuditPage {
  items: AuditEntryApi[]
  total: number
  page: number
  limit: number
}
