import type { AuditEntryApi } from '~/types/audit'
export const auditEntityLabels: Record<string, string> = {
  Category: 'Categoría',
  SubCategory: 'Subcategoría',
  Product: 'Producto',
  ProductImage: 'Imagen de producto',
  User: 'Usuario / permisos',
  Inventory: 'Mínimo de stock',
  Supplier: 'Proveedor',
  Promotion: 'Promoción',
}
export const auditActionLabels = {
  INSERT: 'Creación',
  UPDATE: 'Modificación',
  DELETE: 'Eliminación',
}
export function auditChanges(entry: AuditEntryApi) {
  return [
    ...new Set([
      ...Object.keys(entry.before ?? {}),
      ...Object.keys(entry.after ?? {}),
    ]),
  ]
    .filter(
      (key) =>
        JSON.stringify(entry.before?.[key]) !==
        JSON.stringify(entry.after?.[key]),
    )
    .map((key) => ({
      field: key,
      before: entry.before?.[key] ?? null,
      after: entry.after?.[key] ?? null,
    }))
}
export function auditValue(value: unknown, field?: string) {
  if (field === 'percentBps' && typeof value === 'number')
    return value / 100 + '%'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  return value === null
    ? '—'
    : typeof value === 'object'
      ? JSON.stringify(value)
      : String(value)
}

export const auditFieldLabels: Record<string, string> = {
  name: 'Nombre',
  description: 'Descripción',
  isActive: 'Activo',
  categoryId: 'Categoría (ID)',
  subCategoryId: 'Subcategoría (ID)',
  sku: 'SKU',
  barcode: 'Código de barras',
  cost: 'Costo',
  salePrice: 'Precio de venta',
  role: 'Rol',
  email: 'Correo',
  minStock: 'Stock mínimo',
  document: 'Documento',
  contactName: 'Contacto',
  phone: 'Teléfono',
  address: 'Dirección',
  notes: 'Notas',
  code: 'Código',
  percentBps: 'Descuento (%)',
  startsAt: 'Inicio de vigencia',
  endsAt: 'Fin de vigencia',
  minSubtotal: 'Compra mínima',
  allowSeller: 'Permitir vendedores',
  version: 'Versión',
  hasImage: 'Imagen presente',
  sizeBytes: 'Tamaño (bytes)',
  contentFingerprint: 'Identificador de contenido',
}
