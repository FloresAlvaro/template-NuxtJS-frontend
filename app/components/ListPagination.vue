<script setup lang="ts">
const page = defineModel<number>({ required: true })
const props = defineProps<{ total: number; limit: number; pending?: boolean }>()
const pages = computed(() => Math.max(1, Math.ceil(props.total / props.limit)))
watch(pages, (value) => {
  if (page.value > value) page.value = value
})
</script>
<template>
  <div class="flex flex-wrap justify-between items-center gap-3">
    <p class="text-sm text-muted">
      {{ total }} resultados · Página {{ page }} de {{ pages }}
    </p>
    <div class="flex gap-2">
      <UButton
        color="neutral"
        variant="outline"
        :disabled="page <= 1 || pending"
        @click="
          () => {
            page--
          }
        "
        >Anterior</UButton
      >
      <UButton
        color="neutral"
        variant="outline"
        :disabled="page >= pages || pending"
        @click="
          () => {
            page++
          }
        "
        >Siguiente</UButton
      >
    </div>
  </div>
</template>
