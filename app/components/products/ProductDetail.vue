<script setup lang="ts">
import type { ProductApi } from '~/types/product'
import { formatStoreDate } from '~/utils/date'

defineProps<{
  product: ProductApi | null
  loading: boolean
  error: string
  categoryName: string
  subCategoryName: string
}>()
const auth = useAuth()
</script>

<template>
  <div>
    <p v-if="loading" role="status">Cargando producto...</p>
    <UAlert v-else-if="error" color="error" :title="error" />
    <div v-else-if="product" class="space-y-6">
      <ProductPhoto
        :src="product.imageUrl"
        :name="product.name"
        class="h-48 w-full rounded-xl"
      />
      <dl class="grid grid-cols-2 gap-3 text-sm">
        <dt class="font-medium">Nombre</dt>
        <dd class="break-words">{{ product.name }}</dd>
        <dt class="font-medium">SKU</dt>
        <dd class="break-all">{{ product.sku }}</dd>
        <dt class="font-medium">Código de barras</dt>
        <dd class="break-all">{{ product.barcode || '—' }}</dd>
        <dt class="font-medium">Categoría</dt>
        <dd>{{ categoryName }}</dd>
        <dt class="font-medium">Subcategoría</dt>
        <dd>{{ subCategoryName }}</dd>
        <template v-if="auth.isAdmin.value"
          ><dt class="font-medium">Costo</dt>
          <dd>{{ product.cost }}</dd></template
        >
        <dt class="font-medium">Precio de venta</dt>
        <dd>{{ product.salePrice }}</dd>
        <dt class="font-medium">Stock físico</dt>
        <dd>{{ product.quantity }}</dd>
        <dt class="font-medium">Reservado</dt>
        <dd>{{ product.reservedQuantity }}</dd>
        <dt class="font-medium">Disponible para venta</dt>
        <dd>{{ product.availableQuantity }}</dd>
        <dt class="font-medium">Stock mínimo</dt>
        <dd>{{ product.minStock }}</dd>
        <dt class="font-medium">Estado</dt>
        <dd>{{ product.isActive ? 'Activo' : 'Inactivo' }}</dd>
        <dt class="font-medium">Descripción</dt>
        <dd class="whitespace-pre-wrap break-words">
          {{ product.description || '—' }}
        </dd>
        <dt class="font-medium">Fecha de creación</dt>
        <dd>{{ formatStoreDate(product.createdAt) }}</dd>
        <dt class="font-medium">Última actualización</dt>
        <dd>{{ formatStoreDate(product.updatedAt) }}</dd>
      </dl>
    </div>
  </div>
</template>
