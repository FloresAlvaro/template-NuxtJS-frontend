<script setup lang="ts">
import type { CategoryApi } from '~/types/category'
const props = defineProps<{ category: CategoryApi }>()
const {
  open,
  pending: isSaving,
  error: submitError,
  confirm,
  submit: handleToggleStatus,
} = useCatalogStatus<CategoryApi>({
  resource: 'categories',
  id: (item) => item.categoryId,
  messages: {
    active: 'Categoría activada',
    inactive: 'Categoría desactivada',
    error: 'No se pudo cambiar el estado de la categoría',
  },
  refresh: () => refreshNuxtData(),
})
const openModal = () => confirm(props.category)
const closeModal = () => {
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="category.isActive ? 'Desactivar Categoría' : 'Activar Categoría'"
    :close="{
      color: 'primary',
      variant: 'outline',
      class: 'rounded-full',
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
        <UAlert v-if="submitError" color="error" :title="submitError" />
        <p class="text-sm text-gray-600 dark:text-gray-300">
          ¿Estás seguro de que deseas
          <span class="font-bold" :class="category.isActive ? 'text-amber-500' : 'text-green-500'">
            {{ category.isActive ? 'desactivar' : 'activar' }}
          </span>
          la categoría
          <span class="font-semibold text-gray-900 dark:text-white">"{{ category.name }}"</span>?
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
