<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
const auth = useAuth()
const route = useRoute(),
  menuOpen = ref(false),
  logoutError = ref('')
watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)
const items = computed<NavigationMenuItem[]>(() => [
  { label: 'Inicio', to: '/' },
  { label: 'Catálogo', to: '/shop' },
  ...(auth.isStaff.value
    ? [
        { label: 'Categorías', to: '/categories' },
        { label: 'Subcategorías', to: '/sub-categories' },
        { label: 'Productos', to: '/products' },
        { label: 'Clientes', to: '/customers' },
        { label: 'Ventas', to: '/sales' },
        { label: 'Pedidos', to: '/orders' },
      ]
    : []),
  ...(auth.isAdmin.value
    ? [
        { label: 'Usuarios', to: '/users' },
        { label: 'Reportes', to: '/reports' },
      ]
    : []),
  ...(auth.user.value?.role === 'CUSTOMER'
    ? [{ label: 'Mis pedidos', to: '/orders' }]
    : []),
  ...(auth.user.value
    ? [{ label: 'Mi cuenta', to: '/account' }]
    : [{ label: 'Ingresar', to: '/login' }]),
])
async function logout() {
  try {
    await auth.logout()
  } catch {
    logoutError.value = 'No se pudo cerrar sesión. Inténtalo de nuevo.'
  }
}
</script>
<template>
  <UHeader v-model:open="menuOpen">
    <template #title><span class="text-xl font-bold">Tienda</span></template>
    <UNavigationMenu :items="items" />
    <template #body
      ><UNavigationMenu :items="items" orientation="vertical" /><UButton
        v-if="auth.user.value"
        variant="ghost"
        @click="logout"
        >Cerrar sesión</UButton
      ></template
    >
    <template #right
      ><UButton
        v-if="auth.user.value"
        icon="i-lucide-log-out"
        variant="ghost"
        aria-label="Cerrar sesión"
        @click="logout" /><UColorModeButton
    /></template>
  </UHeader>
  <p v-if="logoutError" role="alert" class="text-red-600 text-center">
    {{ logoutError }}
  </p>
</template>
