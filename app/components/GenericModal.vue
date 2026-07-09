<!-- components/GenericModal.vue -->
<script setup lang="ts">
// Definimos las propiedades genéricas que todo modal va a necesitar
defineProps<{
  title: string
}>()

// Usamos defineModel para controlar el estado abierto/cerrado con v-model desde el padre
const isOpen = defineModel<boolean>({ default: false })
</script>

<template>
  <UModal
    v-model="isOpen"
    :title="title"
    :close="{
      color: 'primary',
      variant: 'outline',
      class: 'rounded-full'
    }"
  >
    <!-- Slot por defecto por si necesitas algo antes del body -->
    <slot />

    <!-- Slot específico para el cuerpo del modal (formulario, textos, etc.) -->
    <template #body>
      <slot name="body" />
    </template>
  </UModal>
</template>