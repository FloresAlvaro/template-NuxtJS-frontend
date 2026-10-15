<script setup lang="ts">
import type { SupplierApi, SupplierPage } from '~/types/supplier'
import type { ProductApi, ProductPage } from '~/types/product'
import type { CreatePurchaseBody, PurchaseApi } from '~/types/purchase'
import { moneyCents, formatCents } from '~/utils/money'
const { user } = useAuth()
const toast = useAppToast()
const { getApiErrorMessage } = useApiErrorMessage()
const supplier = ref<SupplierApi | null>(null)
const { input: supplierInput, search: supplierSearch } = useSearchText()
const { input: productInput, search: productSearch } = useSearchText()
const supplierPage = ref(1),
  productPage = ref(1)
watch(
  supplierSearch,
  () => {
    supplierPage.value = 1
  },
  { flush: 'sync' },
)
watch(
  productSearch,
  () => {
    productPage.value = 1
  },
  { flush: 'sync' },
)
const {
  data: suppliers,
  pending: supplierPending,
  error: supplierError,
  refresh: refreshSuppliers,
} = await useApiFetch<SupplierPage>('/suppliers', {
  query: {
    page: supplierPage,
    search: supplierSearch,
    status: 'active',
    limit: 10,
  },
})
const {
  data: products,
  pending: productPending,
  error: productError,
  refresh: refreshProducts,
} = await useApiFetch<ProductPage>('/products', {
  query: {
    page: productPage,
    search: productSearch,
    status: 'active',
    limit: 10,
  },
})
type CartLine = { product: ProductApi; quantity: string; unitCost: string }
const cart = ref<CartLine[]>([]),
  reference = ref(''),
  notes = ref('')
const createdId = ref<number | null>(null)
const request = useIdempotentRequest<CreatePurchaseBody>(
  `purchase-create-${user.value?.userId}`,
  /^\/purchases$/,
)
const { locked: requestLocked, pending, error, submission } = request
const locked = computed(() => requestLocked.value || createdId.value !== null)
const validLine = (line: CartLine) =>
  /^[1-9]\d*$/.test(line.quantity) &&
  Number(line.quantity) <= 2147483647 &&
  /^(0|[1-9]\d{0,15})(\.\d{1,2})?$/.test(line.unitCost)
const subtotal = (line: CartLine) =>
  validLine(line) ? moneyCents(line.unitCost) * BigInt(line.quantity) : 0n
