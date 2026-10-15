<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { AuditEntryApi, AuditPage } from '~/types/audit'
import {
  auditEntityLabels,
  auditActionLabels,
  auditChanges,
  auditValue,
  auditFieldLabels,
} from '~/utils/audit'
const route = useRoute(),
  router = useRouter()
const { page, status } = usePagedSearchFilters(Object.keys(auditEntityLabels))
function numberFilter(key: string) {
  return computed({
    get: () =>
      typeof route.query[key] === 'string' &&
      /^[1-9]\d*$/.test(route.query[key]) &&
      Number(route.query[key]) <= 2147483647
        ? route.query[key]
        : '',
    set: (value: string) => {
      void router.replace({
        query: {
          ...route.query,
          [key]:
            /^[1-9]\d*$/.test(value) && Number(value) <= 2147483647
              ? value
              : undefined,
          page: undefined,
        },
      })
    },
  })
}
const entityId = numberFilter('entityId'),
  actorId = numberFilter('actorId')
const query = computed(() => ({
  page: page.value,
  limit: 20,
  entity: status.value === 'all' ? undefined : status.value,
  entityId: entityId.value || undefined,
  actorId: actorId.value || undefined,
}))
const { data, pending, error, refresh } = await useApiFetch<AuditPage>(
  '/audit',
  { query },
)
const { getApiErrorMessage } = useApiErrorMessage()
const selected = ref<AuditEntryApi | null>(null),
  open = ref(false)
function view(entry: AuditEntryApi) {
  selected.value = entry
  open.value = true
}
const columns = (
  [
    { accessorKey: 'auditId', header: '#' },
    {
      accessorKey: 'createdAt',
      header: 'Fecha',
      cell: ({ row }) => formatStoreDate(row.original.createdAt),
    },
    { accessorKey: 'actorName', header: 'Responsable' },
    {
      accessorKey: 'entity',
      header: 'Entidad',
      cell: ({ row }) =>
        (auditEntityLabels[row.original.entity] ?? row.original.entity) +
        ' #' +
        row.original.entityId,
    },
    {
      accessorKey: 'action',
      header: 'Acción',
      cell: ({ row }) => auditActionLabels[row.original.action],
    },
    { id: 'changes', header: 'Cambios' },
  ] satisfies TableColumn<AuditEntryApi>[]
).map((c) => ({
  ...c,
  meta: { class: { th: 'text-center', td: 'text-center' } },
}))
</script>
<template>
  <div class="space-y-6">
    <UBreadcrumb
      :items="[{ label: 'Inicio', to: '/' }, { label: 'Auditoría' }]"
    /><WorkspaceHeader
      eyebrow="Gestión de tienda"
      title="Auditoría administrativa"
      icon="i-lucide-history"
      description="Consulta quién modificó el catálogo, los precios, costos, permisos y promociones."
      ><template #actions
        ><UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
          @click="refresh()"
          >Actualizar</UButton
        ></template
      ></WorkspaceHeader
    >
    <div class="grid gap-4 sm:grid-cols-3">
      <UFormField label="Entidad"
        ><USelect
          id="audit-entity"
          v-model="status"
          :items="[
            { label: 'Todas', value: 'all' },
            ...Object.entries(auditEntityLabels).map(([value, label]) => ({
              value,
              label,
            })),
          ]"
          class="w-full" /></UFormField
      ><UFormField label="ID del registro"
        ><UInput
          id="audit-entity-id"
          v-model="entityId"
          inputmode="numeric"
          placeholder="Todos"
          class="w-full" /></UFormField
      ><UFormField label="ID del responsable"
        ><UInput
          id="audit-actor-id"
          v-model="actorId"
          inputmode="numeric"
          placeholder="Todos"
          class="w-full"
      /></UFormField>
    </div>
    <UAlert
      v-if="error"
      color="error"
      :title="getApiErrorMessage(error, 'No se pudo cargar la auditoría')"
    />
    <p v-else-if="pending" role="status">Cargando historial...</p>
    <GenericTable
      v-else-if="data?.items.length"
      :data="data.items"
      :columns="columns"
      ><template #changes="{ row }"
        ><UButton
          icon="i-lucide-eye"
          color="neutral"
          variant="soft"
          @click="view(row.original)"
          >Ver {{ auditChanges(row.original).length }} cambios</UButton
        ></template
      ></GenericTable
    >
    <p v-else>No hay registros que coincidan con los filtros.</p>
    <ListPagination
      v-if="data && !error"
      v-model="page"
      :total="data.total"
      :limit="20"
      :pending="pending"
      label="registros"
    />
    <p class="text-sm text-muted">
      Historial desde la instalación de esta función. Los procesos sin sesión se
      identifican como Proceso del sistema. No se guardan contraseñas ni tokens.
    </p>
    <UModal
      v-model:open="open"
      :title="'Cambios del registro #' + selected?.auditId"
      :ui="{ content: 'sm:max-w-3xl' }"
      ><template #body
        ><div v-if="selected" class="space-y-4">
          <p>
            {{ selected.actorName }} · ID {{ selected.actorId ?? 'Sistema' }} ·
            {{ formatStoreDate(selected.createdAt) }}
          </p>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr>
                  <th class="p-3 text-left">Campo</th>
                  <th class="p-3 text-left">Valor anterior</th>
                  <th class="p-3 text-left">Valor nuevo</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="change in auditChanges(selected)"
                  :key="change.field"
                  class="border-t border-default"
                >
                  <td class="p-3 font-medium">
                    {{ auditFieldLabels[change.field] ?? change.field }}
                  </td>
                  <td class="p-3 whitespace-pre-wrap break-all">
                    {{ auditValue(change.before, change.field) }}
                  </td>
                  <td class="p-3 whitespace-pre-wrap break-all">
                    {{ auditValue(change.after, change.field) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div></template
      ></UModal
    >
  </div>
</template>
