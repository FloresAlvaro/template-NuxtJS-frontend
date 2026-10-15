<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { SupplierApi, SupplierPage } from '~/types/supplier'
import { activeStatusColumn } from '~/utils/active-status-column'
const { input, search, page, status } = usePagedSearchFilters([
  'active',
  'inactive',
])
const { data, pending, error, refresh } = await useApiFetch<SupplierPage>(
  '/suppliers',
  { query: { search, page, status, limit: 20 } },
)
const { getApiErrorMessage } = useApiErrorMessage()
const toast = useAppToast()
const columns = (
  [
    { accessorKey: 'name', header: 'Proveedor' },
    { accessorKey: 'document', header: 'Documento' },
    { accessorKey: 'contactName', header: 'Contacto' },
    { accessorKey: 'phone', header: 'Teléfono' },
    { accessorKey: 'email', header: 'Correo' },
    activeStatusColumn<SupplierApi>(),
    { id: 'actions', header: 'Acciones' },
  ] satisfies TableColumn<SupplierApi>[]
).map((column) => ({
  ...column,
  meta: { class: { th: 'text-center', td: 'text-center' } },
}))
const open = ref(false),
  busy = ref(false),
  selected = ref<SupplierApi>()
function edit(supplier?: SupplierApi) {
  selected.value = supplier
  open.value = true
}
async function saved() {
  open.value = false
  busy.value = false
  toast.success('Proveedor guardado')
  await refresh()
}
</script>
<template>
  <div class="space-y-4">
    <UBreadcrumb
      :items="[{ label: 'Inicio', to: '/' }, { label: 'Proveedores' }]"
    />
    <div class="flex flex-wrap justify-between gap-3">
      <h1 class="text-2xl font-bold">Proveedores</h1>
      <UButton icon="i-lucide-plus" @click="edit()">Nuevo proveedor</UButton>
    </div>
    <div class="grid gap-3 sm:grid-cols-2">
      <UFormField label="Buscar proveedor"
        ><UInput
          v-model="input"
          icon="i-lucide-search"
          placeholder="Nombre, documento, contacto, correo o teléfono"
          :maxlength="150"
          class="w-full"
          :ui="{ base: 'h-10' }"
      /></UFormField>
      <UFormField label="Estado"
        ><USelect
          v-model="status"
          :items="[
            { label: 'Todos', value: 'all' },
            { label: 'Activos', value: 'active' },
            { label: 'Inactivos', value: 'inactive' },
          ]"
          class="w-full"
          :ui="{ base: 'h-10' }"
      /></UFormField>
    </div>
    <UAlert
      v-if="error"
      color="error"
      :title="
        getApiErrorMessage(error, 'No se pudieron cargar los proveedores')
      "
      ><template #actions
        ><UButton color="neutral" variant="outline" @click="refresh()"
          >Reintentar</UButton
        ></template
      ></UAlert
    >
    <p v-else-if="pending" role="status">Cargando proveedores...</p>
    <GenericTable
      v-else-if="data?.items.length"
      :data="data.items"
      :columns="columns"
    >
      <template #actions="{ row }"
        ><div class="flex justify-center gap-2">
          <UButton
            icon="i-lucide-pencil"
            color="neutral"
            variant="soft"
            :aria-label="`Editar ${row.original.name}`"
            @click="edit(row.original)"
          /><UButton
            icon="i-lucide-package-plus"
            color="neutral"
            variant="soft"
            :to="{
              path: '/purchases',
              query: { supplierId: row.original.supplierId },
            }"
            >Compras</UButton
          >
        </div></template
      >
    </GenericTable>
    <p v-else>No hay proveedores que coincidan con los filtros.</p>
    <ListPagination
      v-if="data && !error"
      v-model="page"
      :total="data.total"
      :limit="20"
      :pending="pending"
      label="proveedores"
    />
    <UModal
      v-model:open="open"
      :title="selected ? 'Editar proveedor' : 'Nuevo proveedor'"
      :close="!busy"
      :dismissible="!busy"
      ><template #body
        ><SupplierForm
          v-if="open"
          :key="selected?.supplierId ?? 'new'"
          :supplier="selected"
          @saved="saved"
          @busy="busy = $event" /></template
    ></UModal>
  </div>
</template>
