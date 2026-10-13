import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import ActiveStatusBadge from '~/components/ActiveStatusBadge.vue'

export function activeStatusColumn<T extends { isActive: boolean }>(feminine = false): TableColumn<T> {
  return {
    accessorKey: 'isActive',
    header: 'Estado',
    meta: { class: { th: 'text-center', td: 'text-center' } },
    cell: ({ row }) => h(ActiveStatusBadge, { active: row.original.isActive, feminine }),
  }
}
