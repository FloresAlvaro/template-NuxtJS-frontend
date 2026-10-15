<script setup lang="ts">
import type { PromotionApi, PromotionPage } from '~/types/promotion'
const selected = defineModel<PromotionApi | null>({ required: true })
const props = defineProps<{ disabled: boolean }>()
const { input, search } = useSearchText()
const page = ref(1)
watch(search, () => {
  page.value = 1
})
const { data, pending, error, refresh } = await useApiFetch<PromotionPage>(
  '/promotions',
  { query: { available: 'true', search, page, limit: 10 } },
)
const options = computed(() => [
  { label: 'Sin promoción', value: 0 },
  ...(data.value?.items ?? []).map((p) => ({
    label: p.code + ' · ' + p.name + ' · ' + p.percentBps / 100 + '%',
    value: p.promotionId,
  })),
  ...(selected.value &&
  !data.value?.items.some((p) => p.promotionId === selected.value?.promotionId)
    ? [
        {
          label:
            selected.value.code + ' · ' + selected.value.percentBps / 100 + '%',
          value: selected.value.promotionId,
        },
      ]
    : []),
])
const id = computed({
  get: () => selected.value?.promotionId ?? 0,
  set: (value: number) => {
    selected.value =
      value === 0
        ? null
        : (data.value?.items.find((p) => p.promotionId === value) ?? null)
  },
})
</script>
<template>
  <UCard
    ><template #header
      ><h2 class="font-semibold">Descuento y promoción</h2></template
    >
    <div class="space-y-3">
      <UFormField label="Buscar promoción"
        ><UInput
          id="sale-promotion-search"
          v-model="input"
          placeholder="Nombre o código"
          :disabled="props.disabled"
          :maxlength="150"
          class="w-full" /></UFormField
      ><UFormField label="Promoción disponible"
        ><USelect
          id="sale-promotion"
          v-model="id"
          :items="options"
          :disabled="props.disabled || pending"
          class="w-full"
      /></UFormField>
      <p v-if="selected" class="text-sm text-muted">
        Compra mínima: {{ selected.minSubtotal }} · Hasta
        {{ formatStoreDate(selected.endsAt) }}. Se valida nuevamente al
        registrar.
      </p>
      <UAlert
        v-if="error"
        color="warning"
        title="No se pudieron cargar las promociones"
        ><template #actions
          ><UButton
            color="neutral"
            variant="outline"
            :disabled="props.disabled"
            @click="refresh()"
            >Reintentar</UButton
          ></template
        ></UAlert
      ><ListPagination
        v-if="data && data.total > 10"
        v-model="page"
        :total="data.total"
        :limit="10"
        :pending="pending || props.disabled"
        label="promociones"
      /></div
  ></UCard>
</template>
