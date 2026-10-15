<template>
  <div class="space-y-4">
    <UBreadcrumb
      :items="[
        { label: 'Inicio', to: '/' },
        { label: 'Compras', to: '/purchases' },
        { label: 'Nueva compra' },
      ]"
    />
    <h1 class="text-2xl font-bold">Nueva compra</h1>
    <PurchaseForm />
  </div>
</template>
