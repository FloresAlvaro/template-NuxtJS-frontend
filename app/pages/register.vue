<script setup lang="ts">
import { apiErrorStatus } from '~/utils/api-error'
const api = useApi()
const route = useRoute()
const form = reactive({ name: '', email: '', password: '' })
const confirmation = ref('')
const confirmationTouched = ref(false)
const submitted = ref(false)
const { pending: busy, error, run } = useAsyncAction()
const loginLink = computed(() => ({
  path: '/login',
  query: {
    redirect:
      typeof route.query.redirect === 'string'
        ? route.query.redirect
        : undefined,
  },
}))
const passwordValid = computed(
  () => form.password.length >= 12 && form.password.length <= 128,
)
const passwordsMatch = computed(
  () => confirmation.value.length > 0 && form.password === confirmation.value,
)
const confirmationError = computed(() =>
  (confirmationTouched.value || submitted.value) && !passwordsMatch.value
    ? 'Las contraseñas no coinciden.'
    : undefined,
)
const nameError = computed(() =>
  submitted.value && form.name.trim().length < 2
    ? 'Escribe un nombre de al menos 2 caracteres.'
    : undefined,
)
async function submit() {
  if (busy.value) return
  submitted.value = true
  if (nameError.value || !passwordValid.value || !passwordsMatch.value) return
  await run(async () => {
    try {
      await api('/auth/register', {
        method: 'POST',
        body: {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        },
      })
    } catch (cause) {
      if (apiErrorStatus(cause) === 409)
        throw new Error(
          'Este correo ya está registrado. Inicia sesión o recupera tu contraseña.',
        )
      if (apiErrorStatus(cause) === 429)
        throw new Error(
          'Has realizado varios intentos. Espera un minuto y vuelve a intentarlo.',
        )
      throw cause
    }
    await navigateTo({
      ...loginLink.value,
      query: { ...loginLink.value.query, registered: '1' },
    })
  }, 'No se pudo crear la cuenta. Conservamos tus datos para que puedas volver a intentarlo.')
}
</script>

<template>
  <AuthPanel mode="register">
    <div class="mb-7">
      <p class="section-eyebrow text-primary">Hagamos espacio para ti</p>
      <h1 class="mt-2 text-3xl font-extrabold tracking-tight">
        Crea tu cuenta
      </h1>
      <p class="mt-3 text-sm text-muted leading-relaxed">
        Regístrate como cliente y empieza a preparar tus pedidos.
      </p>
    </div>
    <form class="space-y-5" :aria-busy="busy" @submit.prevent="submit">
      <UFormField label="Nombre" :error="nameError" required
        ><UInput
          v-model="form.name"
          name="name"
          :minlength="2"
          :maxlength="100"
          autocomplete="name"
          placeholder="¿Cómo te llamas?"
          icon="i-lucide-user-round"
          size="lg"
          required
          :disabled="busy"
          class="w-full"
          :ui="{ base: 'rounded-xl' }"
      /></UFormField>
      <UFormField label="Correo electrónico" required
        ><UInput
          v-model="form.email"
          name="email"
          type="email"
          :maxlength="254"
          autocomplete="email"
          placeholder="tu@correo.com"
          icon="i-lucide-mail"
          size="lg"
          required
          :disabled="busy"
          class="w-full"
          :ui="{ base: 'rounded-xl' }"
      /></UFormField>
      <UFormField
        label="Contraseña"
        help="Usa entre 12 y 128 caracteres."
        required
        ><PasswordInput
          v-model="form.password"
          name="password"
          :minlength="12"
          :maxlength="128"
          autocomplete="new-password"
          placeholder="Crea tu contraseña"
          required
          :disabled="busy"
      /></UFormField>
      <UFormField label="Repetir contraseña" :error="confirmationError" required
        ><PasswordInput
          v-model="confirmation"
          name="confirmation"
          label="confirmación de contraseña"
          :minlength="12"
          :maxlength="128"
          autocomplete="new-password"
          placeholder="Escríbela una vez más"
          required
          :disabled="busy"
          @blur="
            () => {
              confirmationTouched = true
            }
          "
      /></UFormField>
      <div
        v-if="form.password || confirmation"
        class="flex flex-wrap gap-3 text-xs"
        aria-live="polite"
      >
        <span
          class="inline-flex items-center gap-1.5"
          :class="passwordValid ? 'text-success' : 'text-muted'"
          ><UIcon
            :name="passwordValid ? 'i-lucide-circle-check' : 'i-lucide-circle'"
            class="size-4"
          />{{
            passwordValid ? 'Longitud correcta' : 'Mínimo 12 caracteres'
          }}</span
        >
        <span
          class="inline-flex items-center gap-1.5"
          :class="passwordsMatch ? 'text-success' : 'text-muted'"
          ><UIcon
            :name="passwordsMatch ? 'i-lucide-circle-check' : 'i-lucide-circle'"
            class="size-4"
          />{{
            passwordsMatch
              ? 'Las contraseñas coinciden'
              : 'Repite tu contraseña'
          }}</span
        >
      </div>
      <UAlert
        v-if="error"
        role="alert"
        color="error"
        variant="soft"
        icon="i-lucide-circle-alert"
        title="No pudimos crear tu cuenta"
        :description="error"
      />
      <UButton
        type="submit"
        size="lg"
        block
        class="rounded-xl"
        :loading="busy"
        :disabled="busy"
        trailing-icon="i-lucide-arrow-right"
        >{{ busy ? 'Creando tu cuenta…' : 'Crear mi cuenta' }}</UButton
      >
    </form>
    <p class="mt-6 text-center text-sm text-muted">
      ¿Ya tienes cuenta?
      <NuxtLink
        :to="loginLink"
        class="font-semibold text-primary hover:underline"
        >Inicia sesión</NuxtLink
      >
    </p>
  </AuthPanel>
</template>
