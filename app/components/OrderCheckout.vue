<script setup lang="ts">
import type { ShopProduct } from '~/types/shop'
import type { CreateOrderPayload, OrderApi } from '~/types/order'
import { moneyCents, formatCents } from '~/utils/money'
const cart = defineModel<{ product: ShopProduct; quantity: string }[]>({
  required: true,
})
const emit = defineEmits<{ locked: [value: boolean]; created: [] }>()
const api = useApi()
const { user } = useAuth()
const request = useIdempotentRequest<CreateOrderPayload>(
  `order-checkout-${user.value?.userId}`,
)
const { pending, error, submission, locked } = request
const {
  pending: reloading,
  error: reloadError,
  run: runReload,
} = useAsyncAction()
const recordedId = ref<number | null>(null)
const blocked = computed(
  () => locked.value || reloading.value || recordedId.value !== null,
)
watch(blocked, (value) => emit('locked', value), { immediate: true })
const lineValid = (line: (typeof cart.value)[number]) =>
  /^\d+$/.test(line.quantity) &&
  Number.isSafeInteger(Number(line.quantity)) &&
  Number(line.quantity) > 0 &&
  Number(line.quantity) <= line.product.availableQuantity
const total = computed(() =>
  cart.value.reduce(
    (sum, line) =>
      sum +
      (lineValid(line)
        ? moneyCents(line.product.salePrice) * BigInt(line.quantity)
        : 0n),
    0n,
  ),
)
const valid = computed(
  () =>
    cart.value.length > 0 &&
    cart.value.length <= 100 &&
    cart.value.every(lineValid) &&
    total.value <= 999999999999999999n,
)
async function reload() {
  if (blocked.value) return
  await runReload(async () => {
    const products = await Promise.all(
      cart.value.map((line) =>
        api<ShopProduct>(`/shop/products/${line.product.productId}`),
      ),
    )
    cart.value = cart.value.map((line, index) => ({
      ...line,
      product: products[index]!,
    }))
  }, 'No se pudo actualizar el carrito. Un producto puede haberse desactivado; retíralo y vuelve a consultar el catálogo.')
}
async function submit() {
  if (pending.value || (!submission.value && !valid.value)) return
  const order = await request.send<OrderApi>('/orders', () => ({
    requestId: crypto.randomUUID(),
    items: cart.value.map((line) => ({
      productId: line.product.productId,
      quantity: Number(line.quantity),
      expectedUnitPrice: line.product.salePrice,
    })),
  }))
  if (order) {
    recordedId.value = order.orderId
    cart.value = []
    emit('created')
    await navigateTo(`/orders/${order.orderId}`)
  }
}
onBeforeRouteLeave(
  () => recordedId.value !== null || (!pending.value && !submission.value),
)
</script>
<template>
  <UCard>
    <template #header
      ><h2 class="font-semibold text-lg">
        Tu pedido · Retiro en tienda
      </h2></template
    >
    <UAlert v-if="recordedId" color="success" title="Pedido registrado"
      ><template #actions
        ><UButton :to="`/orders/${recordedId}`">Ver pedido</UButton></template
      ></UAlert
    >
    <form v-else class="space-y-4" @submit.prevent="submit">
      <p class="text-sm text-muted">
        Al confirmar se reservan las unidades hasta la fecha indicada en el
        pedido. El pago se realiza en tienda.
      </p>
      <p v-if="!cart.length && !submission">
        Agrega productos del catálogo para preparar tu pedido.
      </p>
      <div
        v-for="(line, index) in cart"
        :key="line.product.productId"
        class="flex flex-wrap items-end gap-3 border-b border-default pb-3"
      >
        <div class="flex-1 min-w-40">
          <strong>{{ line.product.name }}</strong>
          <p class="text-sm">
            {{ line.product.sku }} · Precio: {{ line.product.salePrice }} ·
            Disponible: {{ line.product.availableQuantity }}
          </p>
        </div>
        <UFormField
          :label="`Cantidad de ${line.product.name}`"
          :error="
            !lineValid(line) ? 'Revisa la cantidad y disponibilidad' : undefined
          "
          ><UInput
            v-model="line.quantity"
            type="number"
            :min="1"
            :max="line.product.availableQuantity"
            :step="1"
            :disabled="blocked"
            class="w-28"
        /></UFormField>
        <UButton
          color="neutral"
          variant="outline"
          :disabled="blocked"
          :aria-label="`Quitar ${line.product.name}`"
          @click="
            () => {
              cart.splice(index, 1)
            }
          "
          >Quitar</UButton
        >
      </div>
      <p class="font-semibold text-lg">
        Total estimado: {{ formatCents(total) }}
      </p>
      <UAlert
        v-if="submission"
        color="warning"
        title="Envío pendiente de confirmar"
        description="Reintenta el mismo pedido. No se enviará un pedido nuevo aunque la respuesta anterior se haya perdido."
      />
      <UAlert
        v-if="error || reloadError"
        color="error"
        :title="error || reloadError"
      />
      <div class="flex flex-wrap gap-3">
        <UButton
          :disabled="blocked || !cart.length"
          color="neutral"
          variant="outline"
          :loading="reloading"
          @click="reload"
          >Actualizar precios y stock</UButton
        >
        <UButton
          type="submit"
          :loading="pending"
          :disabled="reloading || (!submission && (!valid || locked))"
          >{{ submission ? 'Reintentar pedido' : 'Confirmar pedido' }}</UButton
        >
      </div>
    </form>
  </UCard>
</template>
