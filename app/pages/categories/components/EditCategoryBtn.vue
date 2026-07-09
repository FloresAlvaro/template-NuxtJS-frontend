<!-- app/pages/categories/components/EditCategoryBtn.vue -->
<script setup lang="ts">
import type { CategoryApi } from '~/types/category'
import { useAppToast } from '~/composables/useAppToast'

// 1. Recibimos la categoría que se quiere editar desde la tabla
const props = defineProps<{
  category: CategoryApi
}>()

const appToast = useAppToast()
const { getApiErrorMessage } = useApiErrorMessage()
const { open, isSaving, submitError, openModal, closeModal, startSaving, stopSaving } = useModalAction()

// Estado reactivo local para el formulario
const state = reactive({
  name: '',
  description: ''
})

// 2. Cada vez que el modal se abra, cargamos los datos de la categoría elegida
watch(() => open.value, (isOpen) => {
  if (isOpen && props.category) {
    state.name = props.category.name
    state.description = props.category.description || ''
    submitError.value = ''
  }
})

const handleSubmit = async () => {
  startSaving()

  try {
    // 3. Enviamos PATCH usando el categoryId dinámico
    await $fetch(`/categories/${props.category.categoryId}`, {
      baseURL: useRuntimeConfig().public.apiBase,
      method: 'PATCH',
      body: {
        name: state.name.trim(),
        description: state.description.trim() || undefined
      }
    })

    appToast.success('¡Categoría actualizada!', `La categoría "${state.name}" se editó correctamente.`)
    
    // Refrescamos los datos de la tabla global
    await refreshNuxtData()
    closeModal()
  } catch (error) {
    submitError.value = getApiErrorMessage(error, 'No se pudo actualizar la categoría')

    appToast.error('Error al actualizar', submitError.value)
  } finally {
    stopSaving()
  }
}
</script>

<template>
  <UModal 
    v-model:open="open" 
    title="Editar Categoría"
    :close="{
      color: 'primary',
      variant: 'outline',
      class: 'rounded-full'
    }"
  >
    <!-- El botón del lápiz que se renderizará dentro de la tabla -->
    <UTooltip text="Editar">
      <UButton 
        icon="i-lucide-pencil" 
        color="neutral" 
        variant="soft" 
        class="rounded-full"
        aria-label="Editar categoría"
        @click="openModal"
      />
    </UTooltip>

    <template #body>
      <UForm :state="state" class="space-y-4 p-2" @submit="handleSubmit">
        <UAlert
          v-if="submitError"
          color="error"
          variant="subtle"
          :title="submitError"
        />
        
        <UFormField label="Nombre de la Categoría">
          <UInput v-model="state.name" class="w-full" required />
        </UFormField>

        <UFormField label="Descripción">
          <UTextarea 
            v-model="state.description" 
            class="w-full resize-none!"
            :rows="4"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-4">
          <UButton type="button" color="neutral" variant="ghost" @click="closeModal">
            Cancelar
          </UButton>
          <UButton type="submit" color="primary" :loading="isSaving" :disabled="isSaving">
            Guardar Cambios
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>