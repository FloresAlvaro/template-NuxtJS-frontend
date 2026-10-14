<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type {
  SalesReport,
  TopProductsReport,
  InventoryReport,
  LowStockReport,
} from '~/types/report'
const today = useState('reports-initial-day', () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()),
)
const from = ref(`${today.value.slice(0, 7)}-01`)
const to = ref(today.value)
const periodError = ref('')
function period() {
  const start = new Date(`${from.value}T00:00:00-04:00`)
  const end = new Date(`${to.value}T00:00:00-04:00`)
  const exclusiveEnd = new Date(end.getTime() + 86400000)
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(from.value) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(to.value) ||
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    end < start ||
    exclusiveEnd.getTime() - start.getTime() > 366 * 86400000
  )
    throw new Error('Selecciona un período válido de hasta 366 días')
  return { from: start.toISOString(), to: exclusiveEnd.toISOString() }
}
const applied = ref(period())
const page = ref(1)
const { getApiErrorMessage } = useApiErrorMessage()
const sales = await useApiFetch<SalesReport>('/reports/sales', {
  query: applied,
})
const top = await useApiFetch<TopProductsReport>('/reports/top-products', {
  query: applied,
})
const inventory = await useApiFetch<InventoryReport>('/reports/inventory')
const low = await useApiFetch<LowStockReport>('/reports/low-stock', {
  query: { page, limit: 20 },
})
const busy = computed(
  () =>
    sales.pending.value ||
    top.pending.value ||
    inventory.pending.value ||
    low.pending.value,
)
const errors = computed(() =>
  [
    sales.error.value,
    top.error.value,
    inventory.error.value,
    low.error.value,
  ].filter(Boolean),
)
async function reload() {
  await Promise.all([
    sales.refresh(),
    top.refresh(),
    inventory.refresh(),
    low.refresh(),
  ])
}
async function apply() {
  periodError.value = ''
  try {
    const next = period()
    if (JSON.stringify(next) === JSON.stringify(applied.value))
      await Promise.all([sales.refresh(), top.refresh()])
    else applied.value = next
  } catch (cause) {
    periodError.value =
      cause instanceof Error ? cause.message : 'Período inválido'
  }
}
const salesCards: {
  key: keyof Pick<
    SalesReport,
    | 'saleCount'
    | 'originalTotal'
    | 'adjustedTotal'
    | 'paid'
    | 'refunded'
    | 'balanceDue'
    | 'refundDue'
  >
  label: string
}[] = [
  { key: 'saleCount', label: 'Ventas registradas' },
  { key: 'originalTotal', label: 'Total original' },
  { key: 'adjustedTotal', label: 'Total vigente' },
  { key: 'paid', label: 'Cobrado' },
  { key: 'refunded', label: 'Reembolsado' },
  { key: 'balanceDue', label: 'Por cobrar' },
  { key: 'refundDue', label: 'Por reembolsar' },
]
const topColumns: TableColumn<TopProductsReport['items'][number]>[] = [
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'productName', header: 'Producto histórico' },
  { accessorKey: 'quantity', header: 'Unidades netas' },
  { accessorKey: 'netTotal', header: 'Importe neto' },
]
const lowColumns: TableColumn<LowStockReport['items'][number]>[] = [
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'name', header: 'Producto' },
  {
    id: 'quantity',
    header: 'Stock físico',
    cell: ({ row }) => row.original.inventory?.quantity ?? 0,
  },
  {
    id: 'minimum',
    header: 'Mínimo',
    cell: ({ row }) => row.original.inventory?.minStock ?? 0,
  },
]
</script>
<template>
  <div class="space-y-5">
    <UBreadcrumb
      :items="[{ label: 'Inicio', to: '/' }, { label: 'Reportes' }]"
    />
    <h1 class="text-xl font-bold">Reportes</h1>
    <form class="flex flex-wrap items-end gap-3" @submit.prevent="apply">
      <UFormField label="Desde"
        ><UInput v-model="from" type="date" required /></UFormField
      ><UFormField label="Hasta (incluido)"
        ><UInput v-model="to" type="date" required /></UFormField
      ><UButton type="submit" :disabled="busy">Aplicar período</UButton
      ><UButton
        color="neutral"
        variant="outline"
        :disabled="busy"
        @click="reload"
        >Actualizar todo</UButton
      >
    </form>
    <UAlert v-if="periodError" color="error" :title="periodError" />
    <UAlert
      v-for="(error, index) in errors"
      :key="index"
      color="error"
      :title="
        getApiErrorMessage(
          error,
          'No se pudo consultar un reporte. Reintenta con Actualizar todo.',
        )
      "
    />
    <p v-if="busy" role="status">Actualizando reportes...</p>
    <h2 class="font-semibold text-lg">Ventas del período</h2>
    <p class="text-sm text-muted">
      Del {{ formatStoreDate(applied.from) }} al
      {{ formatStoreDate(applied.to) }} (límite final excluido). Los saldos
      reflejan el estado actual de las ventas creadas en ese período; no es un
      cierre de caja.
    </p>
    <div
      v-if="sales.data.value && !sales.error.value"
      class="grid sm:grid-cols-2 xl:grid-cols-4 gap-3"
    >
      <UCard v-for="card in salesCards" :key="card.key"
        ><p class="text-sm text-muted">{{ card.label }}</p>
        <strong class="text-xl">{{ sales.data.value[card.key] }}</strong></UCard
      >
    </div>
    <h2 class="font-semibold text-lg">
      Productos más vendidos · Hasta 100 resultados
    </h2>
    <GenericTable
      v-if="top.data.value?.items.length && !top.error.value"
      :data="top.data.value.items"
      :columns="topColumns"
    />
    <p v-else-if="!top.pending.value && !top.error.value">
      No hay ventas netas de productos en el período.
    </p>
    <h2 class="font-semibold text-lg">Inventario físico actual</h2>
    <p class="text-sm text-muted">
      Productos de categorías y subcategorías activas. Estas cifras no
      descuentan reservas ni dependen del período seleccionado.
    </p>
    <div
      v-if="inventory.data.value && !inventory.error.value"
      class="grid sm:grid-cols-2 xl:grid-cols-4 gap-3"
    >
      <UCard
        >Productos:
        <strong>{{ inventory.data.value.productCount }}</strong></UCard
      ><UCard
        >Unidades físicas:
        <strong>{{ inventory.data.value.quantity }}</strong></UCard
      ><UCard
        >Agotados: <strong>{{ inventory.data.value.outOfStock }}</strong></UCard
      ><UCard
        >Stock bajo: <strong>{{ inventory.data.value.lowStock }}</strong></UCard
      >
    </div>
    <h2 class="font-semibold text-lg">Productos en el mínimo o agotados</h2>
    <GenericTable
      v-if="low.data.value?.items.length && !low.error.value"
      :data="low.data.value.items"
      :columns="lowColumns"
    />
    <p v-else-if="!low.pending.value && !low.error.value">
      No hay productos con stock bajo o agotado.
    </p>
    <ListPagination
      v-if="low.data.value && !low.error.value"
      v-model="page"
      :total="low.data.value.total"
      :limit="20"
      :pending="low.pending.value"
    />
  </div>
</template>
