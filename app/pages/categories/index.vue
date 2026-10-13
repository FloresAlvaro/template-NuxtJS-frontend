<script setup lang="ts">
const auth = useAuth()
import { h, resolveComponent } from 'vue'
import type { BreadcrumbItem, TableColumn } from '@nuxt/ui'
import type { CategoryApi } from '~/types/category'
import CreateCategoryBtn from '~/components/categories/CreateCategoryBtn.vue'
import EditCategoryBtn from '~/components/categories/EditCategoryBtn.vue'
import ToggleCategoryStatusBtn from '~/components/categories/ToggleCategoryStatusBtn.vue'

const UBadge = resolveComponent('UBadge')

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Inicio', icon: 'i-lucide-house', to: '/' },
  { label: 'Categorías', icon: 'i-lucide-folder' },
]

const { data: categories, error, pending } = await useApiFetch<CategoryApi[]>('/categories', {})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const columns: TableColumn<CategoryApi>[] = [
  {
    accessorKey: 'categoryId',
    header: '#',
    cell: ({ row }) => `#${row.getValue('categoryId')}`,
  },
  {
    accessorKey: 'name',
    header: 'Categoría',
    meta: { class: { td: 'font-semibold' } },
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
  },
  {
    accessorKey: 'isActive',
    header: 'Estado',
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean
      const color = isActive ? ('success' as const) : ('neutral' as const)

      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () =>
        isActive ? 'Activa' : 'Inactiva',
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Fecha de Creación',
    cell: ({ row }) => formatDate(row.getValue('createdAt') as string),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Última Actualización',
    cell: ({ row }) => formatDate(row.getValue('updatedAt') as string),
  },
  {
    id: 'subcategories',
    header: 'Subcategorías',
  },
  {
    id: 'actions',
    header: 'Acciones',
  },
]
</script>

<template>
  <div>
    <UBreadcrumb :items="breadcrumbs" class="mb-4" />
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-xl font-bold">Categorías</h3>
      <CreateCategoryBtn v-if="auth.isAdmin.value" />
    </div>

    <div v-if="pending" class="text-gray-600 dark:text-gray-400 p-4">Cargando categorías...</div>

    <div v-else-if="error" class="text-red-600 dark:text-red-400 p-4">
      Error: {{ error.message }}
    </div>

    <GenericTable v-else-if="categories?.length" :data="categories" :columns="columns">
      <template #subcategories="{ row }">
        <UButton
          :to="{
            path: '/sub-categories',
            query: { categoryId: row.original.categoryId },
          }"
          icon="i-lucide-eye"
          color="neutral"
          variant="soft"
          :aria-label="`Ver subcategorías de ${row.original.name}`"
        >
          Ver
        </UButton>
      </template>
      <template #actions="{ row }">
        <div class="flex items-center gap-2">
          <EditCategoryBtn v-if="auth.isAdmin.value" :category="row.original" />
          <ToggleCategoryStatusBtn v-if="auth.isAdmin.value" :category="row.original" />
        </div>
      </template>
    </GenericTable>

    <div v-else class="text-gray-500 p-4">No hay categorías disponibles</div>
  </div>
</template>
