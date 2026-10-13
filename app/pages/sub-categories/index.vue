<script setup lang="ts">
import { activeStatusColumn } from '~/utils/active-status-column'
const api = useApi()
const auth = useAuth()
import type { BreadcrumbItem, TableColumn } from '@nuxt/ui'
import type { CategoryApi } from '~/types/category'
import type { SubCategoryApi } from '~/types/sub-category'

const route = useRoute()
const router = useRouter()
const toast = useAppToast()
const { getApiErrorMessage } = useApiErrorMessage()
const search = ref('')
const categoryId = computed(() => {
  const value = route.query.categoryId
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return undefined
  const id = Number(value)
  return id <= 2147483647 ? id : undefined
})
const status = computed(() => {
  const value = route.query.status
  return value === 'active' || value === 'inactive' ? value : 'all'
})
const invalidFilter = computed(
  () =>
    (route.query.categoryId !== undefined && categoryId.value === undefined) ||
    (route.query.status !== undefined &&
      !['active', 'inactive', 'all'].includes(String(route.query.status))),
)
const {
  data: categories,
  error: categoryError,
  refresh: refreshCategories,
} = await useApiFetch<CategoryApi[]>('/categories', {
  key: 'subcategory-categories',
})
const query = computed(() => ({
  categoryId: categoryId.value,
  status: status.value,
}))
const {
  data: subcategories,
  pending,
  error,
  refresh,
} = await useApiFetch<SubCategoryApi[]>('/sub-categories', {
  query,
})
const categoryName = (id: number) =>
  categories.value?.find((category) => category.categoryId === id)?.name ?? `Categoría #${id}`
const selectedCategory = computed(() =>
  categories.value?.find((category) => category.categoryId === categoryId.value),
)
const breadcrumbs = computed<BreadcrumbItem[]>(() => [
  { label: 'Inicio', icon: 'i-lucide-house', to: '/' },
  { label: 'Categorías', icon: 'i-lucide-folder', to: '/categories' },
  {
    label: selectedCategory.value
      ? `Subcategorías de ${selectedCategory.value.name}`
      : 'Subcategorías',
    icon: 'i-lucide-list-tree',
  },
])
const activeCategories = computed(
  () => categories.value?.filter((category) => category.isActive) ?? [],
)
const filtered = computed(() =>
  (subcategories.value ?? []).filter((sub) =>
    `${sub.name} ${sub.description ?? ''} ${categoryName(sub.categoryId)}`
      .toLocaleLowerCase()
      .includes(search.value.trim().toLocaleLowerCase()),
  ),
)
const columns: TableColumn<SubCategoryApi>[] = [
  { accessorKey: 'name', header: 'Subcategoría' },
  {
    accessorKey: 'categoryId',
    header: 'Categoría',
    cell: ({ row }) => categoryName(row.original.categoryId),
  },
  {
    accessorKey: 'description',
    header: 'Descripción',
    cell: ({ row }) => row.original.description || '—',
  },
  activeStatusColumn<SubCategoryApi>(true),
  { id: 'actions', header: 'Acciones' },
]
function setFilter(field: 'categoryId' | 'status', event: Event) {
  const value = (event.target as HTMLSelectElement).value
  const next = { ...route.query, [field]: value || undefined }
  void router.push({ path: '/sub-categories', query: next })
}

