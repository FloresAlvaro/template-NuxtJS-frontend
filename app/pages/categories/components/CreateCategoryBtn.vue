<!-- app/pages/categories/components/CreateCategoryBtn.vue -->
<script setup lang="ts">
import type { CategoryCreatePayload } from '~/types/category'
import { useAppToast } from '~/composable/useAppToast'
// 1. Instanciamos el Toast global que creamos antes
const appToast = useAppToast()

const open = ref(false)
const isSaving = ref(false)
const submitError = ref('')

type CategoryFormState = {
  name: string
  description: string
}

const state = reactive<CategoryFormState>({
  name: '',
  description: ''
})

const handleSubmit = async () => {
  submitError.value = ''
  isSaving.value = true

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

    // 2. Si todo sale bien, lanzamos el Toast de Éxito (Verde)
    appToast.success('¡Categoría creada!', `La categoría "${state.name}" se guardó correctamente.`)

    await refreshNuxtData()

    state.name = ''
    state.description = ''
    open.value = false
  } catch (error) {
    // Procesamos el error del backend...
    if (error && typeof error === 'object' && 'data' in error) {
      const apiError = error as { data?: unknown; statusMessage?: string; message?: string }

      if (typeof apiError.data === 'string') {
        submitError.value = apiError.data
      } else if (apiError.data && typeof apiError.data === 'object' && 'message' in apiError.data) {
        const message = (apiError.data as { message?: string | string[] }).message
        submitError.value = Array.isArray(message) ? message.join(', ') : message ?? 'No se pudo guardar la categoría'
      } else {
        submitError.value = apiError.statusMessage ?? apiError.message ?? 'No se pudo guardar la categoría'
      }
    } else {
      submitError.value = error instanceof Error ? error.message : 'No se pudo guardar la categoría'
    }

    // 3. Lanzamos el Toast de Error (Rojo) indicando el problema de forma flotante
    appToast.error('Error al guardar', submitError.value)
    
  } finally {
    isSaving.value = false
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
    <AppButton icon="i-heroicons-plus" preset="primary" @click="open = true">
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
            class="w-full resize-none!"
            :rows="4"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-4">
          <UButton type="button" color="neutral" variant="ghost" @click="open = false;">
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