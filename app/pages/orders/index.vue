<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { OrderApi, OrderPage, OrderStatus } from '~/types/order'
const route = useRoute()
const { isStaff } = useAuth()
const page = ref(1)
const status = computed({
  get: () =>
    typeof route.query.status === 'string' &&
    route.query.status in orderStatusLabels
      ? (route.query.status as OrderStatus)
      : 'all',
  set: (value) => {
    void navigateTo({
      query: { ...route.query, status: value === 'all' ? undefined : value },
    })
  },
})
watch(
  status,
  () => {
    page.value = 1
  },
  { flush: 'sync' },
)
const query = computed(() => ({
  page: page.value,
  limit: 20,
  status: status.value === 'all' ? undefined : status.value,
}))
const { data, pending, error, refresh } = await useApiFetch<OrderPage>(
  '/orders',
  { query },
)
const { getApiErrorMessage } = useApiErrorMessage()
const columns: TableColumn<OrderApi>[] = [
  {
    accessorKey: 'orderId',
    header: 'Pedido',
    cell: ({ row }) => `#${row.original.orderId}`,
  },
  ...(isStaff.value
    ? [{ accessorKey: 'customerName', header: 'Cliente' }]
    : []),
  {
    accessorKey: 'status',
    header: 'Estado',
    cell: ({ row }) => orderStatusLabels[row.original.status],
  },
  { accessorKey: 'total', header: 'Total' },
  {
    accessorKey: 'createdAt',
    header: 'Fecha',
    cell: ({ row }) => formatStoreDate(row.original.createdAt),
  },
  { id: 'actions', header: 'Acciones' },
]
</script>
<template>
  <div class="space-y-4">
    <UBreadcrumb
      :items="[
        { label: 'Inicio', to: '/' },
        { label: isStaff ? 'Pedidos' : 'Mis pedidos' },
      ]"
    />
    <div class="flex flex-wrap justify-between gap-3">
      <h1 class="text-xl font-bold">
        {{ isStaff ? 'Gestión de pedidos' : 'Mis pedidos' }}
      </h1>
      <UButton v-if="!isStaff" to="/shop">Ver catálogo</UButton>
    </div>
    <UFormField label="Estado del pedido"
      ><USelect
        v-model="status"
        :items="[
          { label: 'Todos', value: 'all' },
          ...Object.entries(orderStatusLabels).map(([value, label]) => ({
            value,
            label,
          })),
        ]"
        class="w-full sm:w-80"
    /></UFormField>
    <UButton
      variant="outline"
      color="neutral"
      :disabled="pending"
      icon="i-lucide-refresh-cw"
      @click="refresh()"
      >Actualizar</UButton
    >
    <UAlert
      v-if="error"
      color="error"
      :title="getApiErrorMessage(error, 'No se pudieron consultar los pedidos')"
    />
    <p v-else-if="pending" role="status">Cargando pedidos...</p>
    <GenericTable
      v-else-if="data?.items.length"
      :data="data.items"
      :columns="columns"
      ><template #actions="{ row }"
        ><UButton
          :to="`/orders/${row.original.orderId}`"
          icon="i-lucide-eye"
          color="neutral"
          variant="soft"
          >Ver</UButton
        ></template
      ></GenericTable
    >
    <p v-else>No hay pedidos que coincidan con el estado seleccionado.</p>
    <ListPagination
      v-if="data && !error"
      v-model="page"
      :total="data.total"
      :limit="20"
      :pending="pending"
    />
  </div>
</template>
