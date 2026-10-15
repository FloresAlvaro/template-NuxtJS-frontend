<script setup lang="ts">
import type { ChartDatum } from '~/types/chart'
import type {
  SalesReport,
  TopProductsReport,
  InventoryReport,
  LowStockReport,
  SalesSeriesReport,
  SellersReport,
  PaymentMethodsReport,
} from '~/types/report'
import { apiErrorStatus } from '~/utils/api-error'
import { moneyCents, formatCents } from '~/utils/money'
import { reportNumber, bucketLabel } from '~/utils/chart'
const route = useRoute()
const router = useRouter()
const today = useState('reports-initial-day', () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date()),
)
const periodError = ref('')
function makePeriod(fromDay: string, toDay: string, group: 'DAY' | 'MONTH') {
  const date = (value: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
      throw new Error('Selecciona fechas válidas.')
    const parsed = new Date(`${value}T00:00:00-04:00`)
    if (
      !Number.isFinite(parsed.getTime()) ||
      new Date(parsed.getTime() - 4 * 3600000).toISOString().slice(0, 10) !==
        value
    )
      throw new Error('Selecciona fechas válidas.')
    return parsed
  }
  const start = date(fromDay),
    end = date(toDay)
  const exclusiveEnd = new Date(end.getTime() + 86400000)
  if (end < start || exclusiveEnd.getTime() - start.getTime() > 366 * 86400000)
    throw new Error(
      'Selecciona un período de hasta 366 días, con Desde anterior o igual a Hasta.',
    )
  return {
    fromDay,
    toDay,
    group,
    from: start.toISOString(),
    to: exclusiveEnd.toISOString(),
  }
}
function queryPeriod() {
  const fromDay =
    typeof route.query.from === 'string'
      ? route.query.from
      : `${today.value.slice(0, 7)}-01`
  const toDay =
    typeof route.query.to === 'string' ? route.query.to : today.value
  const group = route.query.group === 'MONTH' ? 'MONTH' : 'DAY'
  try {
    return makePeriod(fromDay, toDay, group)
  } catch {
    periodError.value =
      'Las fechas del enlace no son válidas. Se muestra el mes actual.'
    return makePeriod(`${today.value.slice(0, 7)}-01`, today.value, 'DAY')
  }
}
const selected = ref(queryPeriod())
const from = ref(selected.value.fromDay),
  to = ref(selected.value.toDay)
const grouping = ref<'DAY' | 'MONTH'>(selected.value.group)
watch(
  () => `${route.query.from}|${route.query.to}|${route.query.group}`,
  () => {
    const next = queryPeriod()
    from.value = next.fromDay
    to.value = next.toDay
    grouping.value = next.group
    if (JSON.stringify(next) !== JSON.stringify(selected.value))
      selected.value = next
  },
)
const metric = computed({
  get: () => (route.query.metric === 'AMOUNT' ? 'AMOUNT' : 'UNITS'),
  set: (value: string) => {
    void router.replace({
      query: {
        ...route.query,
        metric: value === 'AMOUNT' ? 'AMOUNT' : undefined,
      },
    })
  },
})
const page = computed({
  get: () => {
    const value = Number(route.query.stockPage)
    return Number.isSafeInteger(value) && value > 0 && value <= 1000000
      ? value
      : 1
  },
  set: (value: number) => {
    void router.replace({
      query: {
        ...route.query,
        stockPage: value > 1 ? String(value) : undefined,
      },
    })
  },
})
const periodQuery = computed(() => ({
  from: selected.value.from,
  to: selected.value.to,
}))
const topQuery = computed(() => ({
  ...periodQuery.value,
  metric: metric.value,
}))
const seriesQuery = computed(() => ({
  ...periodQuery.value,
  group: selected.value.group,
}))
const [sales, top, inventory, low, series, sellers, methods] =
  await Promise.all([
    useApiFetch<SalesReport>('/reports/sales', { query: periodQuery }),
    useApiFetch<TopProductsReport>('/reports/top-products', {
      query: topQuery,
    }),
    useApiFetch<InventoryReport>('/reports/inventory'),
    useApiFetch<LowStockReport>('/reports/low-stock', {
      query: { page, limit: 20 },
    }),
    useApiFetch<SalesSeriesReport>('/reports/sales-series', {
      query: seriesQuery,
    }),
    useApiFetch<SellersReport>('/reports/sellers', { query: periodQuery }),
    useApiFetch<PaymentMethodsReport>('/reports/payment-methods', {
      query: periodQuery,
    }),
  ])
