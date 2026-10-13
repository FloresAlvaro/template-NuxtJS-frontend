<script setup lang="ts">
interface ShopProduct {
  quantity: number
  productId: number
  name: string
  sku: string
  description: string | null
  salePrice: string
}
const page = ref(1)
const { data, pending, error } = await useApiFetch<{
  items: ShopProduct[]
  total: number
}>('/shop/products', { query: { page, limit: 12 } })
const totalPages = computed(() => Math.max(1, Math.ceil((data.value?.total ?? 0) / 12)))
</script>
<template>
  <div class="space-y-6">
    <UBreadcrumb :items="[{ label: 'Inicio', to: '/' }, { label: 'Catálogo' }]" />
    <h1 class="text-2xl font-bold">Catálogo de productos</h1>
    <p v-if="pending">Cargando productos...</p>
    <p v-else-if="error" role="alert" class="text-red-600">No se pudo cargar el catálogo.</p>
    <div v-else-if="data?.items.length" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <UCard v-for="product in data.items" :key="product.productId"
        ><h2 class="font-semibold text-lg">{{ product.name }}</h2>
        <p class="text-sm text-muted">{{ product.sku }}</p>
        <p class="my-3">{{ product.description }}</p>
        <p class="font-bold">Precio: {{ product.salePrice }}</p>
        <p class="mt-2 text-sm">
          {{ product.quantity > 0 ? `${product.quantity} unidades disponibles` : 'Agotado' }}
        </p></UCard
      >
    </div>
    <p v-else>No hay productos disponibles.</p>
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
