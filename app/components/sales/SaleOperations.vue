<script setup lang="ts">
import type { SaleApi, SaleOperationApi } from '~/types/sale'
import type { TableColumn } from '@nuxt/ui'
import { apiErrorStatus } from '~/utils/api-error'
import { moneyCents } from '~/utils/money'
const props = defineProps<{ sale: SaleApi }>()
const emit = defineEmits<{ updated: [sale: SaleApi] }>()
const api = useApi()
const { isAdmin } = useAuth()
const { pending, error, run } = useAsyncAction()
type Action = 'payments' | 'refunds' | 'returns' | 'cancel'
const action = ref<Action>('payments')
const amount = ref('')
const reason = ref('')
const method = ref('CASH')
const confirmed = ref(false)
const quantities = ref<Record<number, string | number>>({})
const submitted = ref<{ path: string; body: Record<string, unknown> } | null>(
  null,
)
const message = ref('')
// Preserve the request identifier if a reload follows a lost response.
const storageKey = `sale-operation-${props.sale.saleId}`
onMounted(() => {
  try {
    const stored = sessionStorage.getItem(storageKey)
    if (!stored) return
    const saved = JSON.parse(stored) as {
      path?: string
      body?: Record<string, unknown>
    }
    const savedAction = saved.path?.split('/').at(-1)
    if (
      !saved.path ||
      !saved.body ||
      !['payments', 'refunds', 'returns', 'cancel'].includes(
        savedAction ?? '',
      ) ||
      saved.path !== `/sales/${props.sale.saleId}/${savedAction}` ||
      typeof saved.body.requestId !== 'string'
    )
      return
    action.value = savedAction as Action
    submitted.value = { path: saved.path, body: saved.body }
    reason.value = String(saved.body.reason ?? '')
    amount.value = String(saved.body.amount ?? '')
    method.value = String(saved.body.method ?? 'CASH')
  } catch {
    /* In-memory retries still work when storage is unavailable. */
  }
})
watch(
  submitted,
  (value) => {
    if (!import.meta.client) return
    try {
      if (value) sessionStorage.setItem(storageKey, JSON.stringify(value))
      else sessionStorage.removeItem(storageKey)
    } catch {
      /* Storage can be disabled by the browser. */
    }
  },
  { flush: 'sync' },
)
const locked = computed(() => pending.value || !!submitted.value)
const options = computed(() => [
  ...(moneyCents(props.sale.balanceDue) > 0n &&
  props.sale.status !== 'CANCELLED'
    ? [{ label: 'Registrar cobro', value: 'payments' }]
    : []),
  ...(isAdmin.value
    ? [
        ...(moneyCents(props.sale.refundDue) > 0n
          ? [{ label: 'Registrar reembolso', value: 'refunds' }]
          : []),
        ...(['ACTIVE', 'PARTIALLY_RETURNED'].includes(props.sale.status)
          ? [
              { label: 'Devolver productos', value: 'returns' },
              { label: 'Anular venta', value: 'cancel' },
            ]
          : []),
      ]
    : []),
])
watch(
  options,
  (values) => {
    if (
      !submitted.value &&
      !values.some((value) => value.value === action.value)
    )
      action.value = (values[0]?.value ?? 'payments') as Action
  },
  { immediate: true },
)
watch(action, () => {
  confirmed.value = false
  error.value = ''
})
onBeforeRouteLeave(() => !locked.value)
const columns: TableColumn<SaleOperationApi>[] = [
  {
    accessorKey: 'kind',
    header: 'Operación',
    cell: ({ row }) => saleOperationLabels[row.original.kind],
  },
  { accessorKey: 'amount', header: 'Importe' },
  {
    accessorKey: 'method',
    header: 'Método',
    cell: ({ row }) =>
      row.original.method ? paymentMethodLabels[row.original.method] : '—',
  },
  { accessorKey: 'reason', header: 'Motivo / referencia' },
  { accessorKey: 'userName', header: 'Registrado por' },
  {
    accessorKey: 'createdAt',
    header: 'Fecha',
    cell: ({ row }) =>
      formatStoreDate(row.original.createdAt),
  },
  { id: 'items', header: 'Productos repuestos' },
]
async function submit() {
  message.value = ''
  await run(async () => {
    if (!submitted.value) {
      if (!confirmed.value)
        throw new Error('Confirma la operación antes de continuar')
      if (reason.value.trim().length < 3)
        throw new Error('Escribe un motivo de al menos 3 caracteres')
      const body: Record<string, unknown> = {
        requestId: crypto.randomUUID(),
        reason: reason.value.trim(),
      }
      if (action.value === 'payments' || action.value === 'refunds') {
        const value = amount.value.trim()
        if (!/^(0|[1-9]\d{0,15})(\.\d{1,2})?$/.test(value))
          throw new Error('Introduce un importe válido con hasta dos decimales')
        const [whole, fraction = ''] = value.split('.')
        body.amount = `${whole}.${fraction.padEnd(2, '0')}`
        if (moneyCents(body.amount as string) <= 0n)
          throw new Error('El importe debe ser mayor que cero')
        body.method = method.value
      }
      if (action.value === 'returns') {
        body.items = props.sale.items
          .filter(
            (item) =>
              String(quantities.value[item.saleItemId] ?? '').trim() !== '' &&
              Number(quantities.value[item.saleItemId]) !== 0,
          )
          .map((item) => {
            const quantity = Number(quantities.value[item.saleItemId])
            if (
              !Number.isSafeInteger(quantity) ||
              quantity < 1 ||
              quantity > item.quantity - item.returnedQuantity
            )
              throw new Error(`Cantidad inválida para ${item.productName}`)
            return { saleItemId: item.saleItemId, quantity }
          })
        if (!(body.items as unknown[]).length)
          throw new Error('Selecciona al menos un producto para devolver')
      }
      submitted.value = {
        path: `/sales/${props.sale.saleId}/${action.value}`,
        body,
      }
    }
    try {
      const sale = await api<SaleApi>(submitted.value.path, {
        method: 'POST',
        body: submitted.value.body,
      })
      submitted.value = null
      reason.value = ''
      amount.value = ''
      quantities.value = {}
      confirmed.value = false
      emit('updated', sale)
      message.value = 'Operación registrada correctamente'
    } catch (cause) {
      const status = apiErrorStatus(cause)
      if (status && status >= 400 && status < 500) submitted.value = null
      throw cause
    }
  }, 'No se pudo registrar la operación')
}
</script>
<template>
  <section class="space-y-4">
    <UAlert
      v-if="sale.refundDue !== '0.00'"
      color="warning"
      title="Reembolso pendiente"
      :description="`Debes devolver ${sale.refundDue} al cliente y registrar el reembolso.`"
    />
    <UCard v-if="options.length || submitted">
      <template #header
        ><h2 class="flex items-center gap-2 font-semibold"><UIcon name="i-lucide-wallet" class="size-5 text-primary" />Gestionar venta</h2></template
      >
      <form class="space-y-4" @submit.prevent="submit">
        <UFormField label="Operación"
          ><USelect
            v-model="action"
            :items="options"
            :disabled="locked"
            class="w-full"
        /></UFormField>
        <div
          v-if="action === 'payments' || action === 'refunds'"
          class="grid sm:grid-cols-2 gap-4"
        >
          <UFormField label="Importe"
            ><UInput
              v-model="amount"
              inputmode="decimal"
              placeholder="0.00"
              :disabled="locked"
              class="w-full"
          /></UFormField>
          <UFormField label="Método"
            ><USelect
              v-model="method"
              :items="
                Object.entries(paymentMethodLabels).map(([value, label]) => ({
                  value,
                  label,
                }))
              "
              :disabled="locked"
              class="w-full"
          /></UFormField>
        </div>
        <div v-if="action === 'returns'" class="space-y-3">
          <p>
            La devolución repone stock y reduce el total vigente usando el
            precio original.
          </p>
          <UFormField
            v-for="item in sale.items.filter(
              (item) => item.quantity > item.returnedQuantity,
            )"
            :key="item.saleItemId"
            :label="`${item.productName} (${item.sku}) · Máximo ${item.quantity - item.returnedQuantity}`"
          >
            <UInput
              v-model="quantities[item.saleItemId]"
              type="number"
              :min="0"
              :max="item.quantity - item.returnedQuantity"
              :step="1"
              :disabled="locked"
              placeholder="0"
            />
          </UFormField>
        </div>
        <UAlert
          v-if="action === 'cancel'"
          color="warning"
          title="Anulación definitiva"
          description="Se repondrán los productos aún no devueltos. Los cobros existentes quedarán pendientes de reembolso."
        />
        <UFormField label="Motivo / referencia"
          ><UTextarea
            v-model="reason"
            :maxlength="500"
            :disabled="locked"
            class="w-full"
        /></UFormField>
        <UCheckbox
          :key="action"
          v-model="confirmed"
          :disabled="locked"
          :label="
            action === 'payments' || action === 'refunds'
              ? 'Confirmo que el dinero ya fue cobrado o reembolsado por el método indicado'
              : 'Confirmo la operación y la reposición de los productos al inventario'
          "
        />
        <UAlert
          v-if="submitted && !pending"
          color="warning"
          title="Respuesta sin confirmar"
          description="Reintenta la misma operación para consultar o completar su registro sin duplicarla. Los campos permanecen bloqueados hasta confirmar el resultado."
        />
        <UAlert v-if="error" color="error" :title="error" />
        <UButton
          type="submit"
          :loading="pending"
          :disabled="!confirmed && !submitted"
          >{{
            submitted ? 'Reintentar operación' : 'Registrar operación'
          }}</UButton
        >
      </form>
      <p class="mt-3 text-sm text-muted">
        Registro manual: esta pantalla no procesa transacciones bancarias ni
        pagos con tarjeta.
      </p>
    </UCard>
    <UAlert v-if="message" color="success" :title="message" />
    <div><h2 class="text-lg font-bold">Historial de operaciones</h2><p class="mt-1 text-sm text-muted">Cobros, reembolsos y reposiciones registrados para esta venta.</p></div>
    <GenericTable
      v-if="sale.operations.length"
      :data="sale.operations"
      :columns="columns"
    >
      <template #items="{ row }"
        ><span>{{
          row.original.items
            .map(
              (line) =>
                `${sale.items.find((item) => item.saleItemId === line.saleItemId)?.sku ?? line.saleItemId}: ${line.quantity}`,
            )
            .join(', ') || '—'
        }}</span></template
      >
    </GenericTable>
    <div v-else class="rounded-2xl border border-dashed border-default p-6 text-sm text-muted">Esta venta aún no tiene cobros, devoluciones ni anulaciones.</div>
  </section>
</template>
