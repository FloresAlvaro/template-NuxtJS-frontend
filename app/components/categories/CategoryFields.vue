<script setup lang="ts">
const name = defineModel<string>('name', { required: true })
const description = defineModel<string>('description', { required: true })
</script>
<template>
  <UFormField label="Nombre de la Categoría"
    ><UInput
      v-model="name"
      minlength="3"
      maxlength="100"
      placeholder="Ej. Ropa, Electrónica..."
      required
      class="w-full"
  /></UFormField>
  <UFormField label="Descripción"
    ><UTextarea
      v-model="description"
      maxlength="500"
      placeholder="Escribe una breve descripción..."
      class="w-full !resize-none"
      :rows="4"
  /></UFormField>
</template>
