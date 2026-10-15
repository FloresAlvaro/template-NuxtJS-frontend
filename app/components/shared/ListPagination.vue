<script setup lang="ts">
const page = defineModel<number>({ required: true })
const props = withDefaults(
  defineProps<{
    total: number
    limit: number
    pending?: boolean
    label?: string
  }>(),
  { label: 'resultados' },
)
const pages = computed(() => Math.max(1, Math.ceil(props.total / props.limit)))
watch([pages, () => props.pending], ([value, pending]) => {
  if (!pending && page.value > value) page.value = value
}, { immediate: true })
</script>
<template>
  <div class="flex flex-col items-center gap-3 py-2">
    <p class="text-sm text-muted text-center" aria-live="polite">
      {{ total }} {{ label }} · Página {{ page }} de {{ pages }}
    </p>
    <UPagination
      v-model:page="page"
      :total="total"
      :items-per-page="limit"
      :sibling-count="1"
      :disabled="pending"
      color="neutral"
      variant="outline"
      active-color="primary"
      active-variant="solid"
      :ui="{ list: 'flex-wrap justify-center' }"
      aria-label="Paginación de resultados"
    />
  </div>
</template>
