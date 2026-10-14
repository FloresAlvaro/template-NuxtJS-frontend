<script setup lang="ts">
import type { ProductApi } from '~/types/product'
import type { InventoryApi, MovementType, StockMovementPage } from '~/types/inventory'

const props = defineProps<{ product: ProductApi }>()
const emit = defineEmits<{ changed: []; busy: [value: boolean] }>()
const auth = useAuth()
const api = useApi()
const toast = useAppToast()
const { getApiErrorMessage } = useApiErrorMessage()
const base = `/products/${props.product.productId}/inventory`
const page = ref(1)
const { data: inventory, pending, error, refresh } = await useApiFetch<InventoryApi>(base)
const {
  data: history,
  pending: historyPending,
  error: historyError,
  refresh: refreshHistory,
} = await useApiFetch<StockMovementPage>(`${base}/movements`, {
  query: { page, limit: 10 },
})
const minStock = ref(String(inventory.value?.minStock ?? 0))
watch(inventory, (value) => {
  if (value) minStock.value = String(value.minStock)
})
const form = reactive({
  type: 'ENTRY' as MovementType,
  quantity: '',
  reason: '',
})
const labels: Record<MovementType, string> = {
  ENTRY: 'Entrada',
  EXIT: 'Salida',
  ADJUSTMENT: 'Ajuste por conteo',
}
const { pending: saving, error: saveError, run } = useAsyncAction()
watch(saving, (value) => emit('busy', value))
const integer = (value: string) =>
  /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) && Number(value) <= 2147483647
const valid = computed(
  () =>
    integer(form.quantity) &&
    (form.type === 'ADJUSTMENT' || Number(form.quantity) > 0) &&
    form.reason.trim().length >= 3 &&
    form.reason.trim().length <= 500,
)
async function reload() {
  await Promise.all([refresh(), refreshHistory()])
}
async function move() {
  if (!valid.value || !inventory.value || error.value || pending.value) return
  await run(async () => {
    await api(`${base}/movements`, {
      method: 'POST',
      body: {
        type: form.type,
        quantity: Number(form.quantity),
        reason: form.reason.trim(),
        expectedQuantity: inventory.value!.quantity,
      },
    })
    form.quantity = ''
    form.reason = ''
    page.value = 1
    toast.success('Movimiento registrado')
    emit('changed')
    await reload()
  }, 'No se pudo registrar el movimiento. Actualiza el stock antes de reintentar.')
}
async function saveMinimum() {
  if (!integer(minStock.value)) return
  await run(async () => {
    await api(base, {
      method: 'PATCH',
      body: { minStock: Number(minStock.value) },
    })
    toast.success('Stock mínimo actualizado')
    emit('changed')
    await refresh()
  }, 'No se pudo guardar el stock mínimo')
}
</script>

