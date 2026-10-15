<script setup lang="ts">
import type { SupplierApi } from '~/types/supplier'
const props = defineProps<{ supplier?: SupplierApi }>()
const emit = defineEmits<{ saved: []; busy: [value: boolean] }>()
const api = useApi()
const { pending, error, run } = useAsyncAction()
const form = reactive({
  name: props.supplier?.name ?? '',
  document: props.supplier?.document ?? '',
  contactName: props.supplier?.contactName ?? '',
  email: props.supplier?.email ?? '',
  phone: props.supplier?.phone ?? '',
  address: props.supplier?.address ?? '',
  notes: props.supplier?.notes ?? '',
  isActive: props.supplier?.isActive ?? true,
})
watch(pending, (value) => emit('busy', value))
const valid = computed(
  () =>
    form.name.trim().length >= 2 &&
    form.name.trim().length <= 150 &&
    (!form.email || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())),
)
async function save() {
  if (!valid.value) return
  await run(async () => {
    await api(
      props.supplier ? `/suppliers/${props.supplier.supplierId}` : '/suppliers',
      {
        method: props.supplier ? 'PATCH' : 'POST',
        body: {
          name: form.name.trim(),
          document: form.document.trim() || null,
          contactName: form.contactName.trim() || null,
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          address: form.address.trim() || null,
          notes: form.notes.trim() || null,
          ...(props.supplier ? { isActive: form.isActive } : {}),
        },
      },
    )
    emit('saved')
  }, 'No se pudo guardar el proveedor')
}
</script>
<template>
  <form class="space-y-4" @submit.prevent="save">
    <UAlert v-if="error" color="error" :title="error" />
    <UFormField label="Nombre o razón social" required
      ><UInput
        v-model="form.name"
        required
        :minlength="2"
        :maxlength="150"
        :disabled="pending"
        class="w-full"
    /></UFormField>
    <div class="grid gap-3 sm:grid-cols-2">
      <UFormField label="Documento / NIT"
        ><UInput
          v-model="form.document"
          :maxlength="50"
          :disabled="pending"
          class="w-full"
      /></UFormField>
      <UFormField label="Persona de contacto"
        ><UInput
          v-model="form.contactName"
          :maxlength="100"
          :disabled="pending"
          class="w-full"
      /></UFormField>
      <UFormField label="Correo electrónico"
        ><UInput
          v-model="form.email"
          type="email"
          :maxlength="254"
          :disabled="pending"
          class="w-full"
      /></UFormField>
      <UFormField label="Teléfono"
        ><UInput
          v-model="form.phone"
          :maxlength="30"
          :disabled="pending"
          class="w-full"
      /></UFormField>
    </div>
    <UFormField label="Dirección"
      ><UInput
        v-model="form.address"
        :maxlength="300"
        :disabled="pending"
        class="w-full"
    /></UFormField>
    <UFormField label="Notas"
      ><UTextarea
        v-model="form.notes"
        :maxlength="1000"
        :disabled="pending"
        class="w-full"
    /></UFormField>
    <UCheckbox
      v-if="supplier"
      v-model="form.isActive"
      label="Proveedor activo"
      :disabled="pending"
    />
    <p v-if="supplier" class="text-sm text-muted">
      Desactivar bloquea nuevas compras y recepciones. El historial se conserva.
    </p>
    <UButton type="submit" :loading="pending" :disabled="pending || !valid"
      >Guardar proveedor</UButton
    >
  </form>
</template>
