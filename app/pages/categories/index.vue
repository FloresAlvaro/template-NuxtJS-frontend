<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { CategoryApi } from '~/types/category'
import CreateCategoryBtn from './components/CreateCategoryBtn.vue'
import EditCategoryBtn from './components/EditCategoryBtn.vue'
import ToggleCategoryStatusBtn from './components/ToggleCategoryStatusBtn.vue'

const UBadge = resolveComponent('UBadge')

const config = useRuntimeConfig()

const { data: categories, error, pending } = await useFetch<CategoryApi[]>('/categories', {
    baseURL: config.public.apiBase
})

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const columns: TableColumn<CategoryApi>[] = [
  {
    accessorKey: 'categoryId',
    header: '#',
    cell: ({ row }) => `#${row.getValue('categoryId')}`
  },
  {
    accessorKey: 'name',
    header: 'Categoría',
    meta: { class: { td: 'font-semibold' } }
  },
  {
    accessorKey: 'description',
    header: 'Descripción'
  },
  {
    accessorKey: 'isActive',
    header: 'Estado',
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean
      const color = isActive ? 'success' as const : 'neutral' as const
      
      return h(UBadge, { class: 'capitalize', variant: 'subtle', color }, () => 
        isActive ? 'Activa' : 'Inactiva'
      )
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Fecha de Creación',
    cell: ({ row }) => formatDate(row.getValue('createdAt') as string)
  },
  {
    accessorKey: 'updatedAt',
    header: 'Última Actualización',
    cell: ({ row }) => formatDate(row.getValue('updatedAt') as string)
  },
  {
    id: 'actions',
    header: 'Acciones'
  }
]
</script>

<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-xl font-bold">Categorías</h3>
      <CreateCategoryBtn />
    </div>
    
    <div v-if="pending" class="text-gray-600 dark:text-gray-400 p-4">
      Cargando categorías...
    </div>

    <div v-else-if="error" class="text-red-600 dark:text-red-400 p-4">
      Error: {{ error.message }}
    </div>

    <GenericTable v-else-if="categories?.length" :data="categories" :columns="columns">
      <template #actions="{ row }">
        <div class="flex items-center gap-2">
          <EditCategoryBtn :category="row.original" />
          <ToggleCategoryStatusBtn :category="row.original" />
        </div>
      </template>

    </GenericTable>

    <div v-else class="text-gray-500 p-4">
      No hay categorías disponibles
    </div>
  </div>
</template>