<template>
  <div class="space-y-5">
    <p class="text-sm text-muted">{{ product.name }} · {{ product.sku }}</p>
    <p v-if="pending" role="status">Cargando inventario...</p>
    <UAlert
      v-else-if="error"
      color="error"
      :title="getApiErrorMessage(error, 'No se pudo consultar el inventario')"
    />
    <div v-else-if="inventory" class="flex flex-wrap items-center gap-3">
      <p class="font-semibold">Stock físico: {{ inventory.quantity }}</p>
      <p>Reservado: {{ inventory.reservedQuantity }}</p>
      <p class="text-lg font-semibold">Disponible para venta: {{ inventory.availableQuantity }}</p>
      <UBadge
        :color="
          inventory.quantity === 0
            ? 'error'
            : inventory.quantity <= inventory.minStock
              ? 'warning'
              : 'success'
        "
      >
        {{
          inventory.quantity === 0
            ? 'Agotado'
            : inventory.quantity <= inventory.minStock
              ? 'Stock bajo'
              : 'Disponible'
        }}
      </UBadge>
      <p class="text-sm">Stock mínimo: {{ inventory.minStock }}</p>
    </div>
    <UButton
      color="neutral"
      variant="outline"
      icon="i-lucide-refresh-cw"
      :disabled="saving || pending || historyPending"
      @click="reload"
      >Actualizar</UButton
    >
    <UAlert v-if="saveError" color="error" :title="saveError" />
    <template v-if="auth.isAdmin.value && inventory && !error">
      <form class="space-y-3 border-t border-default pt-4" @submit.prevent="move">
        <h3 class="font-semibold">Registrar movimiento</h3>
        <UFormField label="Tipo de movimiento">
          <select
            v-model="form.type"
            :disabled="saving"
            class="w-full h-10 rounded-md border border-default bg-default px-3"
          >
            <option v-for="(label, type) in labels" :key="type" :value="type">
              {{ label }}
            </option>
          </select>
        </UFormField>
        <UFormField
          :label="form.type === 'ADJUSTMENT' ? 'Cantidad final contada' : 'Unidades'"
          :help="
            form.type === 'ADJUSTMENT'
              ? 'Reemplaza el stock actual por el conteo físico; puede ser cero.'
              : 'Ingresa una cantidad mayor que cero.'
          "
          required
        >
          <UInput v-model="form.quantity" inputmode="numeric" :disabled="saving" class="w-full" />
        </UFormField>
        <UFormField
          label="Motivo"
          help="Ejemplo: recepción de mercadería, devolución o corrección de conteo."
          required
        >
          <UTextarea v-model="form.reason" :maxlength="500" :disabled="saving" class="w-full" />
        </UFormField>
        <UButton type="submit" :loading="saving" :disabled="!valid || saving || pending"
          >Registrar</UButton
        >
      </form>
      <form class="flex items-end gap-3 border-t border-default pt-4" @submit.prevent="saveMinimum">
        <UFormField label="Stock mínimo" help="Se avisa cuando la cantidad llega a este valor.">
          <UInput v-model="minStock" inputmode="numeric" :disabled="saving" />
        </UFormField>
        <UButton
          type="submit"
          color="neutral"
          variant="outline"
          :disabled="!integer(minStock) || saving || pending"
          :loading="saving"
          >Guardar mínimo</UButton
        >
      </form>
    </template>
    <section class="space-y-3 border-t border-default pt-4">
      <h3 class="font-semibold">Historial de movimientos</h3>
      <p v-if="historyPending" role="status">Cargando movimientos...</p>
      <UAlert
        v-else-if="historyError"
        color="error"
        :title="getApiErrorMessage(historyError, 'No se pudo cargar el historial')"
      />
      <ul v-else-if="history?.items.length" class="space-y-3">
        <li
          v-for="movement in history.items"
          :key="movement.stockMovementId"
          class="rounded-md border border-default p-3 space-y-1 text-sm"
        >
          <p class="font-medium">
            {{ labels[movement.type] }} · {{ movement.quantity > 0 ? '+' : ''
            }}{{ movement.quantity }} unidades
          </p>
          <p>{{ movement.previousQuantity }} → {{ movement.resultingQuantity }} unidades</p>
          <p class="whitespace-pre-wrap break-words">{{ movement.reason }}</p>
          <UButton v-if="movement.saleItem || movement.operationItem" :to="`/sales/${movement.saleItem?.saleId ?? movement.operationItem?.operation.saleId}`" icon="i-lucide-receipt" color="neutral" variant="link" size="xs">Ver venta</UButton>
          <p class="text-muted">
            {{ movement.user.name }} ·
            {{
              formatStoreDate(movement.createdAt)
            }}
          </p>
        </li>
      </ul>
      <p v-else class="text-sm text-muted">Todavía no hay movimientos registrados.</p>
      <ListPagination v-if="history && !historyError" v-model="page" :total="history.total" :limit="10" :pending="historyPending || saving" label="movimientos" />
    </section>
  </div>
</template>
