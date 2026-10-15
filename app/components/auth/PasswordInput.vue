<script setup lang="ts">
defineOptions({ inheritAttrs: false })
const value = defineModel<string>({ required: true })
defineProps<{ disabled?: boolean; label?: string }>()
const visible = ref(false)
</script>

<template>
  <UInput
    v-model="value"
    v-bind="$attrs"
    :type="visible ? 'text' : 'password'"
    :disabled="disabled"
    icon="i-lucide-lock-keyhole"
    size="lg"
    class="w-full"
    :ui="{ base: 'rounded-xl' }"
  >
    <template #trailing>
      <UButton
        type="button"
        color="neutral"
        variant="ghost"
        size="sm"
        :icon="visible ? 'i-lucide-eye-off' : 'i-lucide-eye'"
        :aria-label="`${visible ? 'Ocultar' : 'Mostrar'} ${label || 'contraseña'}`"
        :aria-pressed="visible"
        :disabled="disabled"
        @click="
          () => {
            visible = !visible
          }
        "
      />
    </template>
  </UInput>
</template>
