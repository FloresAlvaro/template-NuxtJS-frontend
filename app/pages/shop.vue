<script setup lang="ts">
import type { ShopProduct } from '~/types/shop'
const auth = useAuth()
const cart = ref<{ product: ShopProduct; quantity: string }[]>([])
const checkoutLocked = ref(true)
function add(product: ShopProduct) {
  if (checkoutLocked.value || product.availableQuantity < 1) return
  const line = cart.value.find(
    (line) => line.product.productId === product.productId,
  )
  if (line && Number(line.quantity) < product.availableQuantity)
    line.quantity = String(Number(line.quantity) + 1)
  else if (!line && cart.value.length < 100)
    cart.value.push({ product, quantity: '1' })
}
const page = ref(1)
const { data, pending, error, refresh } = await useApiFetch<{
  items: ShopProduct[]
  total: number
}>('/shop/products', { query: { page, limit: 12 } })
const totalPages = computed(() =>
  Math.max(1, Math.ceil((data.value?.total ?? 0) / 12)),
)
</script>
<template>
  <div class="space-y-6">
    <UBreadcrumb
      :items="[{ label: 'Inicio', to: '/' }, { label: 'Catálogo' }]"
    />
    <div class="flex flex-wrap gap-3 items-center justify-between">
      <h1 class="text-2xl font-bold">Catálogo de productos</h1>
      <UButton
        v-if="auth.user.value?.role === 'CUSTOMER'"
        to="/orders"
        color="neutral"
        variant="outline"
        >Mis pedidos</UButton
      >
    </div>
    <UAlert
      v-if="!auth.user.value"
      color="info"
      title="Compra con retiro en tienda"
      ><template #actions
        ><UButton to="/login?redirect=/shop"
          >Ingresar para pedir</UButton
        ></template
      ></UAlert
    >
    <UButton
      color="neutral"
      variant="outline"
      :disabled="
        pending || (auth.user.value?.role === 'CUSTOMER' && checkoutLocked)
      "
      @click="refresh()"
      >Actualizar disponibilidad</UButton
    >
    <p v-if="pending">Cargando productos...</p>
    <UAlert
      v-else-if="error"
      color="error"
      title="No se pudo cargar el catálogo"
      ><template #actions
        ><UButton @click="refresh()">Reintentar</UButton></template
      ></UAlert
    >
    <div
      v-else-if="data?.items.length"
      class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <UCard v-for="product in data.items" :key="product.productId"
        ><h2 class="font-semibold text-lg">{{ product.name }}</h2>
        <p class="text-sm text-muted">{{ product.sku }}</p>
        <p class="my-3">{{ product.description }}</p>
        <p class="font-bold">Precio: {{ product.salePrice }}</p>
        <p class="mt-2 text-sm">
          {{
            product.availableQuantity > 0
              ? `${product.availableQuantity} unidades disponibles`
              : 'Agotado'
          }}
        </p>
        <UButton
          v-if="auth.user.value?.role === 'CUSTOMER'"
          class="mt-3"
          :disabled="
            checkoutLocked ||
            product.availableQuantity < 1 ||
            cart.length >= 100
          "
          @click="add(product)"
          >Agregar al pedido</UButton
        >
      </UCard>
    </div>
    <p v-else>No hay productos disponibles.</p>
    <OrderCheckout
      v-if="auth.user.value?.role === 'CUSTOMER'"
      v-model="cart"
      @locked="checkoutLocked = $event"
      @created="refresh()"
    />
    <div class="flex items-center gap-3">
      <UButton
        :disabled="page <= 1 || pending"
        variant="outline"
        @click="
          () => {
            page--
          }
        "
        >Anterior</UButton
      ><span>{{ page }} / {{ totalPages }}</span
      ><UButton
        :disabled="page >= totalPages || pending"
        variant="outline"
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
