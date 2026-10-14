<script setup lang="ts">
import { activeStatusColumn } from '~/utils/active-status-column'
const api = useApi()
const auth = useAuth()
import type { BreadcrumbItem, TableColumn } from '@nuxt/ui'
import type { CategoryApi } from '~/types/category'
import type { SubCategoryApi } from '~/types/sub-category'
import type { ProductApi, ProductPage } from '~/types/product'

const toast = useAppToast()
const { getApiErrorMessage } = useApiErrorMessage()
const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Inicio', icon: 'i-lucide-house', to: '/' },
  { label: 'Productos', icon: 'i-lucide-package' },
]
const page = ref(1)
const limit = ref('20')
const status = ref('all')
const availability = ref('all')
const subFilter = ref('')
const searchInput = ref('')
const search = ref('')
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(searchInput, (value) => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { search.value = value.trim() }, 300)
})
onBeforeUnmount(() => clearTimeout(searchTimer))
const query = computed(() => ({
  page: page.value,
  limit: Number(limit.value),
  status: status.value,
  availability: availability.value,
  search: search.value || undefined,
  subCategoryId: subFilter.value ? Number(subFilter.value) : undefined,
}))
watch(
  [limit, status, subFilter, search, availability],
  () => {
    page.value = 1
  },
  { flush: 'sync' },
)
const {
  data: categories,
  error: categoryError,
  refresh: refreshCategories,
} = await useApiFetch<CategoryApi[]>('/categories', {
  key: 'product-categories',
})
const {
  data: subcategories,
  error: subError,
  refresh: refreshSubs,
} = await useApiFetch<SubCategoryApi[]>('/sub-categories', {
  key: 'product-subcategories',
})
const {
  data: products,
  pending,
  error,
  refresh,
} = await useApiFetch<ProductPage>('/products', { query })
const categoryName = (id: number) =>
  categories.value?.find((c) => c.categoryId === id)?.name ?? `Categoría #${id}`
const subName = (id: number) =>
  subcategories.value?.find((s) => s.subCategoryId === id)?.name ?? `Subcategoría #${id}`
const parentName = (id: number) => {
  const sub = subcategories.value?.find((s) => s.subCategoryId === id)
  return sub ? categoryName(sub.categoryId) : '—'
}
const totalPages = computed(() =>
  Math.max(1, Math.ceil((products.value?.total ?? 0) / Number(limit.value))),
)
const parentError = computed(() => categoryError.value || subError.value)
const activeSubs = computed(() =>
  (subcategories.value ?? []).filter(
    (s) => s.isActive && categories.value?.some((c) => c.categoryId === s.categoryId && c.isActive),
  ),
)
const productColumns: TableColumn<ProductApi>[] = [
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'name', header: 'Producto' },
  {
    id: 'category',
    header: 'Categoría',
    cell: ({ row }) => parentName(row.original.subCategoryId),
  },
  {
    accessorKey: 'subCategoryId',
    header: 'Subcategoría',
    cell: ({ row }) => subName(row.original.subCategoryId),
  },
  ...(auth.isAdmin.value ? [{ accessorKey: 'cost', header: 'Costo' }] : []),
  { accessorKey: 'salePrice', header: 'Precio de venta' },
  { accessorKey: 'quantity', header: 'Stock físico' },
  { accessorKey: 'reservedQuantity', header: 'Reservado' },
  { accessorKey: 'availableQuantity', header: 'Disponible para venta' },
  { id: 'stock', header: 'Estado físico' },
  activeStatusColumn<ProductApi>(false),
  { id: 'actions', header: 'Acciones' },
]
const columns: TableColumn<ProductApi>[] = productColumns.map((column) => ({
  ...column,
  meta: {
    ...column.meta,
    class: { ...column.meta?.class, th: 'text-center', td: 'text-center' },
  },
}))

