<script setup lang="ts">
import type { PromotionApi } from '~/types/promotion'
import { storeDateInput, storeInputToIso } from '~/utils/promotion'
import { cashAmount } from '~/utils/cash'
const props = defineProps<{ promotion: PromotionApi | null }>()
const emit = defineEmits<{ saved: []; busy: [value: boolean] }>()
const api = useApi()
const { pending, error, run } = useAsyncAction()
const form = reactive({
  code: props.promotion?.code ?? '',
  name: props.promotion?.name ?? '',
  percentage: props.promotion ? String(props.promotion.percentBps / 100) : '',
  startsAt: props.promotion ? storeDateInput(props.promotion.startsAt) : '',
  endsAt: props.promotion ? storeDateInput(props.promotion.endsAt) : '',
  isActive: props.promotion?.isActive ?? true,
  allowSeller: props.promotion?.allowSeller ?? false,
  minSubtotal: props.promotion?.minSubtotal ?? '0.00',
})
watch(pending, (value) => emit('busy', value))
async function submit() {
  await run(async () => {
    if (!/^(\d{1,3})(\.\d{1,2})?$/.test(form.percentage))
      throw new Error('Introduce un porcentaje entre 0.01 y 100')
    const [whole, fraction = ''] = form.percentage.split('.')
    const percentBps = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
    if (percentBps < 1 || percentBps > 10000)
      throw new Error('Introduce un porcentaje entre 0.01 y 100')
    const body = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      percentBps,
      startsAt: storeInputToIso(form.startsAt),
      endsAt: storeInputToIso(form.endsAt),
      isActive: form.isActive,
      allowSeller: form.allowSeller,
      minSubtotal: cashAmount(form.minSubtotal),
    }
    if (!/^[A-Z0-9_-]{3,40}$/.test(body.code))
      throw new Error(
        'El código debe tener entre 3 y 40 letras, números, guiones o guiones bajos',
      )
    if (body.name.length < 3)
      throw new Error('Escribe un nombre de al menos 3 caracteres')
    if (body.endsAt <= body.startsAt)
      throw new Error('El fin debe ser posterior al inicio')
    await api(
      props.promotion
        ? '/promotions/' + props.promotion.promotionId
        : '/promotions',
      { method: props.promotion ? 'PATCH' : 'POST', body },
    )
    emit('saved')
  }, 'No se pudo guardar la promoción')
}
</script>
<template>
  <form class="space-y-4" @submit.prevent="submit">
    <p class="text-sm text-muted">
      Una promoción por venta. El descuento se redondea a centavos por unidad y
      el servidor valida el total.
    </p>
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField label="Código"
        ><UInput
          id="promotion-code"
          v-model="form.code"
          :maxlength="40"
          :disabled="pending"
          placeholder="VERANO10"
          class="w-full" /></UFormField
      ><UFormField label="Nombre"
        ><UInput
          id="promotion-name"
          v-model="form.name"
          :maxlength="150"
          :disabled="pending"
          class="w-full" /></UFormField
      ><UFormField label="Descuento (%)"
        ><UInput
          id="promotion-percent"
          v-model="form.percentage"
          inputmode="decimal"
          :disabled="pending"
          placeholder="10.00"
          class="w-full" /></UFormField
      ><UFormField label="Compra mínima"
        ><UInput
          id="promotion-minimum"
          v-model="form.minSubtotal"
          inputmode="decimal"
          :disabled="pending"
          class="w-full" /></UFormField
      ><UFormField label="Inicio (hora de La Paz)"
        ><UInput
          id="promotion-start"
          v-model="form.startsAt"
          type="datetime-local"
          :disabled="pending"
          class="w-full" /></UFormField
      ><UFormField label="Fin (hora de La Paz)"
        ><UInput
          id="promotion-end"
          v-model="form.endsAt"
          type="datetime-local"
          :disabled="pending"
          class="w-full"
      /></UFormField>
    </div>
    <UCheckbox
      v-model="form.isActive"
      label="Promoción activa"
      :disabled="pending"
    /><UCheckbox
      v-model="form.allowSeller"
      label="Permitir que los vendedores apliquen esta promoción"
      :disabled="pending"
    />
    <UAlert v-if="error" color="error" :title="error" /><UButton
      type="submit"
      :loading="pending"
      >Guardar promoción</UButton
    >
  </form>
</template>
