<script setup lang="ts">
defineProps<{ mode: 'login' | 'register' }>()
const steps = [
  {
    icon: 'i-lucide-search',
    title: 'Explora a tu ritmo',
    description: 'Descubre productos y consulta su disponibilidad.',
  },
  {
    icon: 'i-lucide-shopping-bag',
    title: 'Prepara tu pedido',
    description: 'Elige lo que necesitas y reserva tus productos.',
  },
  {
    icon: 'i-lucide-store',
    title: 'Retira en tienda',
    description: 'Consulta tu pedido y realiza el pago al retirar.',
  },
]
</script>

<template>
  <div class="mx-auto max-w-5xl py-2 sm:py-6">
    <NuxtLink
      to="/shop"
      class="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-primary"
    >
      <UIcon name="i-lucide-arrow-left" class="size-4" /> Volver al catálogo
    </NuxtLink>
    <div
      class="overflow-hidden rounded-3xl border border-default bg-default shadow-xl shadow-violet-950/5 lg:grid lg:grid-cols-[0.95fr_1.05fr]"
    >
      <section
        class="auth-story relative overflow-hidden p-6 sm:p-8 lg:p-10"
        aria-label="Compra con retiro en tienda"
      >
        <div class="relative z-10 flex h-full flex-col">
          <div class="flex items-center gap-3">
            <span
              class="inline-flex size-11 items-center justify-center rounded-2xl border border-white/20 bg-white/10"
              ><UIcon name="i-lucide-store" class="size-6" /></span
            ><span class="font-bold text-xl"
              >Tienda<span class="text-orange-300">.</span></span
            >
          </div>
          <p class="section-eyebrow mt-8 text-violet-200 hidden lg:block">
            {{
              mode === 'login'
                ? 'Qué bueno verte de nuevo'
                : 'Tu próxima compra empieza aquí'
            }}
          </p>
          <h2
            class="hidden lg:block mt-3 text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight"
          >
            {{ mode === 'login' ? 'Tu tienda,' : 'Una cuenta,'
            }}<span class="block text-orange-300">{{
              mode === 'login' ? 'más cerca de ti.' : 'muchas posibilidades.'
            }}</span>
          </h2>
          <p
            class="hidden lg:block mt-4 text-sm leading-relaxed text-violet-100"
          >
            {{
              mode === 'login'
                ? 'Entra a tu cuenta y continúa donde lo dejaste.'
                : 'Crea tu cuenta de cliente para preparar pedidos y seguir su estado.'
            }}
          </p>
          <div class="mt-8 hidden space-y-6 lg:block">
            <div
              v-for="step in steps"
              :key="step.title"
              class="flex items-start gap-3"
            >
              <span
                class="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-orange-200"
                ><UIcon :name="step.icon" class="size-5"
              /></span>
              <div>
                <h3 class="font-semibold text-sm">{{ step.title }}</h3>
                <p class="mt-1 text-sm leading-relaxed text-violet-200">
                  {{ step.description }}
                </p>
              </div>
            </div>
          </div>
          <div
            class="hidden mt-8 lg:mt-auto lg:pt-10 lg:flex items-center gap-2 text-xs text-violet-200"
          >
            <UIcon name="i-lucide-map-pin" class="size-4" /> Pedidos con retiro
            y pago en tienda
          </div>
        </div>
      </section>
      <section
        class="min-w-0 p-6 sm:p-8 lg:p-10"
        aria-label="Formulario de acceso"
      >
        <slot />
      </section>
    </div>
  </div>
</template>

<style scoped>
.auth-story {
  color: white;
  background: #221342;
}
.auth-story::before {
  content: '';
  position: absolute;
  width: 25rem;
  height: 25rem;
  border-radius: 50%;
  top: -10rem;
  right: -12rem;
  background: radial-gradient(circle, #a855f799, transparent 70%);
  pointer-events: none;
}
.auth-story::after {
  content: '';
  position: absolute;
  width: 20rem;
  height: 20rem;
  border-radius: 50%;
  bottom: -14rem;
  left: -4rem;
  background: #fb923c66;
  filter: blur(45px);
  pointer-events: none;
}
</style>
