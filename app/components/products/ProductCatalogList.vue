<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ProductApi } from '~/types/product'

defineProps<{
  products: ProductApi[]
  categoryName: (id: number) => string
  subCategoryName: (id: number) => string
  detailLoading?: boolean
}>()
const emit = defineEmits<{
  view: [product: ProductApi]
  inventory: [product: ProductApi]
  photo: [product: ProductApi]
  edit: [product: ProductApi]
  toggle: [product: ProductApi]
}>()
const columns: TableColumn<ProductApi>[] = [
  { id: 'product', header: 'Producto', meta: { class: { th: 'w-[26%]' } } },
  {
    id: 'classification',
    header: 'Clasificación',
    meta: { class: { th: 'w-[17%]' } },
  },
  {
    accessorKey: 'salePrice',
    header: 'Precio de venta',
    meta: { class: { th: 'w-[12%]' } },
  },
  { id: 'stock', header: 'Stock', meta: { class: { th: 'w-[20%]' } } },
  { id: 'state', header: 'Estado', meta: { class: { th: 'w-[10%]' } } },
  { id: 'actions', header: 'Acciones', meta: { class: { th: 'w-[15%]' } } },
]
const actions = {
  view: (product: ProductApi) => emit('view', product),
  inventory: (product: ProductApi) => emit('inventory', product),
  photo: (product: ProductApi) => emit('photo', product),
  edit: (product: ProductApi) => emit('edit', product),
  toggle: (product: ProductApi) => emit('toggle', product),
}
</script>

<template>
  <div>
    <UTable
      class="hidden rounded-2xl border border-default lg:block"
      :data="products"
      :columns="columns"
      :ui="{
        base: 'w-full table-fixed',
        th: 'px-2 py-4 text-center whitespace-normal',
        td: 'px-2 py-4 text-center whitespace-normal break-words',
      }"
    >
      <template #product-cell="{ row }">
        <div
          class="grid grid-cols-1 items-center justify-items-center gap-2 xl:grid-cols-[3rem_minmax(0,1fr)] xl:gap-3 xl:pl-3"
        >
          <ProductPhoto
            :src="row.original.imageUrl"
            :name="row.original.name"
            compact
            class="size-12 shrink-0 rounded-xl"
          />
          <div class="w-full min-w-0 text-left">
            <p class="font-semibold text-highlighted">
              {{ row.original.name }}
            </p>
            <p class="mt-1 break-all text-xs text-muted">
              {{ row.original.sku }}
            </p>
          </div>
        </div>
      </template>
      <template #classification-cell="{ row }"
        ><p>{{ categoryName(row.original.subCategoryId) }}</p>
        <p class="mt-1 text-xs text-muted">
          {{ subCategoryName(row.original.subCategoryId) }}
        </p></template
      >
      <template #salePrice-cell="{ row }"
        ><span class="font-semibold tabular-nums">{{
          row.original.salePrice
        }}</span></template
      >
      <template #stock-cell="{ row }"
        ><ProductStockSummary :product="row.original"
      /></template>
      <template #state-cell="{ row }"
        ><ActiveStatusBadge :active="row.original.isActive"
      /></template>
      <template #actions-cell="{ row }"
        ><ProductRowActions
          :product="row.original"
          :detail-loading="detailLoading"
          v-on="actions"
      /></template>
    </UTable>
    <ul class="grid gap-3 sm:grid-cols-2 lg:hidden" aria-label="Productos">
      <li
        v-for="product in products"
        :key="product.productId"
        class="min-w-0 rounded-2xl border border-default bg-default p-4"
      >
        <div class="flex items-center gap-3">
          <ProductPhoto
            :src="product.imageUrl"
            :name="product.name"
            compact
            class="size-14 shrink-0 rounded-xl"
          />
          <div class="min-w-0">
            <h2 class="break-words font-semibold">{{ product.name }}</h2>
            <p class="break-all text-xs text-muted">{{ product.sku }}</p>
          </div>
        </div>
        <p class="mt-3 break-words text-center text-sm text-muted">
          {{ categoryName(product.subCategoryId) }} /
          {{ subCategoryName(product.subCategoryId) }}
        </p>
        <div class="my-4 flex flex-wrap items-center justify-center gap-3">
          <span class="font-semibold tabular-nums"
            >Precio: {{ product.salePrice }}</span
          ><ActiveStatusBadge :active="product.isActive" />
        </div>
        <ProductStockSummary :product="product" />
        <div class="mt-4 border-t border-default pt-3">
          <ProductRowActions
            :product="product"
            :detail-loading="detailLoading"
            v-on="actions"
          />
        </div>
      </li>
    </ul>
  </div>
</template>
