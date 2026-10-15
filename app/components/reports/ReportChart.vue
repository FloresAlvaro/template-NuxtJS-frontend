<script setup lang="ts">
defineProps<{
  title: string
  description: string
  icon: string
  pending: boolean
  error?: string
  empty?: boolean
  emptyMessage?: string
}>()
defineEmits<{ retry: [] }>()
const titleId = useId()
</script>
<template>
  <section :aria-labelledby="titleId" class="min-w-0">
    <UCard
      class="h-full rounded-2xl"
      :ui="{ header: 'border-0 pb-0', body: 'space-y-5' }"
    >
      <template #header
        ><div class="flex flex-wrap items-start justify-between gap-3">
          <div class="min-w-0">
            <h2
              :id="titleId"
              class="scroll-mt-24 flex items-center gap-2 font-bold text-lg"
            >
              <UIcon :name="icon" class="size-5 shrink-0 text-primary" />{{
                title
              }}
            </h2>
            <p class="mt-2 text-sm text-muted leading-relaxed">
              {{ description }}
            </p>
          </div>
          <slot name="controls" /></div
      ></template>
      <div
        v-if="pending"
        role="status"
        aria-label="Actualizando gráfico"
        class="space-y-3 py-5"
      >
        <USkeleton class="h-48 w-full rounded-xl" /><USkeleton
          class="h-4 w-1/2"
        /><span class="sr-only">Actualizando {{ title }}</span>
      </div>
      <UAlert
        v-else-if="error"
        color="error"
        title="No se pudo cargar el gráfico"
        :description="error"
        ><template #actions
          ><UButton
            color="neutral"
            variant="outline"
            size="sm"
            @click="$emit('retry')"
            >Reintentar</UButton
          ></template
        ></UAlert
      >
      <div
        v-else-if="empty"
        class="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl bg-elevated/50 p-6 text-center"
      >
        <UIcon :name="icon" class="size-8 text-muted" />
        <p class="text-sm text-muted">
          {{ emptyMessage || 'No hay datos para este período.' }}
        </p>
      </div>
      <slot v-else />
      <slot v-if="!pending && !error" name="data" />
    </UCard>
  </section>
</template>
