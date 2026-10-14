<script setup lang="ts">
import type { ChartDatum } from '~/types/chart'
import { chartRatio, reportNumber } from '~/utils/chart'
const props = defineProps<{
  data: ChartDatum[]
  label: string
  formattedTotal: string
  totalLabel: string
}>()
const total = computed(() =>
  props.data.reduce((sum, item) => sum + item.value, 0n),
)
const circumference = 2 * Math.PI * 70
const segments = computed(() => {
  let offset = 0
  return props.data.map((item) => {
    const ratio = chartRatio(item.value, total.value)
    const segment = {
      ...item,
      size: ratio * circumference,
      offset,
      percent: `${(ratio * 100).toFixed(1)}%`,
    }
    offset += segment.size
    return segment
  })
})
</script>
<template>
  <div class="grid items-center gap-5 sm:grid-cols-[190px_1fr]">
    <svg
      viewBox="0 0 200 200"
      role="img"
      :aria-label="label"
      class="mx-auto w-44"
    >
      <title>{{ label }}</title>
      <circle
        cx="100"
        cy="100"
        r="70"
        fill="none"
        stroke="currentColor"
        class="text-muted/10"
        stroke-width="24"
      />
      <circle
        v-for="segment in segments.filter((item) => item.value > 0n)"
        :key="segment.key"
        cx="100"
        cy="100"
        r="70"
        fill="none"
        :stroke="segment.color || '#8b5cf6'"
        stroke-width="24"
        :stroke-dasharray="`${segment.size} ${circumference}`"
        :stroke-dashoffset="-segment.offset"
        transform="rotate(-90 100 100)"
      >
        <title>
          {{ segment.label }}: {{ segment.formatted }} ({{ segment.percent }})
        </title>
      </circle>
      <text
        x="100"
        y="98"
        text-anchor="middle"
        fill="currentColor"
        class="font-bold"
        font-size="18"
      >
        {{
          formattedTotal.length <= 12
            ? reportNumber(formattedTotal)
            : 'Ver detalle'
        }}
      </text>
      <text
        x="100"
        y="118"
        text-anchor="middle"
        fill="currentColor"
        class="text-muted"
        font-size="10"
      >
        {{ totalLabel }}
      </text>
    </svg>
    <div class="min-w-0 space-y-4">
      <div
        v-for="segment in segments"
        :key="segment.key"
        class="flex items-start gap-3"
      >
        <span
          class="mt-1.5 size-2.5 shrink-0 rounded-full"
          :style="{ background: segment.color || '#8b5cf6' }"
        />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium">{{ segment.label }}</p>
          <p class="mt-1 text-xs text-muted">{{ segment.percent }} del total</p>
        </div>
        <span class="max-w-[50%] break-all text-sm font-bold tabular-nums">{{
          segment.formatted
        }}</span>
      </div>
      <p class="border-t border-default pt-3 text-sm">
        Total:
        <strong class="break-all tabular-nums">{{
          reportNumber(formattedTotal)
        }}</strong>
      </p>
    </div>
  </div>
</template>
