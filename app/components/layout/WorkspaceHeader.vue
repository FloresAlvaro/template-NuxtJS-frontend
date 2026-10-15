<script setup lang="ts">
defineProps<{ eyebrow: string; title: string; description: string; icon?: string }>()
</script>
<template>
  <section class="hero-panel p-6 sm:p-8">
    <div class="flex flex-wrap items-center justify-between gap-6">
      <div class="min-w-0 max-w-2xl">
        <p class="section-eyebrow text-violet-200">{{ eyebrow }}</p>
        <h1 class="mt-3 flex items-center gap-3 text-3xl font-extrabold tracking-tight sm:text-4xl"><UIcon v-if="icon" :name="icon" class="size-8 shrink-0 text-orange-300" />{{ title }}</h1>
        <p class="mt-3 text-sm leading-relaxed text-violet-100">{{ description }}</p>
      </div>
      <div v-if="$slots.actions" class="flex flex-wrap gap-3"><slot name="actions" /></div>
    </div>
  </section>
</template>
