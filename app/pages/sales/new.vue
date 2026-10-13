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
  Number(line.quantity) <= line.product.quantity &&
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
  if (locked.value || product.quantity < 1) return
  const line = cart.value.find(
    (line) => line.product.productId === product.productId,
  )
  if (line) {
    if (Number(line.quantity) < product.quantity)
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
    <h1 class="text-xl font-bold">Nueva venta</h1>
    <UAlert
      color="info"
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
          ><div class="flex justify-between items-center">
            <h2 class="font-semibold">Cliente</h2>
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
          <p v-if="customer" class="font-medium">
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
                  customer?.customerId === item.customerId ? 'soft' : 'outline'
                "
                color="neutral"
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
          ><h2 class="font-semibold">Agregar productos</h2></template
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
                  locked || product.quantity === 0 || cart.length >= 100
                "
                @click="add(product)"
                >{{ product.name }} · {{ product.sku }} ·
                {{ product.salePrice }} · Stock: {{ product.quantity }}</UButton
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
        ><div class="flex items-center justify-between">
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
                  {{ line.product.sku }} · Stock: {{ line.product.quantity }}
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
      <p v-else class="text-muted">Agrega productos para registrar la venta.</p>
      <p class="mt-4 text-xl font-bold text-right">Total: {{ total }}</p>
      <div class="mt-4 flex justify-end">
        <UButton
          :disabled="saving || reloading || (!submitted && !valid)"
          :loading="saving"
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
