<script setup lang="ts">
const props = defineProps<{ src?: string | null; name: string; compact?: boolean }>()
const failed = ref(false)
watch(() => props.src, () => { failed.value = false })
</script>
<template>
  <div class="product-media flex items-center justify-center overflow-hidden">
    <img v-if="src && !failed" :src="src" :alt="name" loading="lazy" class="h-full w-full object-contain" :class="compact ? 'p-1' : 'p-3'" @error="failed = true" />
    <div v-else class="flex flex-col items-center gap-2 text-muted" :class="compact ? 'p-2' : 'p-4'"><UIcon name="i-lucide-package" class="text-primary/50" :class="compact ? 'size-6' : 'size-10'" /><span v-if="!compact" class="text-xs">{{ failed ? 'Foto no disponible' : 'Sin foto' }}</span></div>
  </div>
</template>
