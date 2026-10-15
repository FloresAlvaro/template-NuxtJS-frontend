<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { CashShiftApi, CashMovementApi, CashPage } from '~/types/cash'
import { cashMovementLabels } from '~/utils/cash'
const route = useRoute(),
  auth = useAuth()
const id = String(route.params.id)
if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647)
  throw createError({ statusCode: 404, statusMessage: 'Turno no encontrado' })
const { page } = usePagedSearchFilters([])
const {
  data: shift,
  error,
  refresh,
} = await useApiFetch<CashShiftApi>('/cash/shifts/' + id)
const {
  data: history,
  pending,
  error: historyError,
  refresh: refreshHistory,
} = await useApiFetch<CashPage<CashMovementApi>>(
  '/cash/shifts/' + id + '/movements',
  { query: { page, limit: 20 } },
)
const { getApiErrorMessage } = useApiErrorMessage()
async function reload() {
  await Promise.all([refresh(), refreshHistory()])
}
const columns = (
  [
    {
      accessorKey: 'kind',
      header: 'Movimiento',
      cell: ({ row }) => cashMovementLabels[row.original.kind],
    },
    {
      accessorKey: 'method',
      header: 'Método',
      cell: ({ row }) => paymentMethodLabels[row.original.method],
    },
    { accessorKey: 'amount', header: 'Importe' },
    { accessorKey: 'reason', header: 'Motivo' },
    { accessorKey: 'userName', header: 'Registrado por' },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => formatStoreDate(row.original.createdAt),
    },
    { id: 'sale', header: 'Venta' },
  ] satisfies TableColumn<CashMovementApi>[]
).map((c) => ({
  ...c,
  meta: { class: { th: 'text-center', td: 'text-center' } },
}))
</script>
<template>
  <div class="space-y-6">
    <UBreadcrumb
      :items="[
        { label: 'Inicio', to: '/' },
        { label: 'Caja y turnos', to: '/cash' },
        { label: 'Turno #' + id },
      ]"
    />
    <div class="flex flex-wrap justify-between items-center gap-3">
      <h1 class="text-2xl font-bold">Turno #{{ id }}</h1>
      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="outline"
        @click="reload"
        >Actualizar resumen</UButton
      >
    </div>
    <UAlert
      v-if="error"
      color="error"
      :title="getApiErrorMessage(error, 'No se pudo cargar el turno')"
    />
    <template v-else-if="shift"
      ><p class="text-muted">
        {{ shift.register?.name }} · {{ shift.userName }} · Inicio:
        {{ formatStoreDate(shift.openedAt) }}
      </p>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UCard
          ><p class="text-sm text-muted">Efectivo inicial</p>
          <p class="mt-2 text-xl font-bold">{{ shift.openingAmount }}</p></UCard
        ><UCard
          ><p class="text-sm text-muted">Efectivo esperado</p>
          <p class="mt-2 text-xl font-bold">
            {{ shift.expectedAmount ?? shift.summary?.expectedAmount }}
          </p></UCard
        ><UCard
          ><p class="text-sm text-muted">Tarjeta · neto</p>
          <p class="mt-2 text-xl font-bold">
            {{ shift.summary?.netPayments.CARD }}
          </p></UCard
        ><UCard
          ><p class="text-sm text-muted">Transferencia · neto</p>
          <p class="mt-2 text-xl font-bold">
            {{ shift.summary?.netPayments.TRANSFER }}
          </p></UCard
        >
      </div>
      <UAlert
        v-if="shift.closedAt"
        color="neutral"
        :title="'Turno cerrado · ' + formatStoreDate(shift.closedAt)"
        :description="
          'Contado: ' +
          shift.countedAmount +
          ' · Diferencia: ' +
          shift.difference +
          ' · ' +
          shift.closeReason
        "
      />
      <CashMovementForm
        v-else-if="shift.userId === auth.user.value?.userId"
        :shift="shift"
        @changed="reload"
      />
      <p v-else class="text-sm text-muted">
        El responsable del turno es quien registra sus movimientos y realiza el
        cierre.
      </p>
      <h2 class="text-lg font-semibold">Historial de movimientos</h2>
      <UAlert
        v-if="historyError"
        color="error"
        :title="
          getApiErrorMessage(
            historyError,
            'No se pudieron cargar los movimientos',
          )
        "
      />
      <p v-else-if="pending" role="status">Cargando movimientos...</p>
      <GenericTable
        v-else-if="history?.data.length"
        :data="history.data"
        :columns="columns"
        ><template #sale="{ row }"
          ><UButton
            v-if="row.original.saleOperation"
            color="neutral"
            variant="link"
            :to="'/sales/' + row.original.saleOperation.saleId"
            >#{{ row.original.saleOperation.saleId }}</UButton
          ><span v-else>—</span></template
        ></GenericTable
      >
      <p v-else>No hay movimientos registrados.</p>
      <ListPagination
        v-if="history && !historyError"
        v-model="page"
        :total="history.total"
        :limit="20"
        :pending="pending"
        label="movimientos"
      />
    </template>
  </div>
</template>
