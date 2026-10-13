<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { SaleApi, SaleItemApi } from '~/types/sale'
const route = useRoute()
const { getApiErrorMessage } = useApiErrorMessage()
const { data, pending, error, refresh } = await useApiFetch<SaleApi>(
  `/sales/${String(route.params.id)}`,
)
const columns: TableColumn<SaleItemApi>[] = [
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'productName', header: 'Producto' },
  { accessorKey: 'quantity', header: 'Cantidad vendida' },
  { accessorKey: 'returnedQuantity', header: 'Cantidad repuesta' },
  { accessorKey: 'unitPrice', header: 'Precio aplicado' },
  { accessorKey: 'subtotal', header: 'Subtotal' },
]
</script>
<template>
  <div class="space-y-4">
    <UBreadcrumb
      :items="[
        { label: 'Inicio', to: '/' },
        { label: 'Ventas', to: '/sales' },
        { label: `Venta #${route.params.id}` },
      ]"
    />
    <p v-if="pending" role="status">Cargando venta...</p>
    <UAlert
      v-else-if="error"
      color="error"
      :title="getApiErrorMessage(error, 'No se pudo consultar la venta')"
      ><template #actions
        ><UButton color="neutral" variant="outline" @click="refresh()"
          >Reintentar</UButton
        ></template
      ></UAlert
    >
    <template v-else-if="data">
      <h1 class="text-xl font-bold">Venta #{{ data.saleId }}</h1>
      <dl class="grid sm:grid-cols-2 gap-2 text-sm">
        <dt class="font-semibold">Cliente</dt>
        <dd>{{ data.customerName }}</dd>
        <dt class="font-semibold">Documento</dt>
        <dd>{{ data.customerDocument || '—' }}</dd>
        <dt class="font-semibold">Vendedor</dt>
        <dd>{{ data.sellerName }}</dd>
        <dt class="font-semibold">Fecha</dt>
        <dd>
          {{
            new Date(data.createdAt).toLocaleString('es-BO', {
              timeZone: 'America/La_Paz',
            })
          }}
        </dd>
      </dl>
      <GenericTable :data="data.items" :columns="columns" />
      <div class="grid sm:grid-cols-3 gap-3">
        <UCard
          ><p>Estado</p>
          <strong>{{ saleStatusLabels[data.status] }}</strong></UCard
        >
        <UCard
          ><p>Total original / vigente</p>
          <strong>{{ data.total }} / {{ data.adjustedTotal }}</strong></UCard
        >
        <UCard
          ><p>Cobrado / reembolsado</p>
          <strong>{{ data.paid }} / {{ data.refunded }}</strong></UCard
        >
        <UCard
          ><p>Saldo por cobrar</p>
          <strong>{{ data.balanceDue }}</strong></UCard
        >
        <UCard
          ><p>Pendiente de reembolso</p>
          <strong>{{ data.refundDue }}</strong></UCard
        >
      </div>
      <SaleOperations :sale="data" @updated="data = $event" />
      <UButton color="neutral" variant="outline" to="/sales"
        >Volver a ventas</UButton
      >
    </template>
  </div>
</template>
