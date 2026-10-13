export type Role = 'ADMIN' | 'SELLER' | 'CUSTOMER'
export interface AuthUser { userId: number; name: string; email: string; role: Role; isActive: boolean }
