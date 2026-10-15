<script setup lang="ts">
import type { CustomerApi } from '~/types/customer'
const props = defineProps<{ customer?: CustomerApi }>()
const emit = defineEmits<{ saved: [customer: CustomerApi]; busy: [value: boolean] }>()
const api = useApi()
const form = reactive({
  name: props.customer?.name ?? '',
  document: props.customer?.document ?? '',
  phone: props.customer?.phone ?? '',
  isActive: props.customer?.isActive ?? true,
})
const { pending, error, run } = useAsyncAction()
watch(pending, (value) => emit('busy', value))
const valid = computed(
  () =>
    form.name.trim().length >= 2 &&
    form.name.trim().length <= 100 &&
    form.document.trim().length <= 50 &&
    form.phone.trim().length <= 30,
)
async function save() {
  if (!valid.value) return
  await run(async () => {
    const customer = await api<CustomerApi>(
      props.customer ? `/customers/${props.customer.customerId}` : '/customers',
      {
        method: props.customer ? 'PATCH' : 'POST',
        body: {
          name: form.name.trim(),
          document: form.document.trim() || null,
          phone: form.phone.trim() || null,
          ...(props.customer ? { isActive: form.isActive } : {}),
        },
      },
    )
    emit('saved', customer)
  }, 'No se pudo guardar el cliente')
}
</script>
<template>
  <form class="space-y-4" @submit.prevent="save">
    <UAlert v-if="error" color="error" :title="error" />
    <UFormField label="Nombre" required
      ><UInput
        v-model="form.name"
        :minlength="2"
        :maxlength="100"
        required
        :disabled="pending"
        class="w-full"
    /></UFormField>
    <UFormField label="Documento"
      ><UInput v-model="form.document" :maxlength="50" :disabled="pending" class="w-full"
    /></UFormField>
    <UFormField label="Teléfono"
      ><UInput v-model="form.phone" :maxlength="30" :disabled="pending" class="w-full"
    /></UFormField>
    <UCheckbox v-if="customer" v-model="form.isActive" label="Cliente activo" :disabled="pending" />
    <p v-if="!customer" class="text-sm text-muted">Se crea un cliente sin cuenta de acceso.</p>
    <UButton type="submit" :loading="pending" :disabled="!valid || pending"
      >Guardar cliente</UButton
    >
  </form>
</template>
