<script setup lang="ts">
import type { ProductApi } from '~/types/product'
defineProps<{ product: ProductApi }>()
</script>

<template>
  <div class="space-y-1 text-center">
    <p
      class="font-semibold tabular-nums"
      :class="
        product.availableQuantity === 0
          ? 'text-error'
          : product.availableQuantity <= product.minStock
            ? 'text-warning'
            : 'text-success'
      "
    >
      {{ product.availableQuantity }} disponibles
    </p>
    <p class="text-xs text-muted">
      Físico: {{ product.quantity }} · Reservado: {{ product.reservedQuantity }}
    </p>
  </div>
</template>
