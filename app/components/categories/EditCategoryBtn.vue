<script setup lang="ts">
const api = useApi()
import type { CategoryApi } from '~/types/category'
import { useAppToast } from '~/composables/useAppToast'
import { useModalAction } from '~/composables/useModalAction'

const props = defineProps<{
  category: CategoryApi
}>()

const appToast = useAppToast()
const { open, isSaving, submitError, openModal, closeModal, run } = useModalAction()

const state = reactive({
  name: '',
  description: '',
})

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen && props.category) {
      state.name = props.category.name
      state.description = props.category.description || ''
      submitError.value = ''
    }
  },
)

const handleSubmit = async () => {
  if (isSaving.value) return
  const success = await run(async () => {
    await api(`/categories/${props.category.categoryId}`, {
      method: 'PATCH',
      body: {
        name: state.name.trim(),
        description: state.description.trim() || null,
      },
    })

    appToast.success(
      '¡Categoría actualizada!',
      `La categoría "${state.name}" se editó correctamente.`,
    )
    await refreshNuxtData()
    closeModal()
  }, 'No se pudo actualizar la categoría')
  if (!success) appToast.error('Error al actualizar', submitError.value)
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Editar Categoría"
    :close="{
      color: 'primary',
      variant: 'outline',
      class: 'rounded-full',
    }"
  >
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
            Guardar Cambios
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
