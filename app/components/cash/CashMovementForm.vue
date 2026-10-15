<script setup lang="ts">
import type { CashShiftApi } from '~/types/cash'
import { cashAmount } from '~/utils/cash'
const props = defineProps<{ shift: CashShiftApi }>()
const emit = defineEmits<{ changed: [] }>()
const { user } = useAuth()
const action = ref('CASH_IN'),
  amount = ref(''),
  reason = ref(''),
  confirmed = ref(false),
  message = ref('')
type Body = {
  requestId: string
  reason: string
  kind?: string
  amount?: string
  countedAmount?: string
  expectedLastMovementId?: number
}
const { pending, error, submission, locked, send } = useIdempotentRequest<Body>(
  `cash-operation-${user.value?.userId}-${props.shift.shiftId}`,
  new RegExp('^/cash/shifts/' + props.shift.shiftId + '/(movements|close)$'),
)
watch(submission, (value) => {
  if (value) {
    action.value = value.path.endsWith('/close')
      ? 'CLOSE'
      : (value.body.kind ?? 'CASH_IN')
    amount.value = value.body.amount ?? value.body.countedAmount ?? ''
    reason.value = value.body.reason
  }
})
watch(action, () => {
  confirmed.value = false
  message.value = ''
  error.value = ''
})
onBeforeRouteLeave(() => !pending.value && !submission.value)
async function submit() {
  message.value = ''
  const result = await send<unknown>(
    '/cash/shifts/' +
      props.shift.shiftId +
      (action.value === 'CLOSE' ? '/close' : '/movements'),
    () => {
      if (!confirmed.value) throw new Error('Confirma la operación')
      if (reason.value.trim().length < 3)
        throw new Error('Escribe un motivo de al menos 3 caracteres')
      const base = {
        requestId: crypto.randomUUID(),
        reason: reason.value.trim(),
      }
      if (action.value === 'CLOSE') {
        if (!props.shift.summary)
          throw new Error('Actualiza el resumen antes de cerrar')
        return {
          ...base,
          countedAmount: cashAmount(amount.value),
          expectedLastMovementId: props.shift.summary.lastMovementId,
        }
      }
      return { ...base, kind: action.value, amount: cashAmount(amount.value) }
    },
  )
  if (result) {
    message.value = 'Operación registrada'
    amount.value = ''
    reason.value = ''
    confirmed.value = false
    emit('changed')
  }
}
</script>
<template>
  <UCard
    ><template #header><h2 class="font-semibold">Operar mi turno</h2></template>
    <form class="space-y-4" @submit.prevent="submit">
      <div class="grid gap-4 sm:grid-cols-2">
        <UFormField label="Operación"
          ><USelect
            v-model="action"
            :id="'cash-action-' + shift.shiftId"
            :items="[
              { label: 'Ingreso de efectivo', value: 'CASH_IN' },
              { label: 'Retiro de efectivo', value: 'CASH_OUT' },
              { label: 'Cerrar turno', value: 'CLOSE' },
            ]"
            :disabled="locked"
            class="w-full" /></UFormField
        ><UFormField
          :label="action === 'CLOSE' ? 'Efectivo contado' : 'Importe'"
          ><UInput
            v-model="amount"
            :id="'cash-amount-' + shift.shiftId"
            inputmode="decimal"
            placeholder="0.00"
            :disabled="locked"
            class="w-full"
        /></UFormField>
      </div>
      <UAlert
        v-if="action === 'CLOSE'"
        color="warning"
        title="Arqueo y cierre definitivo"
        :description="
          'Cuenta únicamente el efectivo. Esperado: ' +
          shift.summary?.expectedAmount +
          '. Se guardará la diferencia y el turno quedará cerrado.'
        "
      />
      <p v-else class="text-sm text-muted">
        Los cobros y reembolsos se registran desde la venta. Usa esta opción
        para otros ingresos o retiros de efectivo.
      </p>
      <UFormField label="Motivo"
        ><UTextarea
          v-model="reason"
          :id="'cash-reason-' + shift.shiftId"
          :maxlength="500"
          :disabled="locked"
          class="w-full"
      /></UFormField>
      <UCheckbox
        :key="action"
        v-model="confirmed"
        :disabled="locked"
        :label="
          action === 'CLOSE'
            ? 'Confirmo el efectivo contado y el cierre del turno'
            : 'Confirmo que este efectivo ya ingresó o salió de la caja'
        "
      />
      <UAlert
        v-if="submission && !pending"
        color="warning"
        title="Resultado sin confirmar"
        description="Reintenta la misma operación. Los datos se conservan para evitar duplicados."
      />
      <UAlert v-if="error" color="error" :title="error" /><UAlert
        v-if="message"
        color="success"
        :title="message"
      />
      <UButton
        type="submit"
        :loading="pending"
        :disabled="!confirmed && !submission"
        >{{
          submission
            ? 'Reintentar operación'
            : action === 'CLOSE'
              ? 'Cerrar turno'
              : 'Registrar movimiento'
        }}</UButton
      >
    </form></UCard
  >
</template>
