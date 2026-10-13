import type { Role } from '~/types/auth'
export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Administrador',
  SELLER: 'Vendedor',
  CUSTOMER: 'Cliente',
}
export const ROLES: Role[] = ['ADMIN', 'SELLER', 'CUSTOMER']
