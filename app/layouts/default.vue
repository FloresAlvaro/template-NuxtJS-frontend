<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />

    <!-- Contenedor principal compartido en todas las páginas -->
    <main class="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
      <aside class="md:col-span-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <p>Izquierda (2/12)</p>
      </aside>

      <section class="md:col-span-8 bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <slot />
      </section>

      <aside class="md:col-span-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <p>Derecha (2/12)</p>
      </aside>
    </main>

    <AppFooter />
  </div>
</template>