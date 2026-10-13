<script setup lang="ts">
const auth = useAuth()
</script>
<template><div class="space-y-4"><h1 class="text-2xl font-bold">Bienvenido a la tienda</h1><p v-if="auth.user.value">Hola, {{ auth.user.value.name }}.</p><UButton :to="auth.isStaff.value ? '/products' : '/shop'">{{ auth.isStaff.value ? 'Ver productos' : 'Explorar catálogo' }}</UButton></div></template>
