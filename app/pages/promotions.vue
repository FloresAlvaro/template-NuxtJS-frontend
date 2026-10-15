<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { PromotionApi, PromotionPage } from '~/types/promotion'
const auth = useAuth()
const { input, search, page } = usePagedSearchFilters([])
const { data, pending, error, refresh } = await useApiFetch<PromotionPage>(
  '/promotions',
  { query: { search, page, limit: 20 } },
)
const { getApiErrorMessage } = useApiErrorMessage()
const open = ref(false),
  busy = ref(false),
  selected = ref<PromotionApi | null>(null)
function edit(promotion: PromotionApi | null) {
  selected.value = promotion
  open.value = true
}
async function saved() {
  open.value = false
  await refresh()
}
onBeforeRouteLeave(() => !busy.value)
const columns = (
  [
    { accessorKey: 'code', header: 'Código' },
    { accessorKey: 'name', header: 'Promoción' },
    {
      accessorKey: 'percentBps',
      header: 'Descuento',
      cell: ({ row }) => row.original.percentBps / 100 + '%',
    },
    { accessorKey: 'minSubtotal', header: 'Mínimo' },
    {
      accessorKey: 'startsAt',
      header: 'Inicio',
      cell: ({ row }) => formatStoreDate(row.original.startsAt),
    },
    {
      accessorKey: 'endsAt',
      header: 'Fin',
      cell: ({ row }) => formatStoreDate(row.original.endsAt),
    },
    { id: 'state', header: 'Estado' },
    {
      accessorKey: 'allowSeller',
      header: 'Vendedores',
      cell: ({ row }) =>
        row.original.allowSeller ? 'Permitido' : 'Solo ADMIN',
    },
    { id: 'actions', header: 'Acciones' },
  ] satisfies TableColumn<PromotionApi>[]
).map((c) => ({
  ...c,
  meta: { class: { th: 'text-center', td: 'text-center' } },
}))
</script>
<template>
  <div class="space-y-6">
    <UBreadcrumb
      :items="[{ label: 'Inicio', to: '/' }, { label: 'Promociones' }]"
    /><WorkspaceHeader
      eyebrow="Gestión de tienda"
      title="Descuentos y promociones"
      icon="i-lucide-tags"
      description="Configura vigencias y permisos. Las ventas conservan el descuento que se aplicó."
      ><template #actions
        ><UButton
          v-if="auth.isAdmin.value"
          icon="i-lucide-plus"
          @click="edit(null)"
          >Nueva promoción</UButton
        ></template
      ></WorkspaceHeader
    >
    <UFormField label="Buscar promoción"
      ><UInput
        id="promotions-search"
        v-model="input"
        :maxlength="150"
        placeholder="Nombre o código"
        icon="i-lucide-search"
        class="w-full"
    /></UFormField>
    <UAlert
      v-if="error"
      color="error"
      :title="
        getApiErrorMessage(error, 'No se pudieron cargar las promociones')
      "
      ><template #actions
        ><UButton color="neutral" variant="outline" @click="refresh()"
          >Reintentar</UButton
        ></template
      ></UAlert
    >
    <p v-else-if="pending" role="status">Cargando promociones...</p>
    <GenericTable
      v-else-if="data?.items.length"
      :data="data.items"
      :columns="columns"
      ><template #state="{ row }"
        ><UBadge
          :color="row.original.isActive ? 'success' : 'neutral'"
          variant="subtle"
          >{{ row.original.isActive ? 'Activa' : 'Inactiva' }}</UBadge
        ></template
      ><template #actions="{ row }"
        ><UButton
          v-if="auth.isAdmin.value"
          icon="i-lucide-pencil"
          color="neutral"
          variant="soft"
          @click="edit(row.original)"
          >Editar</UButton
        ><span v-else>—</span></template
      ></GenericTable
    >
    <p v-else>No hay promociones que coincidan con la búsqueda.</p>
    <ListPagination
      v-if="data && !error"
      v-model="page"
      :total="data.total"
      :limit="20"
      :pending="pending"
      label="promociones"
    />
    <p class="text-sm text-muted">
      El estado activo no reemplaza las fechas de vigencia. Los vendedores solo
      ven promociones vigentes que tienen permiso para aplicar.
    </p>
    <UModal
      v-model:open="open"
      :title="selected ? 'Editar promoción' : 'Nueva promoción'"
      :dismissible="!busy"
      :close="busy ? false : undefined"
      :ui="{ content: 'sm:max-w-2xl' }"
      ><template #body
        ><PromotionForm
          v-if="open"
          :promotion="selected"
          @saved="saved"
          @busy="busy = $event" /></template
    ></UModal>
  </div>
</template>