const total = computed(() =>
  cart.value.reduce((sum, line) => sum + subtotal(line), 0n),
)
const valid = computed(
  () =>
    supplier.value?.isActive &&
    cart.value.length > 0 &&
    cart.value.length <= 100 &&
    cart.value.every(validLine) &&
    total.value <= 999999999999999999n,
)
function selectSupplier(value: SupplierApi | null) {
  supplier.value = value
}
function removeLine(index: number) {
  cart.value.splice(index, 1)
}
function add(product: ProductApi) {
  if (
    locked.value ||
    cart.value.some((line) => line.product.productId === product.productId) ||
    cart.value.length >= 100
  )
    return
  cart.value.push({ product, quantity: '1', unitCost: product.cost ?? '0.00' })
}
async function submit() {
  if (pending.value || createdId.value || (!submission.value && !valid.value))
    return
  const result = await request.send<PurchaseApi>('/purchases', () => ({
    requestId: crypto.randomUUID(),
    supplierId: supplier.value!.supplierId,
    reference: reference.value.trim() || null,
    notes: notes.value.trim() || null,
    items: cart.value.map((line) => ({
      productId: line.product.productId,
      quantity: Number(line.quantity),
      unitCost: formatCents(moneyCents(line.unitCost)),
    })),
  }))
  if (result) {
    createdId.value = result.purchaseId
    toast.success('Compra pendiente registrada')
    await navigateTo(`/purchases/${result.purchaseId}`)
  }
}
onBeforeRouteLeave(() => !pending.value && !submission.value)
</script>
<template>
  <form class="space-y-6" @submit.prevent="submit">
    <UAlert
      color="info"
      title="Registrar la compra no modifica el stock"
      description="Después podrás confirmar la recepción completa. Este registro no representa un pago al proveedor."
    />
    <UAlert
      v-if="submission"
      color="warning"
      title="Hay una compra cuyo resultado debes confirmar"
      description="Reintenta el mismo registro antes de iniciar otra compra. Se conservarán el proveedor, productos y costos originales."
    />
    <UAlert v-if="error" color="error" :title="error" />
    <UAlert
      v-if="createdId"
      color="success"
      :title="`Compra #${createdId} registrada`"
      ><template #actions
        ><UButton :to="`/purchases/${createdId}`">Ver compra</UButton></template
      ></UAlert
    >
    <section class="space-y-3 rounded-2xl border border-default p-4">
      <h2 class="font-semibold">1. Proveedor</h2>
      <div
        v-if="supplier"
        class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-elevated p-3"
      >
        <div>
          <p class="font-semibold">{{ supplier.name }}</p>
          <p class="text-sm text-muted">
            {{ supplier.document || 'Sin documento' }}
          </p>
        </div>
        <UButton
          color="neutral"
          variant="outline"
          :disabled="locked"
          @click="selectSupplier(null)"
          >Cambiar</UButton
        >
      </div>
      <template v-else>
        <UFormField label="Buscar proveedor activo"
          ><UInput
            v-model="supplierInput"
            icon="i-lucide-search"
            :maxlength="150"
            :disabled="locked"
            class="w-full"
        /></UFormField>
        <UAlert
          v-if="supplierError"
          color="error"
          :title="
            getApiErrorMessage(
              supplierError,
              'No se pudieron cargar los proveedores',
            )
          "
          ><template #actions
            ><UButton
              color="neutral"
              variant="outline"
              @click="refreshSuppliers()"
              >Reintentar</UButton
            ></template
          ></UAlert
        >
        <p v-else-if="supplierPending" role="status">Cargando proveedores...</p>
        <div
          v-else-if="suppliers?.items.length"
          class="grid gap-2 sm:grid-cols-2"
        >
          <UButton
            v-for="item in suppliers.items"
            :key="item.supplierId"
            color="neutral"
            variant="outline"
            class="justify-start whitespace-normal text-left"
            :disabled="locked"
            @click="selectSupplier(item)"
            >{{ item.name }} · {{ item.document || 'Sin documento' }}</UButton
          >
        </div>
        <p v-else class="text-sm text-muted">
          No hay proveedores activos. Puedes crearlos en Proveedores.
        </p>
        <ListPagination
          v-if="suppliers && !supplierError"
          v-model="supplierPage"
          :total="suppliers.total"
          :limit="10"
          :pending="supplierPending || locked"
          label="proveedores"
        />
      </template>
    </section>
    <section class="space-y-3 rounded-2xl border border-default p-4">
      <h2 class="font-semibold">2. Productos y costos de compra</h2>
      <UFormField label="Buscar producto por SKU o nombre"
        ><UInput
          v-model="productInput"
          icon="i-lucide-search"
          :maxlength="150"
          :disabled="locked"
          class="w-full"
      /></UFormField>
      <UAlert
        v-if="productError"
        color="error"
        :title="
          getApiErrorMessage(
            productError,
            'No se pudieron cargar los productos',
          )
        "
        ><template #actions
          ><UButton color="neutral" variant="outline" @click="refreshProducts()"
            >Reintentar</UButton
          ></template
        ></UAlert
      >
      <p v-else-if="productPending" role="status">Cargando productos...</p>
      <ul v-else-if="products?.items.length" class="grid gap-2 sm:grid-cols-2">
        <li
          v-for="product in products.items"
          :key="product.productId"
          class="flex items-center justify-between gap-3 rounded-lg border border-default p-3"
        >
          <div class="min-w-0">
            <p class="break-words font-medium">{{ product.name }}</p>
            <p class="break-all text-xs text-muted">
              {{ product.sku }} · Costo actual: {{ product.cost }}
            </p>
          </div>
          <UButton
            icon="i-lucide-plus"
            color="neutral"
            variant="soft"
            :aria-label="`Añadir ${product.name}`"
            :disabled="
              locked ||
              cart.length >= 100 ||
              cart.some((line) => line.product.productId === product.productId)
            "
            @click="add(product)"
          />
        </li>
      </ul>
      <p v-else class="text-sm text-muted">
        No hay productos que coincidan con la búsqueda.
      </p>
      <ListPagination
        v-if="products && !productError"
        v-model="productPage"
        :total="products.total"
        :limit="10"
        :pending="productPending || locked"
        label="productos"
      />
      <div
        v-for="(line, index) in cart"
        :key="line.product.productId"
        class="grid items-end gap-3 rounded-xl bg-elevated p-3 sm:grid-cols-[minmax(0,1fr)_6rem_8rem_auto]"
      >
        <div>
          <p class="break-words font-semibold">{{ line.product.name }}</p>
          <p class="text-xs text-muted">{{ line.product.sku }}</p>
          <p class="mt-1 text-sm">
            Subtotal: {{ validLine(line) ? formatCents(subtotal(line)) : '—' }}
          </p>
        </div>
        <UFormField :label="`Cantidad · ${line.product.sku}`"
          ><UInput
            v-model="line.quantity"
            inputmode="numeric"
            :maxlength="10"
            :disabled="locked"
            class="w-full"
        /></UFormField>
        <UFormField :label="`Costo unitario · ${line.product.sku}`"
          ><UInput
            v-model="line.unitCost"
            inputmode="decimal"
            :maxlength="19"
            :disabled="locked"
            class="w-full"
        /></UFormField>
        <UButton
          icon="i-lucide-trash-2"
          color="error"
          variant="soft"
          :aria-label="`Quitar ${line.product.name}`"
          :disabled="locked"
          @click="removeLine(index)"
        />
      </div>
      <p v-if="!cart.length" class="text-sm text-muted">
        Añade al menos un producto. Máximo 100 productos diferentes.
      </p>
      <p
        v-if="cart.some((line) => !validLine(line))"
        class="text-sm text-error"
      >
        Usa cantidades enteras mayores que cero y costos con hasta dos
        decimales.
      </p>
    </section>
    <div class="grid gap-3 sm:grid-cols-2">
      <UFormField label="Referencia o comprobante del proveedor"
        ><UInput
          v-model="reference"
          :maxlength="100"
          :disabled="locked"
          class="w-full" /></UFormField
      ><UFormField label="Notas"
        ><UTextarea
          v-model="notes"
          :maxlength="1000"
          :disabled="locked"
          class="w-full"
      /></UFormField>
    </div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="text-lg font-bold">Total de compra: {{ formatCents(total) }}</p>
      <UButton
        type="submit"
        :loading="pending"
        :disabled="
          pending || !!createdId || (!submission && (!valid || locked))
        "
        >{{
          submission ? 'Reintentar registro' : 'Registrar compra pendiente'
        }}</UButton
      >
    </div>
  </form>
</template>
