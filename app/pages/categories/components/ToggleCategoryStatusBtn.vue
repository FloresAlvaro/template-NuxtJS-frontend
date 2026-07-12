<script setup lang="ts">
import type { CategoryApi } from '~/types/category'
import { useAppToast } from '~/composables/useAppToast'
import { useModalAction } from '~/composables/useModalAction'

const props = defineProps<{
  category: CategoryApi
}>()

const appToast = useAppToast()
const { getApiErrorMessage } = useApiErrorMessage()
const { open, isSaving, openModal, closeModal, startSaving, stopSaving } = useModalAction()

const nextStatus = computed(() => !props.category.isActive)

const handleToggleStatus = async () => {
  startSaving()

  try {
    if (props.category.isActive) {
      await $fetch(`/categories/${props.category.categoryId}`, {
        baseURL: useRuntimeConfig().public.apiBase,
        method: 'DELETE',
      })
    } else {
      await $fetch(`/categories/${props.category.categoryId}/activate`, {
        baseURL: useRuntimeConfig().public.apiBase,
        method: 'PATCH',
      })
    }

    if (nextStatus.value) {
      appToast.success('¡Categoría Activada!', `La categoría "${props.category.name}" ahora está activa.`)
    } else {
      appToast.warn('Categoría Desactivada', `La categoría "${props.category.name}" ha sido desactivada.`)
    }

    await refreshNuxtData()
    closeModal()
  } catch (error) {
    const errorMsg = getApiErrorMessage(error, 'No se pudo cambiar el estado de la categoría')
    appToast.error('Error de actualización', errorMsg)
  } finally {
    stopSaving()
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