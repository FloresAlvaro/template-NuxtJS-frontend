<script setup lang="ts">
import type { CashRegisterApi, CashShiftApi } from '~/types/cash'
import { cashAmount } from '~/utils/cash'
const props = defineProps<{ registers: CashRegisterApi[] }>()
const emit = defineEmits<{ opened: [shift: CashShiftApi] }>()
const { user } = useAuth()
const registerId = ref<number | undefined>(
  props.registers.find((r) => r.isActive)?.registerId,
)
const openingAmount = ref('0.00')
const { pending, error, submission, locked, send } = useIdempotentRequest<{
  requestId: string
  registerId: number
  openingAmount: string
}>(`cash-open-${user.value?.userId}`, /^\/cash\/shifts$/)
watch(submission, (value) => {
  if (value) {
    registerId.value = value.body.registerId
    openingAmount.value = value.body.openingAmount
  }
})
onBeforeRouteLeave(() => !pending.value && !submission.value)
async function submit() {
  const result = await send<CashShiftApi>('/cash/shifts', () => {
    if (!registerId.value) throw new Error('Selecciona una caja')
    return {
      requestId: crypto.randomUUID(),
      registerId: registerId.value,
      openingAmount: cashAmount(openingAmount.value),
    }
  })
  if (result) emit('opened', result)
}
</script>
<template>
  <UCard
    ><template #header><h2 class="font-semibold">Abrir mi turno</h2></template>
    <form class="space-y-4" @submit.prevent="submit">
      <p class="text-sm text-muted">
        Cuenta el efectivo inicial antes de comenzar. Cada caja y cada usuario
        puede tener un solo turno abierto.
      </p>
      <UFormField label="Caja"
        ><USelect
          v-model="registerId"
          id="cash-open-register"
          :items="
            registers
              .filter((r) => r.isActive)
              .map((r) => ({ label: r.name, value: r.registerId }))
          "
          :disabled="locked"
          class="w-full"
      /></UFormField>
      <UFormField label="Efectivo inicial"
        ><UInput
          v-model="openingAmount"
          id="cash-opening-amount"
          inputmode="decimal"
          :disabled="locked"
          class="w-full"
      /></UFormField>
      <UAlert
        v-if="submission && !pending"
        color="warning"
        title="Apertura sin confirmar"
        description="Reintenta para confirmar el mismo turno sin duplicarlo."
      />
      <UAlert v-if="error" color="error" :title="error" />
      <UButton type="submit" :loading="pending" :disabled="!registerId">{{
        submission ? 'Reintentar apertura' : 'Abrir turno'
      }}</UButton>
    </form>
  </UCard>
</template>