const formOpen = ref(false)
const editing = ref<SubCategoryApi | null>(null)
const { pending: saving, error: formError, run: runSave } = useAsyncAction()
const form = reactive({ name: '', description: '', categoryId: '' })
const validForm = computed(
  () =>
    form.name.trim().length >= 3 &&
    form.name.trim().length <= 100 &&
    form.description.trim().length <= 500 &&
    !!form.categoryId,
)
const formCategories = computed(() =>
  (categories.value ?? []).filter(
    (category) => category.isActive || category.categoryId === editing.value?.categoryId,
  ),
)
function openForm(sub?: SubCategoryApi) {
  editing.value = sub ?? null
  form.name = sub?.name ?? ''
  form.description = sub?.description ?? ''
  form.categoryId = sub
    ? String(sub.categoryId)
    : selectedCategory.value?.isActive
      ? String(selectedCategory.value.categoryId)
      : ''
  formError.value = ''
  formOpen.value = true
}
async function save() {
  if (saving.value || !validForm.value) return
  await runSave(async () => {
    const id = Number(form.categoryId)
    // Do not send an unchanged parent: editing an inactive child's description
    // should not be treated as a move into its inactive category.
    const body = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      ...(!editing.value || id !== editing.value.categoryId ? { categoryId: id } : {}),
    }
    await api(
      editing.value ? `/sub-categories/${editing.value.subCategoryId}` : '/sub-categories',
      {
        method: editing.value ? 'PATCH' : 'POST',
        body,
      },
    )
    toast.success(editing.value ? 'Subcategoría actualizada' : 'Subcategoría creada')
    formOpen.value = false
    await refresh()
  }, 'No se pudo guardar la subcategoría')
}

const {
  open: toggleOpen,
  selected: toggling,
  pending: changingStatus,
  error: toggleError,
  confirm: confirmToggle,
  submit: toggleStatus,
} = useCatalogStatus<SubCategoryApi>({
  resource: 'sub-categories',
  id: (item) => item.subCategoryId,
  messages: {
    active: 'Subcategoría activada',
    inactive: 'Subcategoría desactivada',
    error: 'No se pudo cambiar el estado',
  },
  refresh: refresh,
})
async function retry() {
  await Promise.all([refreshCategories(), refresh()])
}
</script>

