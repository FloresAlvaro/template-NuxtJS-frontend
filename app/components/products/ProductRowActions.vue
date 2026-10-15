<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { ProductApi } from '~/types/product'

const props = defineProps<{ product: ProductApi; detailLoading?: boolean }>()
const emit = defineEmits<{
  view: [product: ProductApi]
  inventory: [product: ProductApi]
  photo: [product: ProductApi]
  edit: [product: ProductApi]
  toggle: [product: ProductApi]
}>()
const auth = useAuth()
const items = computed<DropdownMenuItem[]>(() => [
  {
    label: 'Inventario',
    icon: 'i-lucide-boxes',
    onSelect: () => emit('inventory', props.product),
  },
  {
    label: auth.isAdmin.value ? 'Gestionar foto' : 'Ver foto',
    icon: 'i-lucide-image',
    onSelect: () => emit('photo', props.product),
  },
  ...(auth.isAdmin.value
    ? [
        {
          label: 'Editar producto',
          icon: 'i-lucide-pencil',
          onSelect: () => emit('edit', props.product),
        },
        { type: 'separator' as const },
        {
          label: props.product.isActive ? 'Desactivar' : 'Activar',
          icon: props.product.isActive ? 'i-lucide-eye-off' : 'i-lucide-check',
          color: props.product.isActive
            ? ('warning' as const)
            : ('success' as const),
          onSelect: () => emit('toggle', props.product),
        },
      ]
    : []),
])
</script>

<template>
  <div class="flex items-center justify-center gap-1">
    <UButton
      icon="i-lucide-eye"
      color="neutral"
      variant="soft"
      size="sm"
      :disabled="detailLoading"
      :aria-label="`Ver ${product.name}`"
      @click="emit('view', product)"
      >Ver</UButton
    >
    <UDropdownMenu :items="items" :content="{ align: 'end' }">
      <UButton
        icon="i-lucide-ellipsis-vertical"
        color="neutral"
        variant="ghost"
        size="sm"
        :aria-label="`Más acciones de ${product.name}`"
      />
    </UDropdownMenu>
  </div>
</template>
