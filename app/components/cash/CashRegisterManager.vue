<script setup lang="ts">
import type { CashRegisterApi } from '~/types/cash'
defineProps<{ registers: CashRegisterApi[] }>()
const emit = defineEmits<{ changed: [] }>()
const api = useApi()
const { pending, error, run } = useAsyncAction()
const name = ref('')
async function create() {
  await run(async () => {
    await api('/cash/registers', {
      method: 'POST',
      body: { name: name.value.trim() },
    })
    name.value = ''
    emit('changed')
  }, 'No se pudo crear la caja')
}
async function toggle(register: CashRegisterApi) {
  await run(async () => {
    await api('/cash/registers/' + register.registerId, {
      method: 'PATCH',
      body: { name: register.name, isActive: !register.isActive },
    })
    emit('changed')
  }, 'No se pudo cambiar el estado de la caja')
}
</script>
<template>
  <UCard
    ><template #header
      ><h2 class="font-semibold">Administrar cajas</h2></template
    >
    <form class="flex flex-wrap items-end gap-3" @submit.prevent="create">
      <UFormField label="Nombre de la nueva caja" class="grow"
        ><UInput
          v-model="name"
          :maxlength="100"
          :disabled="pending"
          class="w-full" /></UFormField
      ><UButton type="submit" :loading="pending" :disabled="!name.trim()"
        >Crear caja</UButton
      >
    </form>
    <UAlert v-if="error" class="mt-3" color="error" :title="error" />
    <ul class="mt-4 divide-y divide-default">
      <li
        v-for="register in registers"
        :key="register.registerId"
        class="flex flex-wrap items-center justify-between gap-3 py-3"
      >
        <span
          >{{ register.name }} ·
          {{ register.isActive ? 'Activa' : 'Inactiva' }}</span
        ><UButton
          color="neutral"
          variant="soft"
          :disabled="pending"
          :aria-label="
            (register.isActive ? 'Desactivar ' : 'Activar ') + register.name
          "
          @click="toggle(register)"
          >{{ register.isActive ? 'Desactivar' : 'Activar' }}</UButton
        >
      </li>
    </ul>
  </UCard>
</template>
