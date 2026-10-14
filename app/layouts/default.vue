<script setup lang="ts">
const auth = useAuth()
const { groups } = useAppNavigation()
const route = useRoute()
const active = (path: string) => path === '/' ? route.path === '/' : route.path === path || route.path.startsWith(`${path}/`)
</script>
<template>
  <div class="app-shell min-h-screen flex flex-col">
    <AppHeader />
    <div class="flex-1 w-full mx-auto max-w-[1600px] lg:flex">
      <aside v-if="auth.isStaff.value" class="hidden lg:block w-64 shrink-0 border-r border-default px-5 py-8" aria-label="Navegación de gestión">
        <div class="sticky top-24 space-y-7">
          <div v-for="group in groups" :key="group.label">
            <p class="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-muted">{{ group.label }}</p>
            <nav :aria-label="group.label" class="space-y-1">
              <NuxtLink v-for="item in group.items" :key="item.to" :to="item.to" :aria-current="active(item.to) ? 'page' : undefined" class="sidebar-link" :class="{ 'is-active': active(item.to) }">
                <UIcon :name="item.icon" class="size-5 shrink-0" />{{ item.label }}
              </NuxtLink>
            </nav>
          </div>
          <div class="rounded-2xl bg-primary/10 p-4">
            <UIcon name="i-lucide-zap" class="size-5 text-primary" />
            <p class="mt-2 font-semibold text-sm">Tu próxima venta empieza aquí</p>
            <UButton to="/sales/new" size="sm" class="mt-3" icon="i-lucide-plus">Nueva venta</UButton>
          </div>
        </div>
      </aside>
      <main id="main-content" class="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8 lg:px-10" :class="{ 'max-w-7xl mx-auto w-full': !auth.isStaff.value }"><slot /></main>
    </div>
    <AppFooter />
  </div>
</template>
