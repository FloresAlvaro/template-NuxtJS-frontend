<script setup lang="ts">
const auth = useAuth()
const shortcuts = computed(() => auth.isStaff.value ? [
  { title: 'Nueva venta', description: 'Selecciona productos y registra una venta.', to: '/sales/new', icon: 'i-lucide-receipt', color: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
  { title: 'Pedidos', description: 'Consulta reservas, prepara y entrega pedidos.', to: '/orders', icon: 'i-lucide-shopping-bag', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  { title: 'Productos e inventario', description: 'Revisa disponibilidad y movimientos de stock.', to: '/products', icon: 'i-lucide-package', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300' },
] : [
  { title: 'Explora el catálogo', description: 'Encuentra productos y consulta su disponibilidad.', to: '/shop', icon: 'i-lucide-store', color: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300' },
  { title: auth.user.value ? 'Tus pedidos' : 'Crea tu cuenta', description: auth.user.value ? 'Sigue el estado de tus pedidos de retiro.' : 'Prepara pedidos para retirar en tienda.', to: auth.user.value ? '/orders' : '/register', icon: 'i-lucide-shopping-bag', color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300' },
  { title: auth.user.value ? 'Tu cuenta' : '¿Ya tienes cuenta?', description: auth.user.value ? 'Mantén tus datos personales al día.' : 'Ingresa para consultar y crear tus pedidos.', to: auth.user.value ? '/account' : '/login', icon: 'i-lucide-circle-user-round', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300' },
])
</script>
<template>
  <div class="space-y-9">
    <section class="hero-panel p-7 sm:p-10 lg:p-12">
      <div class="grid gap-8 md:grid-cols-[1.5fr_1fr] items-center">
        <div>
          <p class="section-eyebrow text-violet-200">{{ auth.isStaff.value ? 'Tu espacio de trabajo' : 'Descubre tu próxima compra' }}</p>
          <h1 class="mt-4 text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1]">{{ auth.isStaff.value ? `Hola, ${auth.user.value?.name}.` : 'Lo que buscas,' }}<span class="block text-orange-300">{{ auth.isStaff.value ? 'Hagamos que todo fluya.' : 'más cerca de ti.' }}</span></h1>
          <p class="mt-5 max-w-lg text-violet-100 leading-relaxed">{{ auth.isStaff.value ? 'Ventas, pedidos y productos en un mismo lugar. Elige por dónde empezar hoy.' : 'Explora nuestro catálogo, prepara tu pedido y retíralo en tienda. A tu ritmo, sin complicaciones.' }}</p>
          <div class="mt-7 flex flex-wrap gap-3">
            <UButton :to="auth.isStaff.value ? '/sales/new' : '/shop'" size="lg" color="neutral" :ui="{ base: 'bg-white text-violet-950 hover:bg-violet-100' }" trailing-icon="i-lucide-arrow-right">{{ auth.isStaff.value ? 'Registrar venta' : 'Explorar catálogo' }}</UButton>
            <UButton v-if="auth.user.value" to="/orders" size="lg" color="neutral" variant="outline" :ui="{ base: 'text-white ring-white/30 hover:bg-white/10' }">{{ auth.isStaff.value ? 'Ver pedidos' : 'Mis pedidos' }}</UButton>
          </div>
        </div>
        <div class="rounded-3xl border border-white/15 bg-white/5 p-6 sm:p-8">
          <UIcon :name="auth.isStaff.value ? 'i-lucide-zap' : 'i-lucide-shopping-bag'" class="size-12 text-orange-300" />
          <h2 class="mt-5 text-xl font-bold">{{ auth.isStaff.value ? 'Cada operación cuenta' : 'De tu pantalla a tus manos' }}</h2>
          <p class="mt-3 text-sm leading-relaxed text-violet-100">{{ auth.isStaff.value ? 'Consulta los detalles de cada venta, organiza los pedidos y mantén el catálogo al día.' : 'Elige tus productos, confirma la reserva y realiza el pago al retirar en tienda.' }}</p>
        </div>
      </div>
    </section>
    <section aria-labelledby="shortcuts-title">
      <div class="mb-5"><p class="section-eyebrow text-primary">{{ auth.isStaff.value ? 'Accesos rápidos' : 'Todo empieza aquí' }}</p><h2 id="shortcuts-title" class="mt-2 text-2xl font-bold tracking-tight">{{ auth.isStaff.value ? '¿Qué necesitas hacer?' : 'Una forma sencilla de comprar' }}</h2></div>
      <div class="grid gap-4 md:grid-cols-3">
        <NuxtLink v-for="item in shortcuts" :key="item.to" :to="item.to" class="feature-link">
          <span class="inline-flex size-12 items-center justify-center rounded-2xl" :class="item.color"><UIcon :name="item.icon" class="size-6" /></span>
          <h3 class="mt-5 font-bold text-lg">{{ item.title }}</h3><p class="mt-2 text-sm text-muted leading-relaxed">{{ item.description }}</p><span class="mt-5 flex items-center gap-2 text-sm font-semibold text-primary">Ir ahora <UIcon name="i-lucide-arrow-up-right" class="size-4" /></span>
        </NuxtLink>
      </div>
    </section>
    <div v-if="auth.isAdmin.value" class="rounded-2xl border border-default bg-default p-5 flex flex-wrap items-center justify-between gap-4"><div><h2 class="font-semibold">Una mirada al negocio</h2><p class="text-sm text-muted mt-1">Consulta ventas, productos más vendidos y alertas de inventario.</p></div><UButton to="/reports" icon="i-lucide-chart-no-axes-combined" variant="soft">Ver reportes</UButton></div>
  </div>
</template>
