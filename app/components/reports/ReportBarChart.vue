<script setup lang="ts">
import type { ChartDatum } from '~/types/chart'
import { chartMaximum, chartRatio } from '~/utils/chart'
const props = withDefaults(
  defineProps<{
    data: ChartDatum[]
    orientation?: 'horizontal' | 'vertical'
    label: string
  }>(),
  { orientation: 'horizontal' },
)
const maximum = computed(() =>
  chartMaximum(props.data.map((item) => item.value)),
)
const verticalHeight = computed(
  () =>
    270 +
    Math.max(
      0,
      ...props.data.map((item) => Math.ceil((item.formatted.length - 16) / 10)),
    ) *
      16,
)
</script>
<template>
  <div
    v-if="orientation === 'horizontal'"
    role="group"
    :aria-label="label"
    class="space-y-4"
  >
    <div
      v-for="item in data"
      :key="item.key"
      :title="`${item.label}: ${item.formatted}${item.detail ? ` · ${item.detail}` : ''}`"
    >
      <div class="mb-1.5 flex items-start justify-between gap-4 text-sm">
        <span class="min-w-0 truncate font-medium">{{ item.label }}</span
        ><span class="shrink-0 font-semibold tabular-nums">{{
          item.formatted
        }}</span>
      </div>
      <div class="h-3 overflow-hidden rounded-full bg-elevated">
        <div
          class="h-full rounded-full"
          :style="{
            width: `${chartRatio(item.value, maximum) * 100}%`,
            background: item.color || '#8b5cf6',
          }"
        />
      </div>
    </div>
  </div>
  <div v-else role="group" :aria-label="label" class="overflow-x-auto pb-2">
    <div
      class="flex items-end gap-4 border-b border-default px-2 pt-4"
      :style="{
        minWidth: `${Math.max(280, data.length * 92)}px`,
        height: `${verticalHeight}px`,
      }"
    >
      <div
        v-for="item in data"
        :key="item.key"
        class="flex min-w-0 flex-1 flex-col items-center justify-end"
        :title="`${item.label}: ${item.formatted}${item.detail ? ` · ${item.detail}` : ''}`"
      >
        <span
          class="mb-2 max-w-full break-all text-center text-xs font-semibold tabular-nums"
          >{{ item.formatted }}</span
        >
        <div
          class="w-full max-w-14 rounded-t-lg"
          :style="{
            height: `${chartRatio(item.value, maximum) * 180}px`,
            background: item.color || '#8b5cf6',
          }"
        />
        <span
          class="mt-3 h-12 w-full line-clamp-2 break-words text-center text-xs text-muted"
          >{{ item.label }}</span
        >
      </div>
    </div>
  </div>
</template>
