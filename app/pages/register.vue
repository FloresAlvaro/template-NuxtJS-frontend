<script setup lang="ts">
const api = useApi()
const form = reactive({ name: '', email: '', password: '' })
const confirmation = ref('')
const { pending: busy, error, run } = useAsyncAction()
async function submit() {
  if (form.password !== confirmation.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }

  await run(async () => {
    await api('/auth/register', { method: 'POST', body: form })
    await navigateTo('/login')
  }, 'No se pudo registrar la cuenta. Revisa los datos; el correo puede estar registrado.')
}
</script>
<template>
  <UCard class="max-w-md mx-auto">
    <template #header><h1 class="text-xl font-bold">Crear cuenta de cliente</h1></template>
    <form class="space-y-4" @submit.prevent="submit">
      <UFormField label="Nombre" required
        ><UInput
          v-model="form.name"
          minlength="2"
          maxlength="100"
          autocomplete="name"
          required
          class="w-full"
      /></UFormField>
      <UFormField label="Correo electrónico" required
        ><UInput
          v-model="form.email"
          type="email"
          maxlength="254"
          autocomplete="email"
          required
          class="w-full"
      /></UFormField>
      <UFormField label="Contraseña" help="Entre 12 y 128 caracteres" required
        ><UInput
          v-model="form.password"
          type="password"
          minlength="12"
          maxlength="128"
          autocomplete="new-password"
          required
          class="w-full"
      /></UFormField>
      <UFormField label="Repetir contraseña" required
        ><UInput
          v-model="confirmation"
          type="password"
          autocomplete="new-password"
          required
          class="w-full"
      /></UFormField>
      <p v-if="error" role="alert" class="text-red-600">{{ error }}</p>
      <UButton type="submit" :loading="busy" :disabled="busy">Registrarme</UButton>
      <UButton to="/login" variant="link">Ya tengo cuenta</UButton>
    </form>
  </UCard>
</template>