const sources = [sales, top, inventory, low, series, sellers, methods]
const busy = computed(() => sources.some((source) => source.pending.value))
const { getApiErrorMessage } = useApiErrorMessage()
const errorText = (value: unknown) => {
  if (!value) return undefined
  const status = apiErrorStatus(value)
  if (status === 401)
    return 'Tu sesión venció. Vuelve a iniciar sesión para consultar los reportes.'
  if (status === 403)
    return 'Solo un administrador puede consultar estos reportes.'
  // Avoid showing internal proxy/SQL details when the service is unavailable.
  if (status === undefined || status >= 500)
    return 'No se pudieron consultar los datos. Intenta actualizar nuevamente en unos momentos.'
  return getApiErrorMessage(value, 'Intenta actualizar los datos.')
}
async function refreshPeriod() {
  await Promise.all([
    sales.refresh(),
    top.refresh(),
    series.refresh(),
    sellers.refresh(),
    methods.refresh(),
  ])
}
async function reload() {
  await Promise.all(sources.map((source) => source.refresh()))
}
async function apply() {
  periodError.value = ''
  try {
    const next = makePeriod(from.value, to.value, grouping.value)
    if (JSON.stringify(next) === JSON.stringify(selected.value))
      await refreshPeriod()
    else
      await router.push({
        query: {
          ...route.query,
          from: next.fromDay,
          to: next.toDay,
          group: next.group,
        },
      })
  } catch (cause) {
    periodError.value =
      cause instanceof Error ? cause.message : 'Período inválido.'
  }
}
const lineData = computed<ChartDatum[]>(() =>
  (series.data.value?.items ?? []).map((item) => ({
    key: item.date,
    label: bucketLabel(item.date, selected.value.group),
    value: moneyCents(item.adjustedTotal),
    formatted: reportNumber(item.adjustedTotal),
    detail: `${item.saleCount} ventas · ${item.date}`,
  })),
)
const topItems = computed(() => top.data.value?.items.slice(0, 10) ?? [])
const topData = computed<ChartDatum[]>(() =>
  topItems.value.map((item) => ({
    key: `${item.productId}-${item.sku}-${item.productName}`,
    label: item.productName,
    value:
      metric.value === 'AMOUNT'
        ? moneyCents(item.netTotal)
        : BigInt(item.quantity),
    formatted: reportNumber(
      metric.value === 'AMOUNT' ? item.netTotal : item.quantity,
    ),
    detail: item.sku,
    color: '#8b5cf6',
  })),
)
const sellerData = computed<ChartDatum[]>(() =>
  (sellers.data.value?.items.slice(0, 10) ?? []).map((item) => ({
    key: String(item.userId),
    label: item.sellerName,
    value: moneyCents(item.adjustedTotal),
    formatted: reportNumber(item.adjustedTotal),
    detail: `${item.saleCount} ventas`,
    color: '#06b6d4',
  })),
)
const methodLabels = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  TRANSFER: 'Transferencia',
}
const methodColors = { CASH: '#8b5cf6', CARD: '#06b6d4', TRANSFER: '#f97316' }
const methodData = computed<ChartDatum[]>(() =>
  (methods.data.value?.items ?? []).map((item) => ({
    key: item.method,
    label: methodLabels[item.method],
    value: moneyCents(item.amount),
    formatted: reportNumber(item.amount),
    color: methodColors[item.method],
  })),
)
const methodTotal = computed(() =>
  formatCents(methodData.value.reduce((sum, item) => sum + item.value, 0n)),
)
const stockData = computed<ChartDatum[]>(() =>
  inventory.data.value
    ? [
        {
          key: 'normal',
          label: 'Normal · sobre el mínimo',
          value: BigInt(inventory.data.value.available),
          formatted: reportNumber(inventory.data.value.available),
          color: '#8b5cf6',
        },
        {
          key: 'low',
          label: 'Stock bajo',
          value: BigInt(inventory.data.value.lowStock),
          formatted: reportNumber(inventory.data.value.lowStock),
          color: '#f97316',
        },
        {
          key: 'empty',
          label: 'Agotados',
          value: BigInt(inventory.data.value.outOfStock),
          formatted: reportNumber(inventory.data.value.outOfStock),
          color: '#f43f5e',
        },
      ]
    : [],
)
const lowItems = computed(() => low.data.value?.items.slice(0, 10) ?? [])
const financialCards: {
  key: keyof Omit<SalesReport, 'from' | 'to'>
  label: string
  icon: string
}[] = [
  {
    key: 'adjustedTotal',
    label: 'Ventas netas',
    icon: 'i-lucide-chart-no-axes-combined',
  },
  { key: 'saleCount', label: 'Ventas registradas', icon: 'i-lucide-receipt' },
  { key: 'balanceDue', label: 'Por cobrar', icon: 'i-lucide-wallet' },
  { key: 'refundDue', label: 'Por reembolsar', icon: 'i-lucide-rotate-ccw' },
]
const lineRows = computed(() =>
  (series.data.value?.items ?? []).map((item) => ({
    date: item.date,
    count: String(item.saleCount),
    original: reportNumber(item.originalTotal),
    net: reportNumber(item.adjustedTotal),
  })),
)
const topRows = computed(() =>
  (top.data.value?.items ?? []).map((item) => ({
    name: item.productName,
    sku: item.sku,
    units: reportNumber(item.quantity),
    amount: reportNumber(item.netTotal),
  })),
)
const sellerRows = computed(() =>
  (sellers.data.value?.items ?? []).map((item) => ({
    name: item.sellerName,
    id: String(item.userId),
    count: String(item.saleCount),
    amount: reportNumber(item.adjustedTotal),
  })),
)
const methodRows = computed(() =>
  (methods.data.value?.items ?? []).map((item) => ({
    method: methodLabels[item.method],
    count: String(item.paymentCount),
    amount: reportNumber(item.amount),
  })),
)
const stockRows = computed(() =>
  stockData.value.map((item) => ({ state: item.label, count: item.formatted })),
)
const lowRows = computed(() =>
  (low.data.value?.items ?? []).map((item) => ({
    name: item.name,
    sku: item.sku,
    physical: String(item.inventory?.quantity ?? 0),
    minimum: String(item.inventory?.minStock ?? 0),
    reserved: String(item.reservedQuantity),
    available: String(item.availableQuantity),
  })),
)
</script>

