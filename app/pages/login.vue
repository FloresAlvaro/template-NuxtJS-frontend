<script setup lang="ts">
const api = useApi()
import type { AuthUser } from '~/types/auth'
const auth = useAuth()
const route = useRoute()
const email = ref(''),
  password = ref('')
const { pending: busy, error, run } = useAsyncAction()
async function submit() {
  await run(async () => {
    auth.user.value = await api<AuthUser>('/auth/login', {
      method: 'POST',
      body: { email: email.value, password: password.value },
    })
    clearNuxtData()
    const target = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    await navigateTo(
      target.startsWith('/') &&
        !target.startsWith('//') &&
        !target.includes('\\') &&
        !/^\/(login|register)/.test(target)
        ? target
        : auth.isStaff.value
          ? '/categories'
          : '/shop',
    )
  }, 'No se pudo iniciar sesión. Revisa tus datos o vuelve a intentarlo en un minuto.')
}
</script>
<template>
  <UCard class="max-w-md mx-auto">
    <template #header><h1 class="text-xl font-bold">Iniciar sesión</h1></template>
    <form class="space-y-4" @submit.prevent="submit">
      <UFormField label="Correo electrónico" required
        ><UInput v-model="email" type="email" autocomplete="username" required class="w-full"
      /></UFormField>
      <UFormField label="Contraseña" required
        ><UInput
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          class="w-full"
      /></UFormField>
      <p v-if="error" role="alert" class="text-red-600">{{ error }}</p>
      <UButton type="submit" :loading="busy" :disabled="busy">Ingresar</UButton>
      <NuxtLink to="/forgot-password" class="block text-primary">¿Olvidaste tu contraseña?</NuxtLink>
      <p>
        ¿No tienes cuenta?
        <NuxtLink to="/register" class="text-primary">Regístrate como cliente</NuxtLink>
      </p>
    </form>
  </UCard>
</template>
