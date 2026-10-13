<script setup lang="ts">
withDefaults(defineProps<{ active: boolean; feminine?: boolean }>(), { feminine: false })
</script>

<template>
  <UBadge :color="active ? 'success' : 'neutral'" variant="subtle" class="capitalize">
    {{ active ? (feminine ? 'Activa' : 'Activo') : feminine ? 'Inactiva' : 'Inactivo' }}
  </UBadge>
</template>