<template>
  <div class="space-y-7">
    <UBreadcrumb
      :items="[{ label: 'Inicio', to: '/' }, { label: 'Reportes' }]"
    />
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="section-eyebrow text-primary">Una mirada a tu negocio</p>
        <h1 class="mt-2 text-3xl font-extrabold tracking-tight">
          Reportes y tendencias
        </h1>
        <p class="mt-2 text-sm text-muted">
          Explora tus ventas, cobros e inventario con datos de la tienda.
        </p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="outline"
        :loading="busy"
        :disabled="busy"
        @click="reload"
        >Actualizar todo</UButton
      >
    </div>
    <UCard class="rounded-2xl"
      ><form
        class="grid gap-4 sm:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto] items-end"
        @submit.prevent="apply"
      >
        <div class="space-y-1.5">
          <label for="reports-from" class="block text-sm font-medium"
            >Desde</label
          >
          <UInput
            id="reports-from"
            v-model="from"
            type="date"
            required
            :disabled="busy"
            class="w-full"
          />
        </div>
        <div class="space-y-1.5">
          <label for="reports-to" class="block text-sm font-medium"
            >Hasta (incluido)</label
          >
          <UInput
            id="reports-to"
            v-model="to"
            type="date"
            required
            :disabled="busy"
            class="w-full"
          />
        </div>
        <div class="space-y-1.5">
          <label for="reports-group" class="block text-sm font-medium"
            >Agrupar evolución</label
          >
          <USelect
            id="reports-group"
            v-model="grouping"
            :items="[
              { label: 'Por día', value: 'DAY' },
              { label: 'Por mes', value: 'MONTH' },
            ]"
            :disabled="busy"
            class="w-full"
          />
        </div>
        <UButton
          type="submit"
          icon="i-lucide-sliders-horizontal"
          :disabled="busy"
          >Aplicar período</UButton
        >
      </form>
      <p class="mt-4 text-xs text-muted">
        Período aplicado: {{ selected.fromDay }} al {{ selected.toDay }} · Zona
        horaria: America/La_Paz · Máximo 366 días.
      </p></UCard
    >
    <UAlert
      v-if="periodError"
      role="alert"
      color="error"
      :title="periodError"
    />
    <p class="text-sm text-muted">
      Las ventas netas descuentan devoluciones y anulaciones registradas hasta
      hoy sobre las ventas creadas en el período. Los cobros del gráfico de
      métodos se filtran por su propia fecha de registro.
    </p>
    <UAlert
      v-if="sales.error.value"
      color="error"
      title="No se pudo cargar el resumen de ventas"
      :description="errorText(sales.error.value)"
      ><template #actions
        ><UButton @click="sales.refresh()">Reintentar</UButton></template
      ></UAlert
    >
    <div
      v-if="sales.pending.value"
      class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      role="status"
      aria-label="Actualizando resumen"
    >
      <USkeleton v-for="n in 4" :key="n" class="h-28 rounded-2xl" />
    </div>
    <div
      v-else-if="sales.data.value && !sales.error.value"
      class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      <UCard v-for="card in financialCards" :key="card.key" class="rounded-2xl"
        ><div class="flex items-center justify-between gap-3">
          <p class="text-sm text-muted">{{ card.label }}</p>
          <UIcon :name="card.icon" class="size-5 text-primary" />
        </div>
        <p
          class="mt-3 break-all text-2xl font-extrabold tracking-tight tabular-nums"
        >
          {{ reportNumber(sales.data.value[card.key]) }}
        </p></UCard
      >
    </div>
    <div
      v-if="sales.data.value && !sales.error.value && !sales.pending.value"
      class="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted"
    >
      <span
        >Total original:
        <strong>{{
          reportNumber(sales.data.value.originalTotal)
        }}</strong></span
      ><span
        >Cobrado de estas ventas:
        <strong>{{ reportNumber(sales.data.value.paid) }}</strong></span
      ><span
        >Reembolsado de estas ventas:
        <strong>{{ reportNumber(sales.data.value.refunded) }}</strong></span
      >
    </div>
    <ReportChart
      title="Evolución de ventas netas"
      description="Importes agrupados por la fecha de creación de la venta. Mueve el selector para consultar un punto; las devoluciones posteriores pueden cambiar esta evolución."
      icon="i-lucide-chart-line"
      :pending="series.pending.value"
      :error="errorText(series.error.value)"
      :empty="!series.data.value?.items.some((item) => item.saleCount > 0)"
      @retry="series.refresh()"
      ><ReportLineChart
        :data="lineData"
        label="Ventas netas por fecha" /><template #data
        ><ReportDataTable
          title="Evolución de ventas"
          :rows="lineRows"
          :columns="[
            { key: 'date', label: 'Fecha local' },
            { key: 'count', label: 'Ventas' },
            { key: 'original', label: 'Total original' },
            { key: 'net', label: 'Ventas netas' },
          ]" /></template
    ></ReportChart>
    <div class="grid gap-5 xl:grid-cols-2">
      <ReportChart
        title="Top 10 productos"
        description="Ranking por unidades o importe neto. Conserva los nombres y SKU históricos de las ventas."
        icon="i-lucide-package"
        :pending="top.pending.value"
        :error="errorText(top.error.value)"
        :empty="!topData.length"
        @retry="top.refresh()"
        ><template #controls
          ><div class="space-y-1.5">
            <label for="reports-metric" class="block text-sm font-medium"
              >Ordenar por</label
            >
            <USelect
              id="reports-metric"
              v-model="metric"
              :items="[
                { label: 'Unidades netas', value: 'UNITS' },
                { label: 'Importe neto', value: 'AMOUNT' },
              ]"
            /></div></template
        ><ReportBarChart
          :data="topData"
          :label="
            metric === 'AMOUNT'
              ? 'Productos por importe neto'
              : 'Productos por unidades netas'
          " /><template #data
          ><ReportDataTable
            title="Productos más vendidos · Hasta 100 resultados"
            :rows="topRows"
            :columns="[
              { key: 'name', label: 'Producto histórico' },
              { key: 'sku', label: 'SKU histórico' },
              { key: 'units', label: 'Unidades netas' },
              { key: 'amount', label: 'Importe neto' },
            ]" /></template
      ></ReportChart>
      <ReportChart
        title="Ventas por vendedor"
        description="Top 10 vendedores por ventas netas. Cada vendedor se agrupa por su ID; puedes consultar importes exactos en los datos."
        icon="i-lucide-users"
        :pending="sellers.pending.value"
        :error="errorText(sellers.error.value)"
        :empty="!sellerData.length"
        @retry="sellers.refresh()"
        ><ReportBarChart
          :data="sellerData"
          orientation="vertical"
          label="Ventas netas por vendedor" />
        <p class="text-xs text-muted">
          En pantallas pequeñas puedes desplazar el gráfico horizontalmente.
        </p>
        <template #data
          ><ReportDataTable
            title="Ventas por vendedor · Hasta 100 resultados"
            :rows="sellerRows"
            :columns="[
              { key: 'name', label: 'Vendedor histórico' },
              { key: 'id', label: 'ID' },
              { key: 'count', label: 'Ventas' },
              { key: 'amount', label: 'Ventas netas' },
            ]" /></template
      ></ReportChart>
      <ReportChart
        title="Cobros por método de pago"
        description="Importes recibidos y registrados en el período, aunque su venta sea anterior. Son cobros brutos: no descuentan reembolsos."
        icon="i-lucide-wallet"
        :pending="methods.pending.value"
        :error="errorText(methods.error.value)"
        :empty="!methodData.some((item) => item.value > 0n)"
        empty-message="No hay cobros registrados en este período."
        @retry="methods.refresh()"
        ><ReportDonutChart
          :data="methodData"
          label="Participación del efectivo, tarjeta y transferencia en los cobros"
          :formatted-total="methodTotal"
          total-label="Cobros brutos" /><template #data
          ><ReportDataTable
            title="Métodos de pago"
            :rows="methodRows"
            :columns="[
              { key: 'method', label: 'Método' },
              { key: 'count', label: 'Cobros' },
              { key: 'amount', label: 'Importe cobrado' },
            ]" /></template
      ></ReportChart>
      <ReportChart
        title="Estado del inventario físico"
        description="Productos activos con sus padres activos. Es el estado actual, independiente del período y sin descontar reservas."
        icon="i-lucide-boxes"
        :pending="inventory.pending.value"
        :error="errorText(inventory.error.value)"
        :empty="!inventory.data.value?.productCount"
        empty-message="No hay productos activos para analizar."
        @retry="inventory.refresh()"
        ><ReportDonutChart
          :data="stockData"
          label="Productos con stock normal, bajo o agotado"
          :formatted-total="String(inventory.data.value?.productCount ?? 0)"
          total-label="Productos" />
        <p class="text-xs text-muted">
          Unidades físicas totales:
          <strong>{{
            reportNumber(inventory.data.value?.quantity ?? '0')
          }}</strong
          >. Normal significa stock físico por encima del mínimo.
        </p>
        <template #data
          ><ReportDataTable
            title="Estado del inventario"
            :rows="stockRows"
            :columns="[
              { key: 'state', label: 'Estado físico' },
              { key: 'count', label: 'Productos' },
            ]" /></template
      ></ReportChart>
    </div>
    <ReportChart
      :title="`Stock frente al mínimo · Página ${page}`"
      description="Hasta 10 productos de la página actual de alertas. Las barras comparan stock físico y mínimo; las etiquetas muestran reservas vigentes y disponibilidad real."
      icon="i-lucide-triangle-alert"
      :pending="low.pending.value"
      :error="errorText(low.error.value)"
      :empty="!lowItems.length"
      empty-message="No hay productos en el mínimo o agotados en esta página."
      @retry="low.refresh()"
      ><ReportStockChart :items="lowItems" /><template #data
        ><ReportDataTable
          title="Productos en el mínimo o agotados"
          :rows="lowRows"
          :columns="[
            { key: 'name', label: 'Producto' },
            { key: 'sku', label: 'SKU' },
            { key: 'physical', label: 'Físico' },
            { key: 'minimum', label: 'Mínimo' },
            { key: 'reserved', label: 'Reservado' },
            { key: 'available', label: 'Disponible' },
          ]" /><ListPagination
          v-if="low.data.value"
          v-model="page"
          :total="low.data.value.total"
          :limit="20"
          :pending="low.pending.value" /></template
    ></ReportChart>
  </div>
</template>
