<script setup lang="ts">
import type { StockAlertPage } from '~/types/stock-alert'
const { data, error, refresh } = await useApiFetch<StockAlertPage>(
  '/inventory/alerts',
  { query: { limit: 1 } },
)
useLiveRefresh(refresh)
</script>
<template>
  <UAlert
    v-if="error"
    color="warning"
    title="No se pudieron consultar las alertas de stock"
    ><template #actions
      ><UButton variant="outline" color="neutral" @click="refresh()"
        >Reintentar</UButton
      ></template
    ></UAlert
  ><UAlert
    v-else-if="data?.summary.total"
    color="warning"
    icon="i-lucide-triangle-alert"
    :title="data.summary.total + ' productos requieren atención'"
    :description="
      data.summary.outOfStock +
      ' agotados · ' +
      data.summary.lowStock +
      ' con stock bajo. Se descuentan las reservas vigentes.'
    "
    ><template #actions
      ><UButton to="/stock-alerts" color="neutral" variant="outline"
        >Ver alertas</UButton
      ></template
    ></UAlert
  >
</template>
