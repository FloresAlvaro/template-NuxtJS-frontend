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
  {accessorKey:'listUnitPrice',header:'Precio de lista'},
  {accessorKey:'unitDiscount',header:'Descuento / unidad'},
  { accessorKey: 'unitPrice', header: 'Precio aplicado' },
  { accessorKey: 'subtotal', header: 'Subtotal' },
]
</script>
<template>
  <div class="space-y-6">
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
      <WorkspaceHeader eyebrow="Detalle de venta" :title="`Venta #${data.saleId}`" icon="i-lucide-receipt" description="Consulta los productos vendidos, el saldo actual y el historial de esta operación.">
        <template #actions><UButton to="/sales" color="neutral" variant="outline" icon="i-lucide-arrow-left" :ui="{ base: 'bg-transparent text-white ring-white/30 hover:bg-white/10' }">Volver a ventas</UButton></template>
      </WorkspaceHeader>
      <div class="grid gap-4 sm:grid-cols-3">
        <UCard><p class="text-sm text-muted">Total vigente</p><p class="mt-2 break-all text-3xl font-extrabold tabular-nums text-primary">{{ data.adjustedTotal }}</p><p class="mt-2 text-xs text-muted">Original: {{ data.total }}</p></UCard>
        <UCard><p class="text-sm text-muted">Por cobrar</p><p class="mt-2 break-all text-3xl font-extrabold tabular-nums">{{ data.balanceDue }}</p><p class="mt-2 text-xs text-muted">Cobrado: {{ data.paid }}</p></UCard>
        <UCard><p class="text-sm text-muted">Por reembolsar</p><p class="mt-2 break-all text-3xl font-extrabold tabular-nums" :class="data.refundDue !== '0.00' ? 'text-warning' : ''">{{ data.refundDue }}</p><p class="mt-2 text-xs text-muted">Reembolsado: {{ data.refunded }}</p></UCard>
      </div>
      <UCard>
        <template #header><div class="flex flex-wrap items-center justify-between gap-3"><h2 class="font-semibold">Información de la venta</h2><SaleStatusBadge :status="data.status" /></div></template>
        <dl class="grid gap-5 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><dt class="text-muted">Cliente</dt><dd class="mt-1 font-semibold">{{ data.customerName }}</dd></div>
          <div><dt class="text-muted">Documento</dt><dd class="mt-1 font-semibold">{{ data.customerDocument || 'Sin documento' }}</dd></div>
          <div><dt class="text-muted">Vendedor</dt><dd class="mt-1 font-semibold">{{ data.sellerName }}</dd></div>
          <div><dt class="text-muted">Fecha</dt><dd class="mt-1 font-semibold">{{ formatStoreDate(data.createdAt) }}</dd></div>
        </dl>
      </UCard>
      <section class="space-y-3"><div><h2 class="text-lg font-bold">Productos vendidos</h2><p class="mt-1 text-sm text-muted">Precios originales y cantidades repuestas por devolución o anulación.</p></div><GenericTable :data="data.items" :columns="columns" /></section>
      <UAlert v-if="data.promotionSnapshot" color="neutral" variant="subtle" icon="i-lucide-tag" :title="'Promoción aplicada: '+data.promotionSnapshot.code" :description="data.promotionSnapshot.name+' · Versión '+data.promotionSnapshot.version+' · Subtotal: '+data.grossTotal+' · Descuento: '+data.discountTotal+'. Las devoluciones utilizan el precio final aplicado.'" />
      <SaleOperations :sale="data" @updated="data = $event" />
      <UButton color="neutral" variant="outline" to="/sales"
        >Volver a ventas</UButton
      >
    </template>
  </div>
</template>
