<!-- app/pages/categories/components/ToggleCategoryStatusBtn.vue -->
<script setup lang="ts">
import type { CategoryApi } from '~/types/category'
import { useAppToast } from '~/composable/useAppToast'

const props = defineProps<{
  category: CategoryApi
}>()

const appToast = useAppToast()
const open = ref(false)
const isSaving = ref(false)

// Determinamos el nuevo estado opuesto al actual
const nextStatus = computed(() => !props.category.isActive)

const openModal = () => {
  open.value = true
}

const closeModal = () => {
  open.value = false
}

const handleToggleStatus = async () => {
  isSaving.value = true

  try {
    // Enviamos exclusivamente el valor booleano invertido a NestJS
    await $fetch(`/categories/${props.category.categoryId}`, {
      baseURL: useRuntimeConfig().public.apiBase,
      method: 'PATCH', // o 'PATCH' según tu controlador de NestJS
      body: {
        isActive: nextStatus.value
      }
    })

    // Disparamos el toast personalizado según el cambio de estado
    if (nextStatus.value) {
      appToast.success('¡Categoría Activada!', `La categoría "${props.category.name}" ahora está activa.`)
    } else {
      appToast.warn('Categoría Desactivada', `La categoría "${props.category.name}" ha sido desactivada.`)
    }
    
    // Refrescamos la tabla principal automáticamente
    await refreshNuxtData()
    closeModal()
  } catch (error: any) {
    const errorMsg = error.data?.message || 'No se pudo cambiar el estado de la categoría'
    appToast.error('Error de actualización', errorMsg)
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <UModal 
    v-model:open="open" 
    :title="category.isActive ? 'Desactivar Categoría' : 'Activar Categoría'"
    :close="{
      color: 'primary',
      variant: 'outline',
      class: 'rounded-full'
    }"
  >
    <!-- Botón dinámico del ojo (Cambia de icono, color y tooltip según el estado) -->
    <UTooltip :text="category.isActive ? 'Desactivar' : 'Activar'">
      <UButton 
        :icon="category.isActive ? 'i-lucide-eye-off' : 'i-lucide-eye'" 
        :color="category.isActive ? 'warning' : 'success'" 
        variant="soft" 
        class="rounded-full"
        :aria-label="category.isActive ? 'Desactivar categoría' : 'Activar categoría'"
        @click="openModal"
      />
    </UTooltip>

    <template #body>
      <div class="space-y-4 p-2 text-center sm:text-left">
        <!-- Mensaje de confirmación limpio sin inputs -->
        <p class="text-sm text-gray-600 dark:text-gray-300">
          ¿Estás seguro de que deseas 
          <span class="font-bold" :class="category.isActive ? 'text-amber-500' : 'text-green-500'">
            {{ category.isActive ? 'desactivar' : 'activar' }}
          </span> 
          la categoría <span class="font-semibold text-gray-900 dark:text-white">"{{ category.name }}"</span>?
        </p>

        <p v-if="category.isActive" class="text-xs text-gray-400">
          Nota: Los productos asignados a esta categoría podrían dejar de mostrarse en la tienda.
        </p>

        <!-- Botones de Acción -->
        <div class="flex justify-end gap-2 pt-4">
          <UButton type="button" color="neutral" variant="ghost" @click="closeModal">
            Cancelar
          </UButton>
          <UButton 
            type="button" 
            :color="category.isActive ? 'warning' : 'success'" 
            :loading="isSaving" 
            :disabled="isSaving"
            @click="handleToggleStatus"
          >
            Confirmar
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>