<script setup lang="ts">

defineProps<{
    title: string
}>()

const isOpen = defineModel<boolean>({ default: false })
</script>

<template>
  <UModal
    v-model:open="isOpen"
    :title="title"
    :close="{
      color: 'primary',
      variant: 'outline',
      class: 'rounded-full'
    }"
  >
    
    <slot />

    <template #body>
      <slot name="body" />
    </template>
  </UModal>
</template>