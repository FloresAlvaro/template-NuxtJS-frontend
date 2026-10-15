<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { PurchaseApi, PurchaseLineApi } from '~/types/purchase'
const route = useRoute()
const id = String(route.params.id)
if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647)
  throw createError({ statusCode: 404, statusMessage: 'Compra no encontrada' })
const { data, pending, error, refresh } = await useApiFetch<PurchaseApi>(
  `/purchases/${id}`,
)
const { getApiErrorMessage } = useApiErrorMessage()
const columns = (
  [
    { accessorKey: 'productName', header: 'Producto' },
    { accessorKey: 'sku', header: 'SKU' },
    { accessorKey: 'quantity', header: 'Cantidad' },
    { accessorKey: 'unitCost', header: 'Costo unitario' },
    { accessorKey: 'subtotal', header: 'Subtotal' },
  ] satisfies TableColumn<PurchaseLineApi>[]
).map((column) => ({
  ...column,
  meta: { class: { th: 'text-center', td: 'text-center' } },
}))
</script>
<template>
  <div class="space-y-4">
    <UBreadcrumb
      :items="[
        { label: 'Inicio', to: '/' },
        { label: 'Compras', to: '/purchases' },
        { label: `Compra #${id}` },
      ]"
    />
    <UAlert
      v-if="error"
      color="error"
      :title="getApiErrorMessage(error, 'No se pudo cargar la compra')"
      ><template #actions
        ><UButton color="neutral" variant="outline" @click="refresh()"
          >Reintentar</UButton
        ></template
      ></UAlert
    >
    <p v-else-if="pending" role="status">Cargando compra...</p>
    <template v-else-if="data">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h1 class="text-2xl font-bold">Compra #{{ data.purchaseId }}</h1>
        <PurchaseStatusBadge :status="data.status" />
      </div>
      <dl
        class="grid gap-4 rounded-2xl border border-default p-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <div>
          <dt class="text-sm text-muted">Proveedor</dt>
          <dd class="break-words font-semibold">{{ data.supplierName }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Documento</dt>
          <dd>{{ data.supplierDocument || '—' }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Registrada por</dt>
          <dd>{{ data.userName }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Referencia</dt>
          <dd class="break-words">{{ data.reference || '—' }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Fecha de registro</dt>
          <dd>{{ formatStoreDate(data.createdAt) }}</dd>
        </div>
        <div>
          <dt class="text-sm text-muted">Total de compra</dt>
          <dd class="font-bold">{{ data.total }}</dd>
        </div>
        <div v-if="data.receivedAt">
          <dt class="text-sm text-muted">Recibida</dt>
          <dd>{{ formatStoreDate(data.receivedAt) }}</dd>
        </div>
        <div v-if="data.cancelledAt">
          <dt class="text-sm text-muted">Cancelada</dt>
          <dd>{{ formatStoreDate(data.cancelledAt) }}</dd>
        </div>
        <div v-if="data.notes" class="sm:col-span-2">
          <dt class="text-sm text-muted">Notas</dt>
          <dd class="whitespace-pre-wrap break-words">{{ data.notes }}</dd>
        </div>
      </dl>
      <GenericTable :data="data.items" :columns="columns" />
      <PurchaseActions :purchase="data" @updated="refresh()" />
      <section v-if="data.operations.length" class="space-y-3">
        <h2 class="font-semibold">Historial de operaciones</h2>
        <ul class="space-y-2">
          <li
            v-for="operation in data.operations"
            :key="operation.operationId"
            class="rounded-xl border border-default p-4"
          >
            <p class="font-semibold">
              {{
                operation.kind === 'RECEIVE'
                  ? 'Recepción completa'
                  : 'Cancelación'
              }}
              · {{ operation.userName }}
            </p>
            <p class="text-sm text-muted">
              {{ formatStoreDate(operation.createdAt) }}
            </p>
            <p class="mt-2 whitespace-pre-wrap break-words">
              {{ operation.reason }}
            </p>
            <p
              v-if="operation.kind === 'RECEIVE'"
              class="mt-1 text-sm text-muted"
            >
              {{
                operation.updateCost
                  ? 'Se actualizaron los costos de los productos.'
                  : 'Se conservaron los costos de los productos.'
              }}
            </p>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
