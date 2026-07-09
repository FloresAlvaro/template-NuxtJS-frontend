<!-- components/GenericTable.vue -->
<script setup lang="ts" generic="TData">
import type { TableColumn } from '@nuxt/ui'

// Usamos genéricos en Vue 3 para que TypeScript mantenga el tipado estricto de cualquier objeto
defineProps<{
  data: TData[]
  columns: TableColumn<TData>[]
}>()
</script>

<template>
  <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
    <UTable :data="data" :columns="columns" class="flex-1" />
  </div>
</template>