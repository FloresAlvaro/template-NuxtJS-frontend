<script setup lang="ts">
import type { LowStockReport } from '~/types/report'
import { chartMaximum, chartRatio } from '~/utils/chart'
const props = defineProps<{ items: LowStockReport['items'] }>()
const maximum = computed(() =>
  chartMaximum(
    props.items.flatMap((item) => [
      BigInt(item.inventory?.quantity ?? 0),
      BigInt(item.inventory?.minStock ?? 0),
    ]),
  ),
)
</script>
<template>
  <div class="space-y-5">
    <div class="flex flex-wrap gap-4 text-xs text-muted">
      <span class="inline-flex items-center gap-2"
        ><span class="size-2.5 rounded-full bg-violet-500" />Stock físico</span
      ><span class="inline-flex items-center gap-2"
        ><span class="size-2.5 rounded-full bg-orange-500" />Stock mínimo</span
      >
    </div>
    <div v-for="item in items" :key="item.productId" class="space-y-2">
      <div class="flex flex-wrap justify-between gap-2 text-sm">
        <strong class="break-words">{{ item.name }}</strong
        ><span class="text-xs text-muted"
          >Reservado: {{ item.reservedQuantity }} · Disponible:
          {{ item.availableQuantity }}</span
        >
      </div>
      <div class="flex items-center gap-3">
        <span class="w-12 text-xs text-muted">Físico</span>
        <div class="h-2.5 flex-1 rounded-full bg-elevated">
          <div
            class="h-full rounded-full bg-violet-500"
            :style="{
              width: `${chartRatio(BigInt(item.inventory?.quantity ?? 0), maximum) * 100}%`,
            }"
          />
        </div>
        <span class="w-12 text-right text-xs font-semibold">{{
          item.inventory?.quantity ?? 0
        }}</span>
      </div>
      <div class="flex items-center gap-3">
        <span class="w-12 text-xs text-muted">Mínimo</span>
        <div class="h-2.5 flex-1 rounded-full bg-elevated">
          <div
            class="h-full rounded-full bg-orange-500"
            :style="{
              width: `${chartRatio(BigInt(item.inventory?.minStock ?? 0), maximum) * 100}%`,
            }"
          />
        </div>
        <span class="w-12 text-right text-xs font-semibold">{{
          item.inventory?.minStock ?? 0
        }}</span>
      </div>
    </div>
  </div>
</template>
