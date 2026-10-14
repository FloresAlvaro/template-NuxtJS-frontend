<script setup lang="ts">
import type { ShopProduct } from '~/types/shop'
const auth = useAuth()
const toast = useAppToast()
const cartCount = computed(() => cart.value.reduce((count, line) => count + Number(line.quantity || 0), 0))
const lastAdded = ref<number | null>(null)
const cart = ref<{ product: ShopProduct; quantity: string }[]>([])
const checkoutLocked = ref(true)
function add(product: ShopProduct) {
  if (checkoutLocked.value || product.availableQuantity < 1) return
  const line = cart.value.find(
    (line) => line.product.productId === product.productId,
  )
  if (line && Number(line.quantity) >= product.availableQuantity) {
    toast.warn('Ya agregaste todas las unidades disponibles')
    return
  }
  if (line && Number(line.quantity) < product.availableQuantity)
    line.quantity = String(Number(line.quantity) + 1)
  else if (!line && cart.value.length < 100)
    cart.value.push({ product, quantity: '1' })
  lastAdded.value = product.productId
  toast.success('Agregado a tu pedido', product.name)
}
const route = useRoute()
const router = useRouter()
const queryPage = computed(() => {
  const value = Number(route.query.page)
  return Number.isSafeInteger(value) && value > 0 && value <= 1000000 ? value : 1
})
const page = computed({ get: () => queryPage.value, set: (value: number) => { void router.replace({ query: { ...route.query, page: value > 1 ? String(value) : undefined } }) } })
const { data, pending, error, refresh } = await useApiFetch<{
  items: ShopProduct[]
  total: number
}>('/shop/products', { query: { page, limit: 12 } })
const totalPages = computed(() =>
  Math.max(1, Math.ceil((data.value?.total ?? 0) / 12)),
)
watch(totalPages, (total) => { if (data.value && page.value > total) page.value = total })
</script>
<template>
  <div class="space-y-7">
    <UBreadcrumb :items="[{ label: 'Inicio', to: '/' }, { label: 'Catálogo' }]" />
    <section class="hero-panel p-6 sm:p-8 flex flex-wrap items-center justify-between gap-6">
      <div><p class="section-eyebrow text-violet-200">Explora y elige</p><h1 class="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight">Encuentra tu próxima compra.</h1><p class="mt-3 text-violet-100">Productos disponibles para reservar y retirar en tienda.</p></div>
      <UButton v-if="auth.user.value?.role === 'CUSTOMER'" to="/orders" icon="i-lucide-shopping-bag" color="neutral" :ui="{ base: 'bg-white text-violet-950 hover:bg-violet-100' }">Mis pedidos</UButton>
    </section>
    <div v-if="!auth.user.value" class="rounded-2xl border border-default bg-default p-4 flex flex-wrap items-center justify-between gap-4"><div><p class="font-semibold">¿Encontraste algo que te gusta?</p><p class="text-sm text-muted">Ingresa para preparar tu pedido. El pago se realiza en tienda.</p></div><UButton to="/login?redirect=/shop" icon="i-lucide-log-in" variant="soft">Ingresar para pedir</UButton></div>
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div><h2 class="text-xl font-bold">Nuestro catálogo</h2><p v-if="data && !error" class="mt-1 text-sm text-muted">{{ data.total }} productos · Página {{ page }} de {{ totalPages }}</p></div>
      <div class="flex items-center gap-3"><UButton v-if="auth.user.value?.role === 'CUSTOMER'" to="#tu-pedido" color="neutral" variant="soft" icon="i-lucide-shopping-bag">Tu pedido · {{ cartCount }}</UButton><UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" :loading="pending" :disabled="pending || (auth.user.value?.role === 'CUSTOMER' && checkoutLocked)" @click="refresh()">Actualizar</UButton></div>
    </div>
    <div v-if="pending" role="status" aria-label="Cargando productos" class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"><div v-for="n in 6" :key="n" class="product-card p-4 space-y-4"><USkeleton class="h-48 rounded-xl" /><USkeleton class="h-5 w-2/3" /><USkeleton class="h-4 w-1/2" /><USkeleton class="h-10" /></div><span class="sr-only">Cargando productos...</span></div>
    <UAlert v-else-if="error" color="error" title="No se pudo cargar el catálogo"><template #actions><UButton @click="refresh()">Reintentar</UButton></template></UAlert>
    <div v-else-if="data?.items.length" class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <article v-for="product in data.items" :key="product.productId" class="product-card flex flex-col">
        <div class="relative"><ProductPhoto :src="product.imageUrl" :name="product.name" class="h-56 w-full" /><UBadge class="absolute top-3 left-3" :color="product.availableQuantity > 0 ? 'success' : 'neutral'" variant="solid">{{ product.availableQuantity > 0 ? 'Disponible' : 'Agotado' }}</UBadge></div>
        <div class="p-5 flex flex-1 flex-col"><p class="text-xs text-muted tracking-wide break-all">{{ product.sku }}</p><h3 class="mt-2 text-lg font-bold break-words">{{ product.name }}</h3><p class="mt-2 text-sm text-muted line-clamp-3 break-words">{{ product.description || 'Consulta su disponibilidad y prepara tu pedido.' }}</p><div class="mt-auto pt-5"><p class="text-2xl font-extrabold tracking-tight">{{ product.salePrice }}<span class="sr-only"> precio</span></p><p class="mt-1 text-xs text-muted">{{ product.availableQuantity > 0 ? `${product.availableQuantity} unidades disponibles` : 'Por el momento no hay unidades disponibles' }}</p>
          <UButton v-if="auth.user.value?.role === 'CUSTOMER'" class="mt-4" block :icon="lastAdded === product.productId ? 'i-lucide-check' : 'i-lucide-plus'" :disabled="checkoutLocked || product.availableQuantity < 1 || (cart.length >= 100 && !cart.some(line => line.product.productId === product.productId))" @click="add(product)">{{ product.availableQuantity < 1 ? 'Agotado' : 'Agregar al pedido' }}</UButton>
        </div></div>
      </article>
    </div>
    <div v-else class="rounded-3xl border border-dashed border-default p-12 text-center"><UIcon name="i-lucide-package-open" class="size-12 text-primary" /><h2 class="mt-4 text-xl font-bold">Pronto habrá más para descubrir</h2><p class="mt-2 text-muted">No hay productos disponibles en este momento.</p><UButton class="mt-5" variant="soft" @click="refresh()">Volver a consultar</UButton></div>
    <ListPagination v-if="data && !error" v-model="page" :total="data.total" :limit="12" :pending="pending" />
    <section v-if="auth.user.value?.role === 'CUSTOMER'" id="tu-pedido" class="scroll-mt-24"><OrderCheckout v-model="cart" @locked="checkoutLocked = $event" @created="refresh()" /></section>
  </div>
</template>
