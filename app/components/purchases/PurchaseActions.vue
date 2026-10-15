<script setup lang="ts">
import type { PurchaseApi } from '~/types/purchase'
const props = defineProps<{ purchase: PurchaseApi }>()
const emit = defineEmits<{ updated: [] }>()
const { user } = useAuth()
const toast = useAppToast()
const selected = ref<'receive' | 'cancel' | null>(null),
  reason = ref(''),
  updateCost = ref(false),
  confirmed = ref(false)
type Body = { requestId: string; reason: string; updateCost?: boolean }
const request = useIdempotentRequest<Body>(
  `purchase-action-${user.value?.userId}-${props.purchase.purchaseId}`,
  new RegExp(`^/purchases/${props.purchase.purchaseId}/(receive|cancel)$`),
)
const { pending, locked, error, submission } = request
const operation = computed(() =>
  submission.value?.path.endsWith('/receive')
    ? 'receive'
    : submission.value
      ? 'cancel'
      : selected.value,
)
function choose(value: 'receive' | 'cancel') {
  selected.value = value
  confirmed.value = false
  error.value = ''
}
function close() {
  selected.value = null
}
async function submit() {
  if (
    !submission.value &&
    (!operation.value || !confirmed.value || reason.value.trim().length < 3)
  )
    return
  const result = await request.send<PurchaseApi>(
    `/purchases/${props.purchase.purchaseId}/${operation.value}`,
    () => ({
      requestId: crypto.randomUUID(),
      reason: reason.value.trim(),
      ...(operation.value === 'receive'
        ? { updateCost: updateCost.value }
        : {}),
    }),
  )
  if (result) {
    selected.value = null
    confirmed.value = false
    reason.value = ''
    toast.success(
      result.status === 'RECEIVED'
        ? 'Compra recibida e inventario actualizado'
        : 'Compra cancelada',
    )
    emit('updated')
  }
}
onBeforeRouteLeave(() => !pending.value && !submission.value)
</script>
<template>
  <section class="space-y-3">
    <div
      v-if="purchase.status === 'PENDING' && !submission"
      class="flex flex-wrap gap-2"
    >
      <UButton
        icon="i-lucide-package-check"
        :disabled="locked"
        @click="choose('receive')"
        >Recibir mercadería</UButton
      ><UButton
        color="warning"
        variant="outline"
        :disabled="locked"
        @click="choose('cancel')"
        >Cancelar compra</UButton
      >
    </div>
    <form
      v-if="operation"
      class="space-y-3 rounded-2xl border border-default p-4"
      @submit.prevent="submit"
    >
      <h2 class="font-semibold">
        {{
          operation === 'receive'
            ? 'Confirmar recepción completa'
            : 'Cancelar compra pendiente'
        }}
      </h2>
      <p class="text-sm text-muted">
        {{
          operation === 'receive'
            ? 'Se añadirán todas las unidades al inventario y se registrará cada entrada. Confirma solo después de comprobar la mercadería recibida.'
            : 'Se conservará la compra como cancelada y el inventario no cambiará.'
        }}
      </p>
      <UAlert
        v-if="submission"
        color="warning"
        title="Resultado por confirmar"
        description="Reintenta la misma operación. Su contenido original se conserva para evitar entradas duplicadas."
      />
      <UAlert v-if="error" color="error" :title="error" />
      <UFormField label="Motivo o nota de recepción" required
        ><UTextarea
          v-model="reason"
          :minlength="3"
          :maxlength="500"
          :disabled="locked"
          class="w-full"
      /></UFormField>
      <UCheckbox
        v-if="operation === 'receive'"
        v-model="updateCost"
        label="Actualizar el costo actual de los productos con el costo de esta compra"
        :disabled="locked"
      />
      <p v-if="operation === 'receive'" class="text-sm text-muted">
        El precio de venta se conserva. La recepción no registra un pago al
        proveedor.
      </p>
      <UCheckbox
        v-model="confirmed"
        label="He revisado los datos y confirmo la operación"
        :disabled="locked"
      />
      <div class="flex flex-wrap gap-2">
        <UButton
          type="submit"
          :color="operation === 'cancel' ? 'warning' : 'primary'"
          :loading="pending"
          :disabled="
            pending ||
            (!submission && (!confirmed || reason.trim().length < 3 || locked))
          "
          >{{ submission ? 'Reintentar operación' : 'Confirmar' }}</UButton
        ><UButton
          v-if="!submission"
          color="neutral"
          variant="ghost"
          :disabled="pending"
          @click="close"
          >Volver</UButton
        >
      </div>
    </form>
  </section>
</template>
