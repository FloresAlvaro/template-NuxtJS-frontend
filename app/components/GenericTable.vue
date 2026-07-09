<!-- components/GenericTable.vue -->
<script setup lang="ts" generic="TData">
import type { TableColumn } from '@nuxt/ui'

defineProps<{
  data: TData[]
  columns: TableColumn<TData>[]
}>()
</script>

<template>
  <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
    <UTable :data="data" :columns="columns" class="flex-1">
      
      <!-- 
        Usa v-slot de forma dinámica para interceptar la columna 'actions'.
        Al hacer binding de (props), le pasamos el objeto { row } original al index.vue
      -->
      <template #actions-cell="props">
        <slot name="actions" v-bind="props" />
      </template>

    </UTable>
  </div>
</template>