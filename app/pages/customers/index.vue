<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { CustomerApi, CustomerPage } from '~/types/customer'
import { activeStatusColumn } from '~/utils/active-status-column'
const auth = useAuth()
const { getApiErrorMessage } = useApiErrorMessage()
const toast = useAppToast()
const { input, search } = useSearchText()
const page = ref(1),
  status = ref('all')
watch(
  [search, status],
  () => {
    page.value = 1
  },
  { flush: 'sync' },
)
const { data, pending, error, refresh } = await useApiFetch<CustomerPage>('/customers', {
  query: { page, search, status, limit: 20 },
})
const totalPages = computed(() => Math.max(1, Math.ceil((data.value?.total ?? 0) / 20)))
const columns: TableColumn<CustomerApi>[] = [
  { accessorKey: 'customerId', header: '#' },
  { accessorKey: 'name', header: 'Cliente' },
  { accessorKey: 'document', header: 'Documento', cell: ({ row }) => row.original.document || '—' },
  { accessorKey: 'phone', header: 'Teléfono', cell: ({ row }) => row.original.phone || '—' },
  {
    id: 'account',
    header: 'Cuenta',
    cell: ({ row }) => (row.original.userId ? 'Con cuenta' : 'Sin cuenta'),
  },
  activeStatusColumn<CustomerApi>(),
  { id: 'actions', header: 'Acciones' },
]
const open = ref(false),
  busy = ref(false),
  selected = ref<CustomerApi>()
function edit(customer?: CustomerApi) {
  selected.value = customer
  open.value = true
}
async function saved() {
  busy.value = false
  open.value = false
  toast.success('Cliente guardado')
  await refresh()
  if (!error.value && page.value > totalPages.value) page.value = totalPages.value
}
</script>
<template>
  <div class="space-y-4">
    <UBreadcrumb :items="[{ label: 'Inicio', to: '/' }, { label: 'Clientes' }]" />
    <div class="flex items-center justify-between">
      <h1 class="text-xl font-bold">Clientes</h1>
      <UButton icon="i-lucide-user-plus" @click="edit()">Nuevo cliente</UButton>
    </div>
    <div class="grid gap-3 sm:grid-cols-2">
      <UFormField label="Buscar cliente"
        ><UInput
          v-model="input"
          icon="i-lucide-search"
          placeholder="Nombre, documento o teléfono"
          :maxlength="100"
          class="w-full"
          :ui="{ base: 'h-10' }"
      /></UFormField>
      <UFormField label="Estado"
        ><select
          v-model="status"
          class="w-full h-10 rounded-md border border-default bg-default px-3"
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select></UFormField
      >
    </div>
    <UAlert
      v-if="error"
      color="error"
      :title="getApiErrorMessage(error, 'No se pudieron cargar los clientes')"
      ><template #actions
        ><UButton color="neutral" variant="outline" @click="refresh()"
          >Reintentar</UButton
        ></template
      ></UAlert
    >
    <p v-else-if="pending" role="status">Cargando clientes...</p>
    <GenericTable v-else-if="data?.items.length" :columns="columns" :data="data.items">
      <template #actions="{ row }"
        ><div class="flex gap-2">
          <UButton
            v-if="auth.isAdmin.value"
            icon="i-lucide-pencil"
            color="neutral"
            variant="soft"
            :aria-label="`Editar ${row.original.name}`"
            @click="edit(row.original)"
          /><UButton
            icon="i-lucide-receipt"
            color="neutral"
            variant="soft"
            :to="{ path: '/sales', query: { customerId: row.original.customerId } }"
            >Ventas</UButton
          >
        </div></template
      >
    </GenericTable>
    <p v-else>No hay clientes que coincidan con los filtros.</p>
    <div class="flex items-center justify-between gap-3">
      <span class="text-sm">{{ data?.total ?? 0 }} clientes · {{ page }} / {{ totalPages }}</span>
      <div class="flex gap-2">
        <UButton
          color="neutral"
          variant="outline"
          :disabled="page <= 1 || pending"
          @click="
            () => {
              page--
            }
          "
          >Anterior</UButton
        ><UButton
          color="neutral"
          variant="outline"
          :disabled="page >= totalPages || pending"
          @click="
            () => {
              page++
            }
          "
          >Siguiente</UButton
        >
      </div>
    </div>
    <UModal
      v-model:open="open"
      :title="selected ? 'Editar cliente' : 'Nuevo cliente'"
      :close="!busy"
      :dismissible="!busy"
      ><template #body
        ><CustomerForm
          v-if="open"
          :key="selected?.customerId ?? 'new'"
          :customer="selected"
          @saved="saved"
          @busy="busy = $event" /></template
    ></UModal>
  </div>
</template>
