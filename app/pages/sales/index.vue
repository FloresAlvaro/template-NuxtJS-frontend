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
      formatStoreDate(row.original.createdAt),
  },
  { accessorKey: 'adjustedTotal', header: 'Total vigente' },
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
  <div class="space-y-6">
    <UBreadcrumb :items="[{ label: 'Inicio', to: '/' }, { label: 'Ventas' }]" />
    <WorkspaceHeader eyebrow="Gestión comercial" title="Ventas" icon="i-lucide-receipt" description="Cada venta, con sus productos, cobros y movimientos en un mismo lugar.">
      <template #actions><UButton to="/sales/new" icon="i-lucide-plus" size="lg" color="neutral" :ui="{ base: 'bg-white text-violet-950 hover:bg-violet-100' }">Nueva venta</UButton></template>
    </WorkspaceHeader>
    <div class="flex items-start gap-3 rounded-2xl border border-default bg-default p-5"><span class="rounded-xl bg-primary/10 p-2 text-primary"><UIcon name="i-lucide-wallet" class="size-5" /></span><div><h2 class="font-semibold">Consulta y seguimiento</h2><p class="mt-1 text-sm text-muted">Abre una venta para registrar cobros o consultar devoluciones y anulaciones. Registrar una venta descuenta stock; el cobro se registra por separado.</p></div></div>
    <UCard>
    <UFormField label="Buscar venta"
      ><UInput
        v-model="input"
        icon="i-lucide-search"
        placeholder="Cliente, documento, SKU o producto vendido"
        :maxlength="150"
        class="w-full"
    /></UFormField>
    </UCard>
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
      >
      <template #saleId="{ row }"><span class="font-bold text-primary">#{{ row.original.saleId }}</span></template>
      <template #status="{ row }"><SaleStatusBadge :status="row.original.status" /></template>
      <template #adjustedTotal="{ row }"><span class="font-semibold tabular-nums">{{ row.original.adjustedTotal }}</span></template>
      <template #balanceDue="{ row }"><span class="tabular-nums" :class="row.original.balanceDue !== '0.00' ? 'text-warning font-semibold' : 'text-muted'">{{ row.original.balanceDue }}</span></template>
      <template #actions="{ row }"
        ><UButton
          icon="i-lucide-eye"
          color="neutral"
          variant="soft"
          :to="`/sales/${row.original.saleId}`"
          >Ver</UButton
        ></template
      ></GenericTable
    >
    <div v-else class="rounded-2xl border border-dashed border-default p-10 text-center"><UIcon name="i-lucide-receipt" class="size-10 text-muted" /><h2 class="mt-3 font-semibold">Sin ventas para mostrar</h2><p class="mt-2 text-sm text-muted">Prueba otra búsqueda o registra una nueva venta.</p></div>
    <ListPagination v-if="data && !error" v-model="page" :total="data.total" :limit="20" :pending="pending" label="ventas" />
  </div>
</template>