const formOpen = ref(false)
const editing = ref<ProductApi | null>(null)
const { pending: saving, error: formError, run: runSave } = useAsyncAction()
const form = reactive({
  name: '',
  sku: '',
  barcode: '',
  description: '',
  categoryId: '',
  subCategoryId: '',
  cost: '',
  salePrice: '',
})
const money = /^(0|[1-9]\d{0,15})(\.\d{1,2})?$/
const validForm = computed(
  () =>
    form.name.trim().length >= 3 &&
    form.name.trim().length <= 150 &&
    /^[A-Z0-9][A-Z0-9._-]{0,63}$/.test(form.sku.trim().toUpperCase()) &&
    (!form.barcode.trim() || /^[A-Za-z0-9-]{1,64}$/.test(form.barcode.trim())) &&
    form.description.trim().length <= 1000 &&
    !!form.categoryId &&
    !!form.subCategoryId &&
    money.test(form.cost.trim()) &&
    money.test(form.salePrice.trim()),
)
const formCategories = computed(() =>
  (categories.value ?? []).filter(
    (c) =>
      c.isActive ||
      c.categoryId ===
        subcategories.value?.find((s) => s.subCategoryId === editing.value?.subCategoryId)
          ?.categoryId,
  ),
)
const formSubs = computed(() =>
  (subcategories.value ?? []).filter(
    (s) =>
      String(s.categoryId) === form.categoryId &&
      (activeSubs.value.some((a) => a.subCategoryId === s.subCategoryId) ||
        s.subCategoryId === editing.value?.subCategoryId),
  ),
)
function changeCategory() {
  form.subCategoryId = ''
}
function openForm(product?: ProductApi) {
  editing.value = product ?? null
  const sub = subcategories.value?.find(
    (s) => s.subCategoryId === (product?.subCategoryId ?? Number(subFilter.value)),
  )
  const canUseSub = product || activeSubs.value.some((s) => s.subCategoryId === sub?.subCategoryId)
  Object.assign(form, {
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    barcode: product?.barcode ?? '',
    description: product?.description ?? '',
    categoryId: sub && canUseSub ? String(sub.categoryId) : '',
    subCategoryId: sub && canUseSub ? String(sub.subCategoryId) : '',
    cost: product?.cost ?? '',
    salePrice: product?.salePrice ?? '',
  })
  formError.value = ''
  formOpen.value = true
}
async function reloadProducts() {
  await refresh()
  if (!error.value && page.value > totalPages.value) page.value = totalPages.value
}
async function save() {
  if (!validForm.value || saving.value) return
  await runSave(async () => {
    const id = Number(form.subCategoryId)
    await api(editing.value ? `/products/${editing.value.productId}` : '/products', {
      method: editing.value ? 'PATCH' : 'POST',
      body: {
        name: form.name.trim(),
        sku: form.sku.trim().toUpperCase(),
        barcode: form.barcode.trim() || null,
        description: form.description.trim() || null,
        cost: form.cost.trim(),
        salePrice: form.salePrice.trim(),
        ...(!editing.value || editing.value.subCategoryId !== id ? { subCategoryId: id } : {}),
      },
    })
    toast.success(editing.value ? 'Producto actualizado' : 'Producto creado')
    formOpen.value = false
    await reloadProducts()
  }, 'No se pudo guardar el producto')
}
const {
  open: toggleOpen,
  selected: toggling,
  pending: changing,
  error: toggleError,
  confirm: confirmToggle,
  submit: toggleStatus,
} = useCatalogStatus<ProductApi>({
  resource: 'products',
  id: (item) => item.productId,
  messages: {
    active: 'Producto activado',
    inactive: 'Producto desactivado',
    error: 'No se pudo cambiar el estado del producto',
  },
  refresh: reloadProducts,
})
const detailOpen = ref(false)
const inventoryOpen = ref(false)
const inventorySaving = ref(false)
const inventoryProduct = ref<ProductApi | null>(null)
function openInventory(product: ProductApi) {
  inventoryProduct.value = product
  inventoryOpen.value = true
}
const detail = ref<ProductApi | null>(null)
const detailLoading = ref(false)
const detailError = ref('')
async function view(product: ProductApi) {
  detail.value = null
  detailError.value = ''
  detailOpen.value = true
  detailLoading.value = true
  try {
    detail.value = await api<ProductApi>(`/products/${product.productId}`, {})
  } catch (err) {
    detailError.value = getApiErrorMessage(err, 'No se pudo consultar el producto')
  } finally {
    detailLoading.value = false
  }
}
async function retry() {
  await Promise.all([refreshCategories(), refreshSubs(), refresh()])
}
</script>

