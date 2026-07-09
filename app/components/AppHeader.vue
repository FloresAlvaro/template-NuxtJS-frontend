<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()

const items = computed<NavigationMenuItem[]>(() => [
  {
    label: 'Inicio',
    to: '/',
    active: route.path === '/'
  },
  {
    label: 'Productos',
    to: '/productos',
    active: route.path.startsWith('/productos')
  }
])
</script>

<template>
  <UHeader>
    <template #title>
      <span class="text-xl font-bold"> Template Tienda NuxtJS </span>
    </template>

    <UNavigationMenu :items="items" />

    <template #right>
      <UColorModeButton />
      <UButton
        icon="i-lucide-shopping-cart"
        color="neutral"
        variant="ghost"
        to="/carrito"
        aria-label="Carrito"
      />
    </template>
  </UHeader>
</template>