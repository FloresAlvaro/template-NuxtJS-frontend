<script setup lang="ts">
const api = useApi()
const auth = useAuth()
import type { BreadcrumbItem } from '@nuxt/ui'
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
const { input: searchInput, search } = useSearchText()
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
const photoOpen = ref(false)
const photoBusy = ref(false)
const photoProduct = ref<ProductApi | null>(null)
function openPhoto(product: ProductApi) {
  photoProduct.value = product
  photoOpen.value = true
}
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
      <div><p class="section-eyebrow text-primary">Catálogo de gestión</p><h1 class="mt-1 text-2xl font-bold">Productos</h1><p class="mt-1 text-sm text-muted">Organiza tu catálogo, sus fotos y disponibilidad.</p></div>
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
      <ProductCatalogList
        v-else-if="products?.items.length"
        :products="products.items"
        :category-name="parentName"
        :sub-category-name="subName"
        :detail-loading="detailLoading"
        @view="view"
        @inventory="openInventory"
        @photo="openPhoto"
        @edit="openForm"
        @toggle="confirmToggle"
      />
      <p v-else class="p-4 text-muted">No hay productos que coincidan con los filtros.</p>
      <ListPagination v-if="products && !error" v-model="page" :total="products.total" :limit="Number(limit)" :pending="pending" label="productos" />
    </template>

    <UModal v-model:open="photoOpen" :title="`Foto de ${photoProduct?.name ?? 'producto'}`" :dismissible="!photoBusy" :close="!photoBusy">
      <template #body><ProductImageManager v-if="photoOpen && photoProduct" :key="photoProduct.productId" :product="photoProduct" @changed="reloadProducts" @busy="photoBusy = $event" /></template>
    </UModal>
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
    <USlideover v-model:open="detailOpen" title="Detalle del producto" :ui="{ content: 'w-full max-w-lg' }">
      <template #body>
        <ProductDetail
          :product="detail"
          :loading="detailLoading"
          :error="detailError"
          :category-name="detail ? parentName(detail.subCategoryId) : ''"
          :sub-category-name="detail ? subName(detail.subCategoryId) : ''"
        />
      </template>
    </USlideover>
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
