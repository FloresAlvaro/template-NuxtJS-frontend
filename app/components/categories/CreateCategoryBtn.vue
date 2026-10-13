<script setup lang="ts">
const api = useApi()
import { useModalAction } from '#imports'
import { useAppToast } from '~/composables/useAppToast'

const appToast = useAppToast()
const { open, isSaving, submitError, openModal, closeModal, run } = useModalAction()

type CategoryFormState = {
  name: string
  description: string
}

const state = reactive<CategoryFormState>({
  name: '',
  description: '',
})

const handleSubmit = async () => {
  if (isSaving.value) return
  const success = await run(async () => {
    const payload = {
      name: state.name.trim(),
      description: state.description.trim() || undefined,
    }

    await api('/categories', {
      method: 'POST',
      body: payload,
    })

    appToast.success('¡Categoría creada!', `La categoría "${state.name}" se guardó correctamente.`)

    await refreshNuxtData()

    state.name = ''
    state.description = ''
    closeModal()
  }, 'No se pudo guardar la categoría')
  if (!success) appToast.error('Error al guardar', submitError.value)
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Crear Nueva Categoría"
    :close="{
      color: 'primary',
      variant: 'outline',
      class: 'rounded-full',
    }"
  >
    <AppButton icon="i-heroicons-plus" preset="primary" @click="openModal">
      Nueva Categoría
    </AppButton>

    <template #body>
      <UForm :state="state" class="space-y-4 p-2" @submit="handleSubmit">
        <UAlert v-if="submitError" color="error" variant="subtle" :title="submitError" />

        <CategoriesCategoryFields
          v-model:name="state.name"
          v-model:description="state.description"
        />

        <div class="flex justify-end gap-2 pt-4">
          <UButton type="button" color="neutral" variant="ghost" @click="closeModal">
            Cancelar
          </UButton>

          <UButton type="submit" color="primary" :loading="isSaving" :disabled="isSaving">
            Guardar
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
