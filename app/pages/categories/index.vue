<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { CategoryApi } from '~/types/category'

const UBadge = resolveComponent('UBadge')

const config = useRuntimeConfig()

const { data: categories, error, pending } = await useFetch<CategoryApi[]>('/categories', {
    baseURL: config.public.apiBase
})

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
  }
]
</script>

<template>
  <div>
    <h3 class="text-xl font-bold mb-4">Categorías</h3>
    
    <div v-if="pending" class="text-gray-600 dark:text-gray-400 p-4">
      Cargando categorías...
    </div>

    <div v-else-if="error" class="text-red-600 dark:text-red-400 p-4">
      Error: {{ error.message }}
    </div>

    <GenericTable v-else-if="categories?.length" :data="categories" :columns="columns" />

    <div v-else class="text-gray-500 p-4">
      No hay categorías disponibles
    </div>
  </div>
</template>


