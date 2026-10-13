<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { SaleApi, SalePage } from '~/types/sale'
const route = useRoute()
const { input, search } = useSearchText()
const { getApiErrorMessage } = useApiErrorMessage()
const page = ref(1)
const customerId = computed(() =>
  typeof route.query.customerId === 'string' &&
  /^[1-9]\d*$/.test(route.query.customerId)
    ? Number(route.query.customerId)
    : undefined,
)
watch(
  [search, customerId],
  () => {
    page.value = 1
  },
  { flush: 'sync' },
)
const { data, pending, error, refresh } = await useApiFetch<SalePage>(
  '/sales',
  {
    query: { page, search, customerId, limit: 20 },
  },
)
const totalPages = computed(() =>
  Math.max(1, Math.ceil((data.value?.total ?? 0) / 20)),
)
const columns: TableColumn<SaleApi>[] = [
  {
    accessorKey: 'saleId',
    header: 'Venta',
    cell: ({ row }) => `#${row.original.saleId}`,
  },
  { accessorKey: 'customerName', header: 'Cliente' },
  { accessorKey: 'sellerName', header: 'Vendedor' },
  {
    accessorKey: 'createdAt',
    header: 'Fecha',
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleString('es-BO', {
        timeZone: 'America/La_Paz',
      }),
  },
  { accessorKey: 'total', header: 'Total original' },
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => saleStatusLabels[row.original.status],
  },
  { accessorKey: 'balanceDue', header: 'Por cobrar' },
  { accessorKey: 'refundDue', header: 'Por reembolsar' },
  { id: 'actions', header: 'Acciones' },
]
</script>
<template>
  <div class="space-y-4">
    <UBreadcrumb :items="[{ label: 'Inicio', to: '/' }, { label: 'Ventas' }]" />
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold">Ventas</h1>
      <UButton to="/sales/new" icon="i-lucide-plus">Nueva venta</UButton>
    </div>
    <UAlert
      color="info"
      title="Ventas registradas"
      description="Consulta cobros, devoluciones y anulaciones desde el detalle de cada venta. Registrar una venta descuenta las existencias."
    />
    <UFormField label="Buscar venta"
      ><UInput
        v-model="input"
        icon="i-lucide-search"
        placeholder="Cliente, documento, SKU o producto vendido"
        :maxlength="150"
        class="w-full"
    /></UFormField>
    <div v-if="customerId" class="flex gap-3 items-center">
      <span>Ventas del cliente #{{ customerId }}</span
      ><UButton color="neutral" variant="outline" to="/sales"
        >Ver todas</UButton
      >
    </div>
    <UAlert
      v-if="error"
      color="error"
      :title="getApiErrorMessage(error, 'No se pudieron cargar las ventas')"
      ><template #actions
        ><UButton color="neutral" variant="outline" @click="refresh()"
          >Reintentar</UButton
        ></template
      ></UAlert
    >
    <p v-else-if="pending" role="status">Cargando ventas...</p>
    <GenericTable
      v-else-if="data?.items.length"
      :data="data.items"
      :columns="columns"
      ><template #actions="{ row }"
        ><UButton
          icon="i-lucide-eye"
          color="neutral"
          variant="soft"
          :to="`/sales/${row.original.saleId}`"
          >Ver</UButton
        ></template
      ></GenericTable
    >
    <p v-else>No hay ventas que coincidan con los filtros.</p>
    <div class="flex items-center justify-between">
      <span class="text-sm"
        >{{ data?.total ?? 0 }} ventas · {{ page }} / {{ totalPages }}</span
      >
      <div class="flex gap-2">
        <UButton
          color="neutral"
          variant="outline"
          :disabled="page <= 1 || pending"
          @click="
            () => {
              page--
            }
          "
          >Anterior</UButton
        ><UButton
          color="neutral"
          variant="outline"
          :disabled="page >= totalPages || pending"
          @click="
            () => {
              page++
            }
          "
          >Siguiente</UButton
        >
      </div>
    </div>
  </div>
</template>
