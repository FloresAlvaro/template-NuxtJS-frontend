<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { StockAlertApi, StockAlertPage } from '~/types/stock-alert'
import type { ProductApi } from '~/types/product'
const { input, search, page, status } = usePagedSearchFilters([
  'OUT_OF_STOCK',
  'LOW_STOCK',
])
const query = computed(() => ({
  page: page.value,
  limit: 20,
  search: search.value,
  severity: status.value === 'all' ? undefined : status.value,
}))
const { data, pending, error, refresh } = await useApiFetch<StockAlertPage>(
  '/inventory/alerts',
  { query },
)
useLiveRefresh(refresh)
const { getApiErrorMessage } = useApiErrorMessage()
const api = useApi(),
  auth = useAuth()
const { pending: loadingProduct, error: productError, run } = useAsyncAction()
const product = ref<ProductApi | null>(null),
  open = ref(false),
  busy = ref(false)
async function inventory(id: number) {
  await run(async () => {
    product.value = await api<ProductApi>('/products/' + id)
    open.value = true
  }, 'No se pudo consultar el producto')
}
onBeforeRouteLeave(() => !busy.value)
const columns = (
  [
    { accessorKey: 'name', header: 'Producto' },
    { accessorKey: 'sku', header: 'SKU' },
    { accessorKey: 'category', header: 'Categoría' },
    { accessorKey: 'quantity', header: 'Físico' },
    { accessorKey: 'reservedQuantity', header: 'Reservado' },
    { accessorKey: 'availableQuantity', header: 'Disponible' },
    { accessorKey: 'minStock', header: 'Mínimo' },
    { accessorKey: 'suggestedQuantity', header: 'Reposición sugerida' },
    { id: 'severity', header: 'Alerta' },
    { id: 'actions', header: 'Acciones' },
  ] satisfies TableColumn<StockAlertApi>[]
).map((c) => ({
  ...c,
  meta: { class: { th: 'text-center', td: 'text-center' } },
}))
</script>
<template>
  <div class="space-y-6">
    <UBreadcrumb
      :items="[{ label: 'Inicio', to: '/' }, { label: 'Alertas de stock' }]"
    />
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">Alertas de stock</h1>
        <p class="mt-1 text-sm text-muted">
          Disponibilidad real después de descontar las reservas vigentes.
        </p>
      </div>
      <div class="flex gap-2">
        <UButton
          v-if="auth.isAdmin.value"
          to="/purchases/new"
          icon="i-lucide-package-plus"
          >Nueva compra</UButton
        ><UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="outline"
          :loading="pending"
          @click="refresh()"
          >Actualizar</UButton
        >
      </div>
    </div>
    <div v-if="data" class="grid gap-4 sm:grid-cols-3">
      <UCard
        ><p class="text-sm text-muted">Productos con alerta</p>
        <p class="mt-2 text-2xl font-bold">{{ data.summary.total }}</p></UCard
      ><UCard
        ><p class="text-sm text-muted">Agotados</p>
        <p class="mt-2 text-2xl font-bold">
          {{ data.summary.outOfStock }}
        </p></UCard
      ><UCard
        ><p class="text-sm text-muted">Stock bajo</p>
        <p class="mt-2 text-2xl font-bold">
          {{ data.summary.lowStock }}
        </p></UCard
      >
    </div>
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField label="Buscar producto"
        ><UInput
          v-model="input"
          id="stock-alert-search"
          icon="i-lucide-search"
          placeholder="SKU o nombre"
          :maxlength="150"
          class="w-full"
          :ui="{ base: 'h-10' }" /></UFormField
      ><UFormField label="Disponibilidad"
        ><USelect
          v-model="status"
          :items="[
            { label: 'Todas las alertas', value: 'all' },
            { label: 'Agotados', value: 'OUT_OF_STOCK' },
            { label: 'Stock bajo', value: 'LOW_STOCK' },
          ]"
          class="w-full"
          :ui="{ base: 'h-10' }"
      /></UFormField>
    </div>
    <UAlert
      v-if="error"
      color="error"
      :title="getApiErrorMessage(error, 'No se pudieron cargar las alertas')"
    />
    <UAlert v-if="productError" color="error" :title="productError" />
    <p v-if="pending" role="status">Cargando alertas...</p>
    <GenericTable
      v-else-if="!error && data?.data.length"
      :data="data.data"
      :columns="columns"
      ><template #severity="{ row }"
        ><UBadge
          :color="
            row.original.severity === 'OUT_OF_STOCK' ? 'error' : 'warning'
          "
          >{{
            row.original.severity === 'OUT_OF_STOCK' ? 'Agotado' : 'Stock bajo'
          }}</UBadge
        ></template
      ><template #actions="{ row }"
        ><UButton
          icon="i-lucide-boxes"
          color="neutral"
          variant="soft"
          :disabled="loadingProduct"
          @click="inventory(row.original.productId)"
          >Inventario</UButton
        ></template
      ></GenericTable
    >
    <p v-else-if="!error && !pending">
      No hay productos que coincidan con los filtros.
    </p>
    <ListPagination
      v-if="data && !error"
      v-model="page"
      :total="data.total"
      :limit="20"
      :pending="pending"
      label="alertas"
    />
    <p v-if="data" class="text-xs text-muted">
      Actualizado: {{ formatStoreDate(data.asOf) }}. Se revisa cada minuto. La
      reposición sugerida permite superar el mínimo; solo se muestran productos
      y categorías activos.
    </p>
    <UModal
      v-model:open="open"
      :dismissible="!busy"
      :close="busy ? false : undefined"
      :title="'Inventario · ' + (product?.name ?? '')"
      :ui="{ content: 'sm:max-w-3xl' }"
      ><template #body
        ><ProductInventory
          v-if="product"
          :product="product"
          @busy="busy = $event"
          @changed="refresh()" /></template
    ></UModal>
  </div>
</template>
