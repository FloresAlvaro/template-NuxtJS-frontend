<script setup lang="ts">
import { useModalAction } from '#imports'
import { useAppToast } from '~/composables/useAppToast'

const appToast = useAppToast()
const { getApiErrorMessage } = useApiErrorMessage()
const { open, isSaving, submitError, openModal, closeModal, startSaving, stopSaving } = useModalAction()

type CategoryFormState = {
  name: string
  description: string
}

const state = reactive<CategoryFormState>({
  name: '',
  description: ''
})

const handleSubmit = async () => {
  startSaving()

  try {
    const payload = {
      name: state.name.trim(),
      description: state.description.trim() || undefined
    }

    await $fetch('/categories', {
      baseURL: useRuntimeConfig().public.apiBase,
      method: 'POST',
      body: payload
    })

    appToast.success('¡Categoría creada!', `La categoría "${state.name}" se guardó correctamente.`)

    await refreshNuxtData()

    state.name = ''
    state.description = ''
    closeModal()
  } catch (error) {
    submitError.value = getApiErrorMessage(error, 'No se pudo guardar la categoría')

    appToast.error('Error al guardar', submitError.value)
  } finally {
    stopSaving()
  }
}
</script>

<template>
  <UModal 
    v-model:open="open" 
    title="Crear Nueva Categoría"
    :close="{
      color: 'primary',
      variant: 'outline',
      class: 'rounded-full'
    }"
  >
    <AppButton icon="i-heroicons-plus" preset="primary" @click="openModal">
      Nueva Categoría
    </AppButton>

    <template #body>
      <UForm :state="state" class="space-y-4 p-2" @submit="handleSubmit">

        <UAlert
          v-if="submitError"
          color="error"
          variant="subtle"
          :title="submitError"
        />
        
        <UFormField label="Nombre de la Categoría">
          <UInput v-model="state.name" placeholder="Ej. Ropa, Electrónica..." class="w-full" required />
        </UFormField>

        <UFormField label="Descripción">
          <UTextarea 
            v-model="state.description" 
            placeholder="Escribe una breve descripción..." 
            class="w-full !resize-none"
            :rows="4"
          />
        </UFormField>

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