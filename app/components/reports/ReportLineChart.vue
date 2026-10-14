<script setup lang="ts">
import type { ChartDatum } from '~/types/chart'
import { chartMaximum, chartRatio, chartMoneyTick } from '~/utils/chart'
const props = defineProps<{ data: ChartDatum[]; label: string }>()
const selected = ref(0)
const sliderId = useId()
const maximum = computed(() =>
  chartMaximum(props.data.map((item) => item.value)),
)
const points = computed(() =>
  props.data.map((item, index) => ({
    ...item,
    x:
      props.data.length === 1
        ? 385
        : 75 + (index / (props.data.length - 1)) * 620,
    y: 190 - chartRatio(item.value, maximum.value) * 155,
  })),
)
const line = computed(() =>
  points.value
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`)
    .join(' '),
)
const area = computed(() =>
  points.value.length
    ? `${line.value} L${points.value[points.value.length - 1]?.x},190 L${points.value[0]?.x},190 Z`
    : '',
)
const current = computed(
  () =>
    points.value[
      Math.min(Number(selected.value), Math.max(0, points.value.length - 1))
    ],
)
const ticks = computed(() =>
  [
    ...new Set([
      0,
      Math.floor((props.data.length - 1) / 2),
      props.data.length - 1,
    ]),
  ]
    .filter((index) => index >= 0)
    .map((index) => points.value[index])
    .filter((point) => point !== undefined),
)
</script>
<template>
  <div class="space-y-3">
    <div class="overflow-x-auto">
      <svg
        viewBox="0 0 730 235"
        role="img"
        :aria-label="label"
        class="w-full min-w-[640px]"
      >
        <title>{{ label }}</title>
        <g v-for="step in [0, 1, 2, 3, 4]" :key="step">
          <line
            x1="75"
            x2="695"
            :y1="190 - (step * 155) / 4"
            :y2="190 - (step * 155) / 4"
            stroke="currentColor"
            class="text-muted/15"
            stroke-dasharray="4 4"
          />
          <text
            x="65"
            :y="194 - (step * 155) / 4"
            text-anchor="end"
            fill="currentColor"
            class="text-muted"
            font-size="11"
          >
            {{ chartMoneyTick((maximum * BigInt(step)) / 4n) }}
          </text>
        </g>
        <path :d="area" fill="#8b5cf6" opacity="0.12" />
        <path
          :d="line"
          fill="none"
          stroke="#8b5cf6"
          stroke-width="3"
          stroke-linejoin="round"
        />
        <circle
          v-for="(point, index) in points"
          :key="point.key"
          :cx="point.x"
          :cy="point.y"
          r="8"
          fill="transparent"
          @pointerenter="selected = index"
        >
          <title>{{ point.label }}: {{ point.formatted }}</title>
        </circle>
        <circle
          v-if="current"
          :cx="current.x"
          :cy="current.y"
          r="5"
          fill="#8b5cf6"
          stroke="var(--ui-bg)"
          stroke-width="2"
        />
        <text
          v-for="tick in ticks"
          :key="tick.key"
          :x="tick.x"
          y="220"
          text-anchor="middle"
          fill="currentColor"
          class="text-muted"
          font-size="11"
        >
          {{ tick.label }}
        </text>
      </svg>
    </div>
    <p class="text-xs text-muted sm:hidden">
      Desliza el gráfico horizontalmente o usa el selector para consultar cada
      fecha.
    </p>
    <div
      v-if="current"
      class="rounded-xl bg-elevated/60 p-3 flex flex-wrap items-center justify-between gap-2 text-sm"
    >
      <span
        >{{ current.label }}
        <span class="text-muted">{{ current.detail }}</span></span
      ><strong class="break-all tabular-nums">{{ current.formatted }}</strong>
    </div>
    <div v-if="data.length > 1">
      <label :for="sliderId" class="text-xs text-muted"
        >Selecciona un punto para consultar su importe exacto</label
      ><input
        :id="sliderId"
        v-model="selected"
        type="range"
        min="0"
        :max="data.length - 1"
        step="1"
        :aria-valuetext="
          current ? `${current.label}: ${current.formatted}` : undefined
        "
        class="mt-2 w-full accent-violet-600"
      />
    </div>
  </div>
</template>
