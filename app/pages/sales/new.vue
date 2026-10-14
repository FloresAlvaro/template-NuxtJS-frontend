<script setup lang="ts">
import type { CustomerApi, CustomerPage } from '~/types/customer'
import type { ProductApi, ProductPage } from '~/types/product'
import type { SaleApi } from '~/types/sale'
import { moneyCents, formatCents } from '~/utils/money'
import { apiErrorStatus } from '~/utils/api-error'
const api = useApi()
const toast = useAppToast()
const { getApiErrorMessage } = useApiErrorMessage()
const { input: customerInput, search: customerSearch } = useSearchText()
const { input: productInput, search: productSearch } = useSearchText()
const customerPage = ref(1),
  productPage = ref(1)
watch(
  customerSearch,
  () => {
    customerPage.value = 1
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
  data: customers,
  pending: customersPending,
  error: customersError,
  refresh: refreshCustomers,
} = await useApiFetch<CustomerPage>('/customers', {
  query: {
    search: customerSearch,
    status: 'active',
    page: customerPage,
    limit: 10,
  },
})
const {
  data: products,
  pending: productsPending,
  error: productsError,
  refresh: refreshProducts,
} = await useApiFetch<ProductPage>('/products', {
  query: {
    search: productSearch,
    status: 'active',
    page: productPage,
    limit: 10,
  },
})
const customer = ref<CustomerApi | null>(null)
type CartLine = { product: ProductApi; quantity: string }
const cart = ref<CartLine[]>([])
const { pending: saving, error: saveError, run } = useAsyncAction()
const {
  pending: reloading,
  error: reloadError,
  run: runReload,
} = useAsyncAction()
type Payload = {
  requestId: string
  customerId: number
  items: { productId: number; quantity: number; expectedUnitPrice: string }[]
}
const submitted = ref<Payload | null>(null)
const recordedSaleId = ref<number | null>(null)
const locked = computed(
  () =>
    saving.value ||
    reloading.value ||
    submitted.value !== null ||
    recordedSaleId.value !== null,
)
const validQuantity = (line: CartLine) =>
  /^\d+$/.test(line.quantity) &&
  Number.isSafeInteger(Number(line.quantity)) &&
  Number(line.quantity) > 0 &&
  Number(line.quantity) <= line.product.availableQuantity &&
  line.product.isActive
const totalCents = computed(() =>
  cart.value.reduce(
    (sum, line) =>
      sum +
      (validQuantity(line)
        ? moneyCents(line.product.salePrice) * BigInt(line.quantity)
        : 0n),
    0n,
  ),
)
const valid = computed(
  () =>
    customer.value?.isActive &&
    cart.value.length > 0 &&
    cart.value.length <= 100 &&
    cart.value.every(validQuantity) &&
    totalCents.value <= 999999999999999999n,
)
const total = computed(() => formatCents(totalCents.value))
const customerPages = computed(() =>
  Math.max(1, Math.ceil((customers.value?.total ?? 0) / 10)),
)
const productPages = computed(() =>
  Math.max(1, Math.ceil((products.value?.total ?? 0) / 10)),
)
function add(product: ProductApi) {
  if (locked.value || product.availableQuantity < 1) return
  const line = cart.value.find(
    (line) => line.product.productId === product.productId,
  )
  if (line) {
    if (Number(line.quantity) < product.availableQuantity)
      line.quantity = String(Number(line.quantity) + 1)
  } else if (cart.value.length < 100)
    cart.value.push({ product: { ...product }, quantity: '1' })
}
const customerOpen = ref(false),
  customerBusy = ref(false)
async function customerSaved(value: CustomerApi) {
  customer.value = value
  customerBusy.value = false
  customerOpen.value = false
  await refreshCustomers()
}
async function reload() {
  if (locked.value) return
  await runReload(async () => {
    const updated = await Promise.all(
      cart.value.map((line) =>
        api<ProductApi>(`/products/${line.product.productId}`),
      ),
    )
    updated.forEach((product, index) => {
      cart.value[index]!.product = product
    })
    if (customer.value)
      customer.value = await api<CustomerApi>(
        `/customers/${customer.value.customerId}`,
      )
    await Promise.all([refreshCustomers(), refreshProducts()])
  }, 'No se pudieron actualizar los precios y existencias')
}
async function submit() {
  if (recordedSaleId.value !== null) {
    await navigateTo(`/sales/${recordedSaleId.value}`)
    return
  }
  if (saving.value || reloading.value || (!submitted.value && !valid.value))
    return
  await run(async () => {
    submitted.value ??= {
      requestId: crypto.randomUUID(),
      customerId: customer.value!.customerId,
      items: cart.value.map((line) => ({
        productId: line.product.productId,
        quantity: Number(line.quantity),
        expectedUnitPrice: line.product.salePrice,
      })),
    }
    let sale: SaleApi
    try {
      sale = await api<SaleApi>('/sales', {
        method: 'POST',
        body: submitted.value,
      })
    } catch (error) {
      const status = apiErrorStatus(error)
      if (status && status >= 400 && status < 500) submitted.value = null
      throw error
    }
    submitted.value = null
    recordedSaleId.value = sale.saleId
    toast.success(`Venta #${sale.saleId} registrada`)
    clearNuxtData()
    await navigateTo(`/sales/${sale.saleId}`)
  }, 'No se pudo confirmar el envío. Reintenta la misma venta para evitar duplicados.')
}
onBeforeRouteLeave(
  () => recordedSaleId.value !== null || (!saving.value && !submitted.value),
)
</script>
<template>
  <div class="space-y-5">
    <UBreadcrumb
      :items="[
        { label: 'Inicio', to: '/' },
        { label: 'Ventas', to: '/sales' },
        { label: 'Nueva venta' },
      ]"
    />
    <WorkspaceHeader eyebrow="Punto de venta" title="Nueva venta" icon="i-lucide-shopping-cart" description="Selecciona el cliente, agrega productos y revisa el total antes de registrar.">
      <template #actions><UButton to="/sales" color="neutral" variant="outline" icon="i-lucide-arrow-left" :disabled="locked" :ui="{ base: 'bg-transparent text-white ring-white/30 hover:bg-white/10' }">Volver a ventas</UButton></template>
    </WorkspaceHeader>
    <ol class="grid gap-3 sm:grid-cols-3" aria-label="Pasos para registrar una venta">
      <li v-for="(step, index) in ['Selecciona el cliente', 'Agrega productos', 'Revisa y confirma']" :key="step" class="flex items-center gap-3 rounded-2xl border border-default bg-default p-4"><span class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{{ index + 1 }}</span><span class="text-sm font-medium">{{ step }}</span></li>
    </ol>
    <UAlert
      color="neutral"
      variant="subtle"
      icon="i-lucide-info"
      title="Registrar descuenta el stock"
      description="Revisa cliente, cantidades y precios antes de confirmar. Después podrás registrar cobros y gestionar devoluciones o anulaciones desde el detalle de la venta."
    />
    <UAlert v-if="saveError" color="error" :title="saveError" />
    <UAlert
      v-if="submitted && !saving"
      color="warning"
      title="Envío pendiente de confirmar"
      description="Los datos están bloqueados. Pulsa Reintentar venta: se recuperará la venta original si ya se guardó, sin volver a descontar stock."
    />
    <UAlert v-if="reloadError" color="error" :title="reloadError" />
    <div class="grid gap-5 lg:grid-cols-2">
      <UCard
        ><template #header
          ><div class="flex flex-wrap justify-between items-center gap-3">
            <h2 class="flex items-center gap-2 font-semibold"><UIcon name="i-lucide-user-round" class="size-5 text-primary" />Cliente</h2>
            <UButton
              icon="i-lucide-user-plus"
              color="neutral"
              variant="outline"
              :disabled="locked"
              @click="
                () => {
                  customerOpen = true
                }
              "
              >Nuevo</UButton
            >
          </div></template
        >
        <div class="space-y-3">
          <p v-if="customer" class="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm font-medium">
            Seleccionado: {{ customer.name }} ·
            {{ customer.document || 'Sin documento' }}
          </p>
          <UInput
            v-model="customerInput"
            icon="i-lucide-search"
            placeholder="Nombre, documento o teléfono"
            :maxlength="100"
            :disabled="locked"
            class="w-full"
            aria-label="Buscar cliente"
          />
          <UAlert
            v-if="customersError"
            color="error"
            :title="
              getApiErrorMessage(
                customersError,
                'No se pudieron cargar los clientes',
              )
            "
          />
          <p v-else-if="customersPending" role="status">Buscando clientes...</p>
          <ul v-else class="space-y-2">
            <li v-for="item in customers?.items" :key="item.customerId">
              <UButton
                block
                :variant="
                  customer?.customerId === item.customerId ? 'soft' : 'ghost'
                "
                :color="customer?.customerId === item.customerId ? 'primary' : 'neutral'"
                :aria-pressed="customer?.customerId === item.customerId"
                :disabled="locked"
                @click="
                  () => {
                    customer = item
                  }
                "
                >{{ item.name }} ·
                {{ item.document || 'Sin documento' }}</UButton
              >
            </li>
          </ul>
          <p
            v-if="
              !customersPending && !customersError && !customers?.items.length
            "
            class="text-sm text-muted"
          >
            No hay clientes activos. Puedes crear uno sin cuenta.
          </p>
          <div class="flex items-center justify-between gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="customerPage <= 1 || customersPending || locked"
              @click="
                () => {
                  customerPage--
                }
              "
              >Anterior</UButton
            ><span class="text-sm"
              >{{ customerPage }} / {{ customerPages }}</span
            ><UButton
              color="neutral"
              variant="ghost"
              :disabled="
                customerPage >= customerPages || customersPending || locked
              "
              @click="
                () => {
                  customerPage++
                }
              "
              >Siguiente</UButton
            >
          </div>
        </div>
      </UCard>
      <UCard
        ><template #header
          ><h2 class="flex items-center gap-2 font-semibold"><UIcon name="i-lucide-package-plus" class="size-5 text-primary" />Agregar productos</h2></template
        >
        <div class="space-y-3">
          <UInput
            v-model="productInput"
            icon="i-lucide-search"
            placeholder="SKU o nombre del producto"
            :maxlength="150"
            :disabled="locked"
            class="w-full"
            aria-label="Buscar producto"
          />
          <UAlert
            v-if="productsError"
            color="error"
            :title="
              getApiErrorMessage(
                productsError,
                'No se pudieron cargar los productos',
              )
            "
          />
          <p v-else-if="productsPending" role="status">Buscando productos...</p>
          <ul v-else class="space-y-2">
            <li v-for="product in products?.items" :key="product.productId">
              <UButton
                block
                color="neutral"
                variant="outline"
                :disabled="
                  locked || product.availableQuantity === 0 || (cart.length >= 100 && !cart.some(line => line.product.productId === product.productId))
                "
                @click="add(product)"
                ><span class="flex w-full min-w-0 items-center justify-between gap-3 text-left"><span class="min-w-0"><span class="block truncate font-semibold">{{ product.name }}</span><span class="block text-xs text-muted">{{ product.sku }} · Disponible: {{ product.availableQuantity }}</span></span><span class="shrink-0 font-bold text-primary">{{ product.salePrice }}<UIcon name="i-lucide-plus-circle" class="ml-2 size-4 align-middle" /></span></span></UButton
              >
            </li>
          </ul>
          <p
            v-if="!productsPending && !productsError && !products?.items.length"
            class="text-sm text-muted"
          >
            No hay productos que coincidan.
          </p>
          <div class="flex items-center justify-between gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              :disabled="productPage <= 1 || productsPending || locked"
              @click="
                () => {
                  productPage--
                }
              "
              >Anterior</UButton
            ><span class="text-sm">{{ productPage }} / {{ productPages }}</span
            ><UButton
              color="neutral"
              variant="ghost"
              :disabled="
                productPage >= productPages || productsPending || locked
              "
              @click="
                () => {
                  productPage++
                }
              "
              >Siguiente</UButton
            >
          </div>
        </div>
      </UCard>
    </div>
    <UCard
      ><template #header
        ><div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="font-semibold">Detalle de la venta</h2>
          <UButton
            icon="i-lucide-refresh-cw"
            color="neutral"
            variant="outline"
            :loading="reloading"
            :disabled="locked || reloading"
            @click="reload"
            >Actualizar precios y stock</UButton
          >
        </div></template
      >
      <div v-if="cart.length" class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-default">
              <th class="p-3 text-left">Producto</th>
              <th class="p-3 text-center">Precio</th>
              <th class="p-3 text-center">Cantidad</th>
              <th class="p-3 text-center">Subtotal</th>
              <th class="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="line in cart"
              :key="line.product.productId"
              class="border-b border-default"
            >
              <td class="p-3">
                {{ line.product.name }}
                <p class="text-muted">
                  {{ line.product.sku }} · Disponible: {{ line.product.availableQuantity }}
                </p>
                <p v-if="!validQuantity(line)" class="text-error">
                  Revisa la cantidad o el estado del producto.
                </p>
              </td>
              <td class="p-3 text-center">{{ line.product.salePrice }}</td>
              <td class="p-3">
                <UInput
                  v-model="line.quantity"
                  inputmode="numeric"
                  :disabled="locked || reloading"
                  class="w-24"
                  :aria-label="`Cantidad de ${line.product.name}`"
                />
              </td>
              <td class="p-3 text-center">
                {{
                  validQuantity(line)
                    ? formatCents(
                        moneyCents(line.product.salePrice) *
                          BigInt(line.quantity),
                      )
                    : '—'
                }}
              </td>
              <td class="p-3 text-center">
                <UButton
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="soft"
                  :disabled="locked || reloading"
                  :aria-label="`Quitar ${line.product.name}`"
                  @click="
                    () => {
                      cart = cart.filter((item) => item !== line)
                    }
                  "
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="rounded-xl border border-dashed border-default p-8 text-center"><UIcon name="i-lucide-shopping-cart" class="size-9 text-muted" /><p class="mt-3 font-medium">Tu venta comienza aquí</p><p class="mt-1 text-sm text-muted">Agrega productos desde el listado para revisar cantidades y precios.</p></div>
      <div class="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-primary/5 p-5"><div><p class="text-sm font-medium">{{ customer?.name || 'Selecciona un cliente' }}</p><p class="mt-1 text-xs text-muted">{{ cart.length }} {{ cart.length === 1 ? 'producto distinto' : 'productos distintos' }} · Cobro posterior al registro</p></div><div class="min-w-0 text-right"><p class="section-eyebrow text-primary">Total de la venta</p><p class="mt-2 break-all text-3xl font-extrabold tabular-nums">{{ total }}</p></div></div>
      <div class="mt-4 flex justify-end">
        <UButton
          :disabled="saving || reloading || (!submitted && !valid)"
          :loading="saving"
          size="lg"
          icon="i-lucide-check"
          class="w-full sm:w-auto"
          @click="submit"
          >{{
            submitted && !saving
              ? 'Reintentar venta'
              : 'Confirmar y registrar venta'
          }}</UButton
        >
      </div>
    </UCard>
    <UModal
      v-model:open="customerOpen"
      title="Nuevo cliente"
      :close="!customerBusy"
      :dismissible="!customerBusy"
      ><template #body
        ><CustomerForm
          v-if="customerOpen"
          @saved="customerSaved"
          @busy="customerBusy = $event" /></template
    ></UModal>
  </div>
</template>