<template>
  <div class="space-y-4">
    <UBreadcrumb :items="breadcrumbs" />
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-xl font-bold">Productos</h1>
      <UButton
        v-if="auth.isAdmin.value"
        icon="i-lucide-plus"
        :disabled="!activeSubs.length || !!parentError"
        @click="openForm()"
        >Nuevo producto</UButton
      >
    </div>
    <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <UFormField label="Buscar producto">
        <UInput v-model="searchInput" icon="i-lucide-search" placeholder="SKU o nombre del producto" :maxlength="150" class="w-full" :ui="{ base: 'h-10' }" aria-label="Buscar por SKU o nombre del producto" />
      </UFormField>
      <label class="space-y-1 text-sm"
        ><span class="block font-medium">Subcategoría</span>
        <select v-model="subFilter" class="product-select">
          <option value="">Todas las subcategorías</option>
          <option
            v-for="sub in subcategories"
            :key="sub.subCategoryId"
            :value="String(sub.subCategoryId)"
          >
            {{ categoryName(sub.categoryId) }} / {{ sub.name
            }}{{ sub.isActive ? '' : ' (inactiva)' }}
          </option>
        </select>
      </label>
      <label class="space-y-1 text-sm"
        ><span class="block font-medium">Estado</span>
        <select v-model="status" class="product-select">
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </label>
      <label class="space-y-1 text-sm">
        <span class="block font-medium">Estado del stock físico</span>
        <select v-model="availability" class="product-select">
          <option value="all">Todas</option>
          <option value="AVAILABLE">Disponible</option>
          <option value="LOW_STOCK">Stock bajo</option>
          <option value="OUT_OF_STOCK">Agotado</option>
        </select>
      </label>
      <label class="space-y-1 text-sm"
        ><span class="block font-medium">Productos por página</span>
        <select v-model="limit" class="product-select">
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </label>
    </div>
    <UAlert
      v-if="error || parentError"
      color="error"
      title="No se pudieron cargar los productos o su clasificación"
      :description="getApiErrorMessage(error || parentError, 'Intenta nuevamente')"
    >
      <template #actions
        ><UButton color="neutral" variant="outline" @click="retry">Reintentar</UButton></template
      >
    </UAlert>
    <template v-else>
      <UAlert
        v-if="!activeSubs.length"
        color="warning"
        title="Necesitas una categoría y una subcategoría activas para crear productos."
      >
        <template #actions
          ><UButton to="/sub-categories" color="neutral" variant="outline"
            >Ver subcategorías</UButton
          ></template
        >
      </UAlert>
      <p v-if="pending" role="status" class="p-4 text-muted">Cargando productos...</p>
      <GenericTable v-else-if="products?.items.length" :data="products.items" :columns="columns">
        <template #stock="{ row }">
          <UBadge
            :color="
              row.original.quantity === 0
                ? 'error'
                : row.original.quantity <= row.original.minStock
                  ? 'warning'
                  : 'success'
            "
          >
            {{
              row.original.quantity === 0
                ? 'Agotado'
                : row.original.quantity <= row.original.minStock
                  ? 'Stock bajo'
                  : 'Disponible'
            }}
          </UBadge>
        </template>
        <template #actions="{ row }"
          ><div class="flex items-center justify-center gap-2">
            <UButton
              icon="i-lucide-boxes"
              color="neutral"
              variant="soft"
              :aria-label="`Inventario de ${row.original.name}`"
              @click="openInventory(row.original)"
              >Inventario</UButton
            >
            <UButton
              icon="i-lucide-eye"
              color="neutral"
              variant="soft"
              :aria-label="`Ver ${row.original.name}`"
              :disabled="detailLoading"
              @click="view(row.original)"
            />
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
              :icon="row.original.isActive ? 'i-lucide-eye-off' : 'i-lucide-check'"
              :color="row.original.isActive ? 'warning' : 'success'"
              variant="soft"
              :aria-label="`${row.original.isActive ? 'Desactivar' : 'Activar'} ${row.original.name}`"
              @click="confirmToggle(row.original)"
            /></div
        ></template>
      </GenericTable>
      <p v-else class="p-4 text-muted">No hay productos que coincidan con los filtros.</p>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-muted">
          {{ products?.total ?? 0 }} productos · Página {{ page }} de
          {{ totalPages }}
        </p>
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
    </template>

    <UModal
      v-model:open="formOpen"
      :title="editing ? 'Editar producto' : 'Nuevo producto'"
      :dismissible="!saving"
      :close="!saving"
    >
      <template #body>
        <form class="space-y-4" @submit.prevent="save">
          <UAlert v-if="formError" color="error" :title="formError" />
          <UFormField label="Nombre" required
            ><UInput
              v-model="form.name"
              required
              :minlength="3"
              :maxlength="150"
              :disabled="saving"
              class="w-full"
          /></UFormField>
          <div class="grid gap-3 sm:grid-cols-2">
            <UFormField
              label="SKU"
              required
              help="Único; letras, números, puntos, guiones o guiones bajos."
              ><UInput
                v-model="form.sku"
                required
                :maxlength="64"
                :disabled="saving"
                class="w-full"
            /></UFormField>
            <UFormField label="Código de barras"
              ><UInput v-model="form.barcode" :maxlength="64" :disabled="saving" class="w-full"
            /></UFormField>
            <label class="space-y-1 text-sm"
              ><span class="block font-medium">Categoría *</span
              ><select
                v-model="form.categoryId"
                required
                :disabled="saving"
                class="product-select"
                @change="changeCategory"
              >
                <option value="" disabled>Selecciona una categoría</option>
                <option
                  v-for="category in formCategories"
                  :key="category.categoryId"
                  :value="String(category.categoryId)"
                >
                  {{ category.name }}{{ category.isActive ? '' : ' (inactiva)' }}
                </option>
              </select></label
            >
            <label class="space-y-1 text-sm"
              ><span class="block font-medium">Subcategoría *</span
              ><select
                v-model="form.subCategoryId"
                required
                :disabled="saving || !form.categoryId"
                class="product-select"
              >
                <option value="" disabled>Selecciona una subcategoría</option>
                <option
                  v-for="sub in formSubs"
                  :key="sub.subCategoryId"
                  :value="String(sub.subCategoryId)"
                >
                  {{ sub.name }}{{ sub.isActive ? '' : ' (inactiva)' }}
                </option>
              </select></label
            >
            <UFormField label="Costo" required help="Ejemplo: 80.00"
              ><UInput
                v-model="form.cost"
                inputmode="decimal"
                placeholder="0.00"
                required
                :disabled="saving"
                class="w-full"
            /></UFormField>
            <UFormField
              label="Precio de venta"
              required
              help="Hasta dos decimales, separados por punto."
              ><UInput
                v-model="form.salePrice"
                inputmode="decimal"
                placeholder="0.00"
                required
                :disabled="saving"
                class="w-full"
            /></UFormField>
          </div>
          <p v-if="form.categoryId && !formSubs.length" class="text-sm text-warning">
            Esta categoría no tiene subcategorías activas. Crea o activa una subcategoría.
          </p>
          <UFormField label="Descripción"
            ><UTextarea
              v-model="form.description"
              :maxlength="1000"
              :disabled="saving"
              class="w-full"
          /></UFormField>
          <div class="flex justify-end gap-2">
            <UButton
              type="button"
              color="neutral"
              variant="ghost"
              :disabled="saving"
              @click="
                () => {
                  formOpen = false
                }
              "
              >Cancelar</UButton
            ><UButton type="submit" :disabled="!validForm || saving" :loading="saving"
              >Guardar</UButton
            >
          </div>
        </form>
      </template>
    </UModal>
    <UModal
      v-model:open="toggleOpen"
      :title="toggling?.isActive ? 'Desactivar producto' : 'Activar producto'"
      :dismissible="!changing"
      :close="!changing"
    >
      <template #body
        ><div class="space-y-4">
          <UAlert v-if="toggleError" color="error" :title="toggleError" />
          <p>¿Deseas {{ toggling?.isActive ? 'desactivar' : 'activar' }} «{{ toggling?.name }}»?</p>
          <p class="text-sm text-muted">
            {{
              toggling?.isActive
                ? 'El producto se conservará y podrás reactivarlo después.'
                : 'Su categoría y subcategoría deben estar activas.'
            }}
          </p>
          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="changing"
              @click="
                () => {
                  toggleOpen = false
                }
              "
              >Cancelar</UButton
            ><UButton
              :color="toggling?.isActive ? 'warning' : 'success'"
              :loading="changing"
              :disabled="changing"
              @click="toggleStatus"
              >Confirmar</UButton
            >
          </div>
        </div></template
      >
    </UModal>
    <UModal v-model:open="detailOpen" title="Detalle del producto">
      <template #body>
        <p v-if="detailLoading" role="status">Cargando producto...</p>
        <UAlert v-else-if="detailError" color="error" :title="detailError" />
        <dl v-else-if="detail" class="grid grid-cols-2 gap-3 text-sm">
          <dt class="font-medium">Nombre</dt>
          <dd class="break-words">{{ detail.name }}</dd>
          <dt class="font-medium">SKU</dt>
          <dd class="break-all">{{ detail.sku }}</dd>
          <dt class="font-medium">Código de barras</dt>
          <dd class="break-all">{{ detail.barcode || '—' }}</dd>
          <dt class="font-medium">Categoría</dt>
          <dd>{{ parentName(detail.subCategoryId) }}</dd>
          <dt class="font-medium">Subcategoría</dt>
          <dd>{{ subName(detail.subCategoryId) }}</dd>
          <template v-if="auth.isAdmin.value"
            ><dt class="font-medium">Costo</dt>
            <dd>{{ detail.cost }}</dd></template
          >
          <dt class="font-medium">Precio de venta</dt>
          <dd>{{ detail.salePrice }}</dd>
          <dt class="font-medium">Stock físico</dt>
          <dd>{{ detail.quantity }}</dd>
          <dt class="font-medium">Reservado</dt><dd>{{ detail.reservedQuantity }}</dd>
          <dt class="font-medium">Disponible para venta</dt><dd>{{ detail.availableQuantity }}</dd>
          <dt class="font-medium">Stock mínimo</dt>
          <dd>{{ detail.minStock }}</dd>
          <dt class="font-medium">Estado</dt>
          <dd>{{ detail.isActive ? 'Activo' : 'Inactivo' }}</dd>
          <dt class="font-medium">Descripción</dt>
          <dd class="whitespace-pre-wrap break-words">
            {{ detail.description || '—' }}
          </dd>
        </dl>
      </template>
    </UModal>
    <UModal
      v-model:open="inventoryOpen"
      title="Inventario del producto"
      :dismissible="!inventorySaving"
      :close="!inventorySaving"
      :ui="{ content: 'sm:max-w-2xl' }"
    >
      <template #body>
        <ProductInventory
          v-if="inventoryOpen && inventoryProduct"
          :key="inventoryProduct.productId"
          :product="inventoryProduct"
          @changed="reloadProducts"
          @busy="inventorySaving = $event"
        />
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.product-select {
  width: 100%;
  height: 2.5rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  background-color: var(--ui-bg);
  padding: 0 2.5rem 0 0.75rem;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
}
</style>
