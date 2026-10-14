<script setup lang="ts">
import type { AuthUser } from '~/types/auth'
import { apiErrorStatus } from '~/utils/api-error'
const api = useApi()
const auth = useAuth()
const route = useRoute()
const email = ref('')
const password = ref('')
const { pending: busy, error, run } = useAsyncAction()
const redirect = computed(() =>
  typeof route.query.redirect === 'string' ? route.query.redirect : undefined,
)
const registerLink = computed(() => ({
  path: '/register',
  query: { redirect: redirect.value },
}))
async function submit() {
  if (busy.value) return
  await run(async () => {
    try {
      auth.user.value = await api<AuthUser>('/auth/login', {
        method: 'POST',
        body: {
          email: email.value.trim().toLowerCase(),
          password: password.value,
        },
      })
    } catch (cause) {
      const status = apiErrorStatus(cause)
      if (status === 401)
        throw new Error(
          'El correo o la contraseña no son correctos. Revisa tus datos e inténtalo de nuevo.',
        )
      if (status === 429)
        throw new Error(
          'Has realizado varios intentos. Espera un minuto antes de volver a ingresar.',
        )
      throw cause
    }
    clearNuxtData()
    const target = redirect.value ?? ''
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
  }, 'No se pudo iniciar sesión. Inténtalo nuevamente en unos momentos.')
}
</script>

<template>
  <AuthPanel mode="login">
    <div class="mb-7">
      <p class="section-eyebrow text-primary">Bienvenido de vuelta</p>
      <h1 class="mt-2 text-3xl font-extrabold tracking-tight">
        Iniciar sesión
      </h1>
      <p class="mt-3 text-sm text-muted leading-relaxed">
        Ingresa tus datos para acceder a tu cuenta.
      </p>
    </div>
    <UAlert
      v-if="route.query.registered === '1'"
      class="mb-6"
      color="success"
      variant="soft"
      icon="i-lucide-circle-check"
      title="Tu cuenta está lista"
      description="Ya puedes iniciar sesión con el correo y la contraseña que elegiste."
    />
    <form class="space-y-5" :aria-busy="busy" @submit.prevent="submit">
      <UFormField label="Correo electrónico" required
        ><UInput
          v-model="email"
          name="email"
          type="email"
          autocomplete="username"
          :maxlength="254"
          placeholder="tu@correo.com"
          icon="i-lucide-mail"
          size="lg"
          required
          :disabled="busy"
          class="w-full"
          :ui="{ base: 'rounded-xl' }"
      /></UFormField>
      <UFormField label="Contraseña" required
        ><PasswordInput
          v-model="password"
          name="password"
          autocomplete="current-password"
          :maxlength="128"
          placeholder="Tu contraseña"
          required
          :disabled="busy"
      /></UFormField>
      <div class="flex justify-end">
        <NuxtLink
          to="/forgot-password"
          class="text-sm font-semibold text-primary hover:underline"
          >¿Olvidaste tu contraseña?</NuxtLink
        >
      </div>
      <UAlert
        v-if="error"
        role="alert"
        color="error"
        variant="soft"
        icon="i-lucide-circle-alert"
        title="No pudimos iniciar sesión"
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
        >{{ busy ? 'Ingresando…' : 'Ingresar' }}</UButton
      >
    </form>
    <div class="my-7 flex items-center gap-3" aria-hidden="true">
      <span class="flex-1 border-t border-default" /><span
        class="text-xs text-muted"
        >¿Primera vez por aquí?</span
      ><span class="flex-1 border-t border-default" />
    </div>
    <UButton
      :to="registerLink"
      color="neutral"
      variant="outline"
      size="lg"
      block
      class="rounded-xl"
      icon="i-lucide-user-round-plus"
      >Crear cuenta de cliente</UButton
    >
  </AuthPanel>
</template>
