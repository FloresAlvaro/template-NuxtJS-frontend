<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { PurchaseApi, PurchasePage } from '~/types/purchase'
const route = useRoute()
const { input, search, page, status } = usePagedSearchFilters(
  Object.keys(purchaseStatusLabels),
)
const supplierId = computed(() =>
  typeof route.query.supplierId === 'string' &&
  /^[1-9]\d*$/.test(route.query.supplierId) &&
  Number(route.query.supplierId) <= 2147483647
    ? Number(route.query.supplierId)
    : undefined,
)
const query = computed(() => ({
  page: page.value,
  search: search.value,
  status: status.value === 'all' ? undefined : status.value,
  supplierId: supplierId.value,
  limit: 20,
}))
const { data, pending, error, refresh } = await useApiFetch<PurchasePage>(
  '/purchases',
  { query },
)
const { getApiErrorMessage } = useApiErrorMessage()
const columns = (
  [
    {
      accessorKey: 'purchaseId',
      header: 'Compra',
      cell: ({ row }) => `#${row.original.purchaseId}`,
    },
    { accessorKey: 'supplierName', header: 'Proveedor' },
    { accessorKey: 'reference', header: 'Referencia' },
    { id: 'state', header: 'Estado' },
    { accessorKey: 'total', header: 'Total' },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => formatStoreDate(row.original.createdAt),
    },
    { id: 'actions', header: 'Acciones' },
  ] satisfies TableColumn<PurchaseApi>[]
).map((column) => ({
  ...column,
  meta: { class: { th: 'text-center', td: 'text-center' } },
}))
</script>
<template>
  <div class="space-y-4">
    <UBreadcrumb
      :items="[{ label: 'Inicio', to: '/' }, { label: 'Compras' }]"
    />
    <div class="flex flex-wrap justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">Compras</h1>
        <p class="mt-1 text-sm text-muted">
          El stock aumenta al recibir la mercadería.
        </p>
      </div>
      <UButton to="/purchases/new" icon="i-lucide-plus">Nueva compra</UButton>
    </div>
    <UAlert
      v-if="supplierId"
      color="info"
      :title="`Compras del proveedor #${supplierId}`"
      ><template #actions
        ><UButton
          color="neutral"
          variant="outline"
          :to="{
            path: '/purchases',
            query: { ...route.query, supplierId: undefined, page: undefined },
          }"
          >Quitar filtro</UButton
        ></template
      ></UAlert
    >
    <div class="grid gap-3 sm:grid-cols-2">
      <UFormField label="Buscar compra"
        ><UInput
          v-model="input"
          icon="i-lucide-search"
          placeholder="Proveedor, referencia, producto o SKU"
          :maxlength="150"
          class="w-full"
          :ui="{ base: 'h-10' }"
      /></UFormField>
      <UFormField label="Estado"
        ><USelect
          v-model="status"
          :items="[
            { label: 'Todos', value: 'all' },
            ...Object.entries(purchaseStatusLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]"
          class="w-full"
          :ui="{ base: 'h-10' }"
      /></UFormField>
    </div>
    <UAlert
      v-if="error"
      color="error"
      :title="getApiErrorMessage(error, 'No se pudieron cargar las compras')"
      ><template #actions
        ><UButton color="neutral" variant="outline" @click="refresh()"
          >Reintentar</UButton
        ></template
      ></UAlert
    >
    <p v-else-if="pending" role="status">Cargando compras...</p>
    <GenericTable
      v-else-if="data?.items.length"
      :data="data.items"
      :columns="columns"
      ><template #state="{ row }"
        ><PurchaseStatusBadge :status="row.original.status" /></template
      ><template #actions="{ row }"
        ><UButton
          icon="i-lucide-eye"
          color="neutral"
          variant="soft"
          :to="`/purchases/${row.original.purchaseId}`"
          :aria-label="`Ver compra ${row.original.purchaseId}`"
          >Ver</UButton
        ></template
      ></GenericTable
    >
    <p v-else>No hay compras que coincidan con los filtros.</p>
    <ListPagination
      v-if="data && !error"
      v-model="page"
      :total="data.total"
      :limit="20"
      :pending="pending"
      label="compras"
    />
  </div>
</template>
