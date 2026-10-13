<script setup lang="ts">
import { ROLE_LABELS } from '~/utils/roles'
const api = useApi()
import type { AuthUser } from '~/types/auth'
const auth = useAuth()
const name = ref(auth.user.value?.name ?? '')
const passwords = reactive({ currentPassword: '', newPassword: '' })
const customer = reactive({ document: '', phone: '' })
const busy = ref(false),
  message = ref(''),
  error = ref('')
if (auth.user.value?.role === 'CUSTOMER') {
  const result = await api<{ document: string | null; phone: string | null }>('/auth/customer')
  customer.document = result.document ?? ''
  customer.phone = result.phone ?? ''
}
async function save(action: 'profile' | 'customer' | 'password') {
  busy.value = true
  message.value = ''
  error.value = ''
  try {
    if (action === 'profile')
      auth.user.value = await api<AuthUser>('/auth/profile', {
        method: 'PATCH',
        body: { name: name.value },
      })
    if (action === 'customer')
      await api('/auth/customer', {
        method: 'PATCH',
        body: {
          document: customer.document || null,
          phone: customer.phone || null,
        },
      })
    if (action === 'password') {
      await api('/auth/password', { method: 'POST', body: passwords })
      auth.user.value = null
      clearNuxtData()
      await navigateTo('/login')
      return
    }
    message.value = 'Cambios guardados.'
  } catch {
    error.value = 'No se pudo guardar. Revisa los datos y tu sesión.'
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="max-w-xl mx-auto space-y-6">
    <UBreadcrumb :items="[{ label: 'Inicio', to: '/' }, { label: 'Mi cuenta' }]" />
    <h1 class="text-2xl font-bold">Mi cuenta</h1>
    <p>
      {{ auth.user.value?.email }} ·
      {{ ROLE_LABELS[auth.user.value?.role ?? 'CUSTOMER'] }}
    </p>
    <p v-if="message" role="status" class="text-green-600">{{ message }}</p>
    <p v-if="error" role="alert" class="text-red-600">{{ error }}</p>
    <UCard
      ><form class="space-y-4" @submit.prevent="save('profile')">
        <UFormField label="Nombre" required
          ><UInput
            v-model="name"
            minlength="2"
            maxlength="100"
            required
            class="w-full" /></UFormField
        ><UButton type="submit" :disabled="busy" :loading="busy">Guardar nombre</UButton>
      </form></UCard
    >
    <UCard v-if="auth.user.value?.role === 'CUSTOMER'"
      ><form class="space-y-4" @submit.prevent="save('customer')">
        <h2 class="font-semibold">Datos del cliente</h2>
        <UFormField label="Documento"
          ><UInput v-model="customer.document" maxlength="50" class="w-full" /></UFormField
        ><UFormField label="Teléfono"
          ><UInput v-model="customer.phone" type="tel" maxlength="30" class="w-full" /></UFormField
        ><UButton type="submit" :disabled="busy" :loading="busy">Guardar datos</UButton>
      </form></UCard
    >
    <UCard
      ><form class="space-y-4" @submit.prevent="save('password')">
        <h2 class="font-semibold">Cambiar contraseña</h2>
        <p class="text-sm text-muted">Se cerrarán todas tus sesiones.</p>
        <UFormField label="Contraseña actual" required
          ><UInput
            v-model="passwords.currentPassword"
            type="password"
            autocomplete="current-password"
            required
            class="w-full" /></UFormField
        ><UFormField label="Nueva contraseña" help="Entre 12 y 128 caracteres" required
          ><UInput
            v-model="passwords.newPassword"
            type="password"
            minlength="12"
            maxlength="128"
            autocomplete="new-password"
            required
            class="w-full" /></UFormField
        ><UButton type="submit" :disabled="busy" :loading="busy">Cambiar contraseña</UButton>
      </form></UCard
    >
  </div>
</template>
