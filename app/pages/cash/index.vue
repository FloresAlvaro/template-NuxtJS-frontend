<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { CashRegisterApi, CashShiftApi, CashPage } from '~/types/cash'
const auth = useAuth()
const { page, status } = usePagedSearchFilters(['OPEN', 'CLOSED'])
const query = computed(() => ({
  page: page.value,
  limit: 20,
  status: status.value === 'all' ? undefined : status.value,
}))
const {
  data: registers,
  error: registerError,
  refresh: refreshRegisters,
} = await useApiFetch<CashRegisterApi[]>('/cash/registers')
const {
  data: current,
  error: currentError,
  refresh: refreshCurrent,
} = await useApiFetch<CashShiftApi | null>('/cash/shifts/current')
const { data, pending, error, refresh } = await useApiFetch<
  CashPage<CashShiftApi>
>('/cash/shifts', { query })
const { getApiErrorMessage } = useApiErrorMessage()
onMounted(() => {
  watch(
    current,
    (shift) => {
      if (!shift) return
      // A server-confirmed opening resolves a lost response after reloading.
      try {
        const key = 'cash-open-' + auth.user.value?.userId
        const saved = sessionStorage.getItem(key)
        if (!saved) return
        const value: unknown = JSON.parse(saved)
        if (
          value &&
          typeof value === 'object' &&
          'body' in value &&
          value.body &&
          typeof value.body === 'object' &&
          'requestId' in value.body &&
          value.body.requestId === shift.requestId
        )
          sessionStorage.removeItem(key)
      } catch {
        /* In-memory retries still work without browser storage. */
      }
    },
    { immediate: true },
  )
})
async function opened(shift: CashShiftApi) {
  await navigateTo('/cash/' + shift.shiftId)
}
async function reload() {
  await Promise.all([refresh(), refreshCurrent(), refreshRegisters()])
}
const columns = (
  [
    { accessorKey: 'shiftId', header: 'Turno' },
    {
      id: 'register',
      header: 'Caja',
      cell: ({ row }) =>
        row.original.register?.name ?? 'Caja #' + row.original.registerId,
    },
    { accessorKey: 'userName', header: 'Responsable' },
    { accessorKey: 'openingAmount', header: 'Apertura' },
    {
      accessorKey: 'openedAt',
      header: 'Inicio',
      cell: ({ row }) => formatStoreDate(row.original.openedAt),
    },
    { id: 'state', header: 'Estado' },
    {
      accessorKey: 'difference',
      header: 'Diferencia',
      cell: ({ row }) => row.original.difference ?? '—',
    },
    { id: 'actions', header: 'Acciones' },
  ] satisfies TableColumn<CashShiftApi>[]
).map((c) => ({
  ...c,
  meta: { class: { th: 'text-center', td: 'text-center' } },
}))
</script>
<template>
  <div class="space-y-6">
    <UBreadcrumb
      :items="[{ label: 'Inicio', to: '/' }, { label: 'Caja y turnos' }]"
    />
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold">Caja y turnos</h1>
        <p class="mt-1 text-sm text-muted">
          Apertura, movimientos de efectivo y arqueo al finalizar la jornada.
        </p>
      </div>
      <UButton
        icon="i-lucide-refresh-cw"
        color="neutral"
        variant="outline"
        @click="reload"
        >Actualizar</UButton
      >
    </div>
    <UAlert
      v-if="registerError || currentError"
      color="error"
      :title="
        getApiErrorMessage(
          registerError || currentError,
          'No se pudo consultar la caja actual',
        )
      "
    />
    <UAlert
      v-else-if="current"
      color="success"
      :title="'Tu turno #' + current.shiftId + ' está abierto'"
      :description="'Efectivo esperado: ' + current.summary?.expectedAmount"
      ><template #actions
        ><UButton :to="'/cash/' + current.shiftId"
          >Ver mi turno</UButton
        ></template
      ></UAlert
    >
    <CashShiftForm
      v-else-if="registers?.some((r) => r.isActive)"
      :registers="registers"
      @opened="opened"
    />
    <p v-else-if="!registerError">
      No hay cajas activas. Solicita a un administrador que habilite una.
    </p>
    <CashRegisterManager
      v-if="auth.isAdmin.value && registers"
      :registers="registers"
      @changed="refreshRegisters()"
    />
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-lg font-semibold">
        {{ auth.isAdmin.value ? 'Historial de turnos' : 'Mis turnos' }}
      </h2>
      <UFormField label="Estado"
        ><USelect
          v-model="status"
          :items="[
            { label: 'Todos', value: 'all' },
            { label: 'Abiertos', value: 'OPEN' },
            { label: 'Cerrados', value: 'CLOSED' },
          ]"
      /></UFormField>
    </div>
    <UAlert
      v-if="error"
      color="error"
      :title="getApiErrorMessage(error, 'No se pudieron cargar los turnos')"
    />
    <p v-else-if="pending" role="status">Cargando turnos...</p>
    <GenericTable
      v-else-if="data?.data.length"
      :data="data.data"
      :columns="columns"
      ><template #state="{ row }"
        ><UBadge
          :color="row.original.closedAt ? 'neutral' : 'success'"
          variant="subtle"
          >{{ row.original.closedAt ? 'Cerrado' : 'Abierto' }}</UBadge
        ></template
      ><template #actions="{ row }"
        ><UButton
          icon="i-lucide-eye"
          color="neutral"
          variant="soft"
          :to="'/cash/' + row.original.shiftId"
          >Ver</UButton
        ></template
      ></GenericTable
    >
    <p v-else>No hay turnos que coincidan con el filtro.</p>
    <ListPagination
      v-if="data && !error"
      v-model="page"
      :total="data.total"
      :limit="20"
      :pending="pending"
      label="turnos"
    />
  </div>
</template>
