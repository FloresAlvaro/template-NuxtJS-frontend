<script setup lang="ts">
const api = useApi()
const email = ref('')
const sent = ref(false)
const { pending, error, run } = useAsyncAction()
async function submit() {
  await run(async () => {
    await api('/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value.trim().toLowerCase() },
    })
    sent.value = true
  }, 'No se pudo solicitar el correo. Intenta nuevamente más tarde.')
}
</script>
<template>
  <UCard class="max-w-md mx-auto">
    <template #header
      ><h1 class="font-bold text-xl">Recuperar contraseña</h1></template
    >
    <form class="space-y-4" @submit.prevent="submit">
      <p>
        Introduce el correo asociado a tu cuenta para solicitar un enlace de
        recuperación.
      </p>
      <UFormField label="Correo electrónico" required
        ><UInput
          v-model="email"
          type="email"
          autocomplete="email"
          :maxlength="254"
          required
          class="w-full"
          :disabled="pending"
      /></UFormField>
      <UAlert
        v-if="sent"
        color="success"
        title="Solicitud recibida"
        description="Si el correo corresponde a una cuenta activa, recibirás un enlace. Revisa tu correo y la carpeta de spam. Una nueva solicitud reemplaza el enlace anterior."
      />
      <UAlert v-if="error" color="error" :title="error" />
      <UButton type="submit" :loading="pending">{{
        sent ? 'Solicitar otro enlace' : 'Enviar enlace'
      }}</UButton>
      <NuxtLink to="/login" class="block text-primary"
        >Volver a iniciar sesión</NuxtLink
      >
    </form>
  </UCard>
</template>
