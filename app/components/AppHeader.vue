<script setup lang="ts">
import { ROLE_LABELS } from '~/utils/roles'
const auth = useAuth()
const { groups, account } = useAppNavigation()
const route = useRoute()
const menuOpen = ref(false)
const logoutError = ref('')
const loggingOut = ref(false)
const publicItems = computed(() => [...(groups.value[0]?.items ?? []), account.value])
watch(() => route.fullPath, () => { menuOpen.value = false })
async function logout() {
  if (loggingOut.value) return
  loggingOut.value = true
  logoutError.value = ''
  try { await auth.logout() }
  catch { logoutError.value = 'No se pudo cerrar sesión. Inténtalo de nuevo.' }
  finally { loggingOut.value = false }
}
</script>
<template>
  <a href="#main-content" class="skip-link">Ir al contenido</a>
  <UHeader v-model:open="menuOpen" :ui="{ container: 'max-w-[1600px]' }" class="app-header">
    <template #title><span class="flex items-center gap-3"><span class="brand-mark"><UIcon name="i-lucide-store" class="size-5" /></span><span class="text-xl font-extrabold tracking-tight">Tienda<span class="text-primary">.</span></span></span></template>
    <UNavigationMenu v-if="!auth.isStaff.value" :items="publicItems" />
    <span v-else class="hidden lg:block text-sm text-muted">Tu tienda, en movimiento.</span>
    <template #body>
      <div class="space-y-5">
        <div v-for="group in groups" :key="group.label"><p class="mb-2 text-xs uppercase tracking-widest text-muted">{{ group.label }}</p><UNavigationMenu :items="group.items" orientation="vertical" /></div>
        <UNavigationMenu :items="[account]" orientation="vertical" />
        <UButton v-if="auth.user.value" color="neutral" variant="ghost" :loading="loggingOut" icon="i-lucide-log-out" @click="logout">Cerrar sesión</UButton>
      </div>
    </template>
    <template #right>
      <NuxtLink v-if="auth.user.value" to="/account" class="hidden sm:flex items-center gap-2 rounded-full px-3 py-1.5 hover:bg-elevated">
        <span class="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">{{ auth.user.value.name.slice(0, 1).toUpperCase() }}</span>
        <span class="max-w-32"><span class="block truncate text-sm font-semibold">{{ auth.user.value.name }}</span><span class="block text-xs text-muted">{{ ROLE_LABELS[auth.user.value.role] }}</span></span>
      </NuxtLink>
      <UButton v-if="auth.user.value" icon="i-lucide-log-out" color="neutral" variant="ghost" aria-label="Cerrar sesión" :loading="loggingOut" @click="logout" />
      <UColorModeButton />
    </template>
  </UHeader>
  <UAlert v-if="logoutError" role="alert" color="error" :title="logoutError" class="mx-4 mt-3" />
</template>
