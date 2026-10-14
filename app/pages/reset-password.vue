<script setup lang="ts">
const api = useApi()
const auth = useAuth()
const route = useRoute()
const router = useRouter()
const token = ref('')
const ready = ref(false)
const password = ref('')
const confirmation = ref('')
const done = ref(false)
const { pending, error, run } = useAsyncAction()
useHead({
  title: 'Establecer contraseña | Tienda',
  meta: [
    { name: 'referrer', content: 'no-referrer' },
    { name: 'robots', content: 'noindex, nofollow' },
  ],
})
onMounted(async () => {
  const value = new URLSearchParams(route.hash.slice(1)).get('token') ?? ''
  token.value = /^[a-f0-9]{64}$/.test(value) ? value : ''
  if (route.hash) await router.replace({ path: route.path, hash: '' })
  ready.value = true
})
const valid = computed(
  () =>
    password.value.length >= 12 &&
    password.value.length <= 128 &&
    password.value === confirmation.value &&
    !!token.value,
)
async function submit() {
  if (!valid.value) return
  await run(async () => {
    await api('/auth/reset-password', {
      method: 'POST',
      body: { token: token.value, newPassword: password.value },
    })
    token.value = ''
    password.value = ''
    confirmation.value = ''
    auth.user.value = null
    clearNuxtData()
    done.value = true
  }, 'No se pudo cambiar la contraseña. El enlace puede haber caducado o ya haberse utilizado.')
}
</script>
<template>
  <UCard class="max-w-md mx-auto">
    <template #header
      ><h1 class="font-bold text-xl">Establecer contraseña</h1></template
    >
    <p v-if="!ready" role="status">Comprobando enlace...</p>
    <UAlert
      v-else-if="done"
      color="success"
      title="Contraseña actualizada"
      description="Las sesiones anteriores se cerraron. Inicia sesión con tu nueva contraseña."
    />
    <UAlert
      v-else-if="!token"
      color="warning"
      title="Enlace inválido o incompleto"
      description="Abre el enlace de tu correo o solicita uno nuevo. Si recargaste esta pantalla, vuelve a abrir el enlace del correo."
    />
    <form v-else class="space-y-4" @submit.prevent="submit">
      <UFormField label="Nueva contraseña (12 a 128 caracteres)" required
        ><UInput
          v-model="password"
          type="password"
          autocomplete="new-password"
          :minlength="12"
          :maxlength="128"
          :disabled="pending"
          required
          class="w-full"
      /></UFormField>
      <UFormField
        label="Confirmar contraseña"
        :error="
          confirmation && confirmation !== password
            ? 'Las contraseñas no coinciden'
            : undefined
        "
        required
        ><UInput
          v-model="confirmation"
          type="password"
          autocomplete="new-password"
          :maxlength="128"
          :disabled="pending"
          required
          class="w-full"
      /></UFormField>
      <UAlert v-if="error" color="error" :title="error" />
      <UButton type="submit" :loading="pending" :disabled="!valid"
        >Guardar contraseña</UButton
      >
    </form>
    <div class="mt-4 flex flex-wrap gap-3">
      <UButton v-if="done" to="/login">Iniciar sesión</UButton
      ><UButton v-else to="/forgot-password" color="neutral" variant="outline"
        >Solicitar otro enlace</UButton
      >
    </div>
  </UCard>
</template>