<template>
  <div class="space-y-4">
    <UBreadcrumb :items="breadcrumbs" />
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="text-xl font-bold">Subcategorías</h1>
      </div>
      <UButton
        v-if="auth.isAdmin.value"
        icon="i-lucide-plus"
        :disabled="!activeCategories.length || !!categoryError || invalidFilter"
        @click="openForm()"
        >Nueva subcategoría</UButton
      >
    </div>

    <div class="grid gap-3 sm:grid-cols-3">
      <UFormField label="Categoría" name="category-filter">
        <select
          id="category-filter"
          aria-label="Categoría"
          :value="categoryId ?? ''"
          class="subcategory-select h-10 w-full rounded-md border border-default bg-default px-3 text-sm"
          @change="setFilter('categoryId', $event)"
        >
          <option value="">Todas las categorías</option>
          <option
            v-for="category in categories"
            :key="category.categoryId"
            :value="category.categoryId"
          >
            {{ category.name }}{{ category.isActive ? '' : ' (inactiva)' }}
          </option>
        </select>
      </UFormField>
      <UFormField label="Estado" name="status-filter">
        <select
          id="status-filter"
          aria-label="Estado"
          :value="status"
          class="subcategory-select h-10 w-full rounded-md border border-default bg-default px-3 text-sm"
          @change="setFilter('status', $event)"
        >
          <option value="all">Todos</option>
          <option value="active">Activas</option>
          <option value="inactive">Inactivas</option>
        </select>
      </UFormField>
      <UFormField label="Buscar">
        <UInput
          v-model="search"
          placeholder="Nombre, descripción o categoría"
          icon="i-lucide-search"
          class="w-full"
          :ui="{ base: 'h-10' }"
        />
      </UFormField>
    </div>
    <UButton
      v-if="route.query.categoryId || route.query.status"
      to="/sub-categories"
      color="neutral"
      variant="link"
      >Quitar filtros</UButton
    >
    <UAlert
      v-if="invalidFilter"
      color="error"
      title="El filtro de la URL no es válido. Quita los filtros para continuar."
    />
    <UAlert
      v-else-if="error || categoryError"
      color="error"
      title="No se pudieron cargar los datos"
      :description="getApiErrorMessage(error || categoryError, 'Intenta nuevamente')"
    >
      <template #actions
        ><UButton color="neutral" variant="outline" @click="retry">Reintentar</UButton></template
      >
    </UAlert>
    <template v-else>
      <UAlert
        v-if="!activeCategories.length"
        color="warning"
        title="Crea o activa una categoría para agregar subcategorías."
      />
      <UAlert
        v-else-if="selectedCategory && !selectedCategory.isActive"
        color="warning"
        title="Esta categoría está inactiva. Para crear aquí, primero actívala; también puedes elegir otra categoría activa en el formulario."
      />
      <p v-if="pending" role="status" class="p-4 text-muted">Cargando subcategorías...</p>
      <GenericTable v-else-if="filtered.length" :data="filtered" :columns="columns">
        <template #actions="{ row }">
          <div class="flex gap-2">
            <UButton
              v-if="auth.isAdmin.value"
              icon="i-lucide-pencil"
              color="neutral"
              variant="soft"
              :aria-label="`Editar ${row.original.name}`"
              @click="openForm(row.original)"
            />
            <UButton
              v-if="auth.isAdmin.value"
              :icon="row.original.isActive ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :color="row.original.isActive ? 'warning' : 'success'"
              variant="soft"
              :aria-label="`${row.original.isActive ? 'Desactivar' : 'Activar'} ${row.original.name}`"
              @click="confirmToggle(row.original)"
            />
          </div>
        </template>
      </GenericTable>
      <p v-else class="p-4 text-muted">No hay subcategorías que coincidan con los filtros.</p>
    </template>

    <UModal
      v-model:open="formOpen"
      :title="editing ? 'Editar subcategoría' : 'Nueva subcategoría'"
      :dismissible="!saving"
    >
      <template #body>
        <form class="space-y-4" @submit.prevent="save">
          <UAlert v-if="formError" color="error" :title="formError" />
          <UFormField label="Nombre" required
            ><UInput
              v-model="form.name"
              required
              :minlength="3"
              :maxlength="100"
              :disabled="saving"
              class="w-full"
          /></UFormField>
          <label class="block space-y-1 text-sm">
            <span class="block font-medium">Categoría *</span>
            <select
              v-model="form.categoryId"
              required
              :disabled="saving"
              class="subcategory-select h-10 w-full rounded-md border border-default bg-default px-3 text-sm"
            >
              <option value="" disabled>Selecciona una categoría activa</option>
              <option
                v-for="category in formCategories"
                :key="category.categoryId"
                :value="String(category.categoryId)"
              >
                {{ category.name }}{{ category.isActive ? '' : ' (inactiva, categoría actual)' }}
              </option>
            </select>
          </label>
          <UFormField label="Descripción"
            ><UTextarea
              v-model="form.description"
              :maxlength="500"
              :disabled="saving"
              class="w-full"
          /></UFormField>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="saving"
              @click="
                () => {
                  formOpen = false
                }
              "
              >Cancelar</UButton
            >
            <UButton type="submit" :loading="saving" :disabled="!validForm || saving"
              >Guardar</UButton
            >
          </div>
        </form>
      </template>
    </UModal>
    <UModal
      v-model:open="toggleOpen"
      :title="toggling?.isActive ? 'Desactivar subcategoría' : 'Activar subcategoría'"
      :dismissible="!changingStatus"
    >
      <template #body>
        <div class="space-y-4">
          <UAlert v-if="toggleError" color="error" :title="toggleError" />
          <p>¿Deseas {{ toggling?.isActive ? 'desactivar' : 'activar' }} «{{ toggling?.name }}»?</p>
          <p class="text-sm text-muted">
            {{
              toggling?.isActive
                ? 'Primero debes mover o desactivar sus productos activos.'
                : 'La categoría a la que pertenece debe estar activa.'
            }}
          </p>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="changingStatus"
              @click="
                () => {
                  toggleOpen = false
                }
              "
              >Cancelar</UButton
            >
            <UButton
              :color="toggling?.isActive ? 'warning' : 'success'"
              :loading="changingStatus"
              :disabled="changingStatus"
              @click="toggleStatus"
              >Confirmar</UButton
            >
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.subcategory-select {
  appearance: none;
  padding-right: 2.5rem;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1rem;
}
</style>
