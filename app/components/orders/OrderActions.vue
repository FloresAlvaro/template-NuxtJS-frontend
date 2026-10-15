<script setup lang="ts">
import type { OrderApi } from '~/types/order'
const props = defineProps<{ order: OrderApi }>()
const emit = defineEmits<{ updated: [order: OrderApi]; refresh: [] }>()
const { isStaff, user } = useAuth()
type Action = keyof typeof orderActionLabels
const selected = ref<Action | null>(null)
const reason = ref('')
const confirmed = ref(false)
const request = useIdempotentRequest<{ requestId: string; reason: string }>(
  `order-action-${user.value?.userId}-${props.order.orderId}`,
)
const { locked, pending, error, submission } = request
const actions = computed<Action[]>(() => {
  if (props.order.status === 'PENDING')
    return isStaff.value ? ['confirm', 'cancel'] : ['cancel']
  if (
    !isStaff.value ||
    props.order.sale?.status === 'CANCELLED' ||
    props.order.sale?.status === 'RETURNED'
  )
    return []
  if (props.order.status === 'CONFIRMED') return ['ready']
  if (props.order.status === 'READY' && props.order.sale?.balanceDue === '0.00')
    return ['complete']
  return []
})
const operation = computed(
  () =>
    (submission.value?.path.split('/').at(-1) as Action | undefined) ??
    selected.value,
)
function choose(action: Action) {
  selected.value = action
  confirmed.value = false
  error.value = ''
}
async function submit() {
  if (
    !submission.value &&
    (!selected.value || !confirmed.value || reason.value.trim().length < 3)
  )
    return
  const result = await request.send<OrderApi>(
    `/orders/${props.order.orderId}/${operation.value}`,
    () => ({ requestId: crypto.randomUUID(), reason: reason.value.trim() }),
  )
  if (result) {
    emit('updated', result)
    selected.value = null
    confirmed.value = false
    reason.value = ''
  }
}
onBeforeRouteLeave(() => !pending.value && !submission.value)
</script>
<template>
  <section class="space-y-3">
    <UAlert
      v-if="order.status === 'READY' && order.sale?.balanceDue !== '0.00'"
      color="warning"
      title="Falta completar el cobro antes de entregar el pedido"
    />
    <div class="flex flex-wrap gap-2">
      <UButton
        v-for="action in actions"
        :key="action"
        :disabled="locked"
        :color="action === 'cancel' ? 'warning' : 'primary'"
        @click="choose(action)"
        >{{ orderActionLabels[action] }}</UButton
      >
    </div>
    <form
      v-if="operation"
      class="space-y-3 border border-default rounded-lg p-4"
      @submit.prevent="submit"
    >
      <h2 class="font-semibold">{{ orderActionLabels[operation] }}</h2>
      <p v-if="operation === 'confirm'">
        Se convertirá la reserva en una venta y se descontará el stock físico.
      </p>
      <p v-if="operation === 'cancel'">
        Se liberará la reserva de este pedido pendiente.
      </p>
      <UFormField label="Motivo"
        ><UTextarea
          v-model="reason"
          :maxlength="500"
          :disabled="locked"
          class="w-full"
      /></UFormField>
      <UCheckbox
        v-model="confirmed"
        :disabled="locked"
        label="Confirmo esta operación"
      />
      <UAlert
        v-if="submission"
        color="warning"
        title="Respuesta pendiente de confirmar"
        description="Reintenta para consultar o completar la misma operación sin duplicarla."
      />
      <UAlert v-if="error" color="error" :title="error" />
      <div class="flex gap-2">
        <UButton
          type="submit"
          :loading="pending"
          :disabled="!submission && (!confirmed || reason.trim().length < 3)"
          >{{
            submission ? 'Reintentar operación' : 'Confirmar operación'
          }}</UButton
        ><UButton
          v-if="!locked"
          variant="outline"
          color="neutral"
          @click="
            () => {
              selected = null
            }
          "
          >Volver</UButton
        >
      </div>
    </form>
    <p
      v-if="isStaff && ['CONFIRMED', 'READY'].includes(order.status)"
      class="text-sm text-muted"
    >
      Para anular después de confirmar, un administrador debe abrir la venta y
      registrar su anulación.
    </p>
  </section>
</template>
