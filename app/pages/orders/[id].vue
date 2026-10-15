<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { OrderApi } from '~/types/order'
const route = useRoute()
const listLocation = computed(() => ({
  path: '/orders',
  query: { page: route.query.page, status: route.query.status },
}))
const { isStaff } = useAuth()
const { data, pending, error, refresh } = await useApiFetch<OrderApi>(
  () => `/orders/${String(route.params.id)}`,
)
const { getApiErrorMessage } = useApiErrorMessage()
const columns: TableColumn<OrderApi['items'][number]>[] = [
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'productName', header: 'Producto' },
  { accessorKey: 'quantity', header: 'Cantidad' },
  { accessorKey: 'unitPrice', header: 'Precio aplicado' },
  { accessorKey: 'subtotal', header: 'Subtotal' },
]
const auditColumns: TableColumn<NonNullable<OrderApi['operations']>[number]>[] =
  [
    {
      accessorKey: 'kind',
      header: 'Operación',
      cell: ({ row }) =>
        orderOperationLabels[row.original.kind] ?? row.original.kind,
    },
    { accessorKey: 'userName', header: 'Registrada por' },
    { accessorKey: 'reason', header: 'Motivo' },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => formatStoreDate(row.original.createdAt),
    },
  ]
</script>
<template>
  <div class="space-y-4">
    <UBreadcrumb
      :items="[
        { label: 'Inicio', to: '/' },
        { label: isStaff ? 'Pedidos' : 'Mis pedidos', to: listLocation },
        { label: `Pedido #${route.params.id}` },
      ]"
    />
    <UButton
      color="neutral"
      variant="outline"
      :disabled="pending"
      @click="refresh()"
      >Actualizar pedido</UButton
    >
    <UAlert
      v-if="error"
      color="error"
      :title="getApiErrorMessage(error, 'No se pudo consultar el pedido')"
    />
    <p v-if="pending" role="status">Cargando pedido...</p>
    <template v-if="data">
      <h1 class="text-xl font-bold">Pedido #{{ data.orderId }}</h1>
      <p class="font-semibold">
        {{ orderStatusLabels[data.status] }} · Retiro en tienda
      </p>
      <dl class="grid sm:grid-cols-2 gap-2 text-sm">
        <dt>Cliente</dt>
        <dd>{{ data.customerName }}</dd>
        <dt>Fecha</dt>
        <dd>{{ formatStoreDate(data.createdAt) }}</dd>
        <dt v-if="data.status === 'PENDING'">Reserva hasta</dt>
        <dd v-if="data.status === 'PENDING'">
          {{ formatStoreDate(data.expiresAt) }}
        </dd>
      </dl>
      <UAlert
        v-if="data.status === 'PENDING'"
        color="info"
        title="Reserva pendiente de confirmación"
        description="El personal debe confirmar el pedido antes del vencimiento. La reserva todavía no es un cobro."
      />
      <UAlert
        v-if="data.status === 'EXPIRED'"
        color="warning"
        title="La reserva venció"
        description="Los productos vuelven a estar disponibles. Puedes crear otro pedido desde el catálogo."
      />
      <GenericTable :data="data.items" :columns="columns" />
      <p class="text-lg font-semibold">Total original: {{ data.total }}</p>
      <UCard v-if="data.sale"
        ><div class="space-y-2">
          <p>Total vigente: {{ data.sale.adjustedTotal }}</p>
          <p>
            Cobrado: {{ data.sale.paid }} · Por cobrar:
            {{ data.sale.balanceDue }}
          </p>
          <p>
            Reembolsado: {{ data.sale.refunded }} · Por reembolsar:
            {{ data.sale.refundDue }}
          </p>
          <UButton
            v-if="isStaff"
            :to="`/sales/${data.sale.saleId}`"
            icon="i-lucide-receipt"
            >Ver venta y registrar cobro</UButton
          >
        </div></UCard
      >
      <OrderActions
        :key="data.orderId"
        :order="data"
        @updated="data = $event"
        @refresh="refresh()"
      />
      <template v-if="isStaff && data.operations?.length"
        ><h2 class="font-semibold">Historial del pedido</h2>
        <GenericTable :data="data.operations" :columns="auditColumns"
      /></template>
      <UButton :to="listLocation" color="neutral" variant="outline"
        >Volver a pedidos</UButton
      >
    </template>
  </div>
</template>
