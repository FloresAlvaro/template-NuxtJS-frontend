<script setup lang="ts">
import { ROLE_LABELS, ROLES } from '~/utils/roles'
const api = useApi()
import type { AuthUser, Role } from '~/types/auth'
const auth = useAuth()
const page = ref(1)
const { data, pending, error, refresh } = await useApiFetch<{
  items: AuthUser[]
  total: number
}>('/users', { query: { page, limit: 20 } })
const labels = ROLE_LABELS
const roles = ROLES
const open = ref(false),
  editing = ref<AuthUser | null>(null),
  busy = ref(false),
  message = ref(''),
  formError = ref('')
const form = reactive({
  name: '',
  email: '',
  password: '',
  role: 'SELLER' as Role,
  isActive: true,
})
const resetUser = ref<AuthUser | null>(null),
  resetPassword = ref('')
function edit(user?: AuthUser) {
  editing.value = user ?? null
  formError.value = ''
  Object.assign(form, {
    name: user?.name ?? '',
    email: user?.email ?? '',
    password: '',
    role: user?.role ?? 'SELLER',
    isActive: user?.isActive ?? true,
  })
  open.value = true
}
function openReset(user: AuthUser) {
  resetUser.value = user
  resetPassword.value = ''
  formError.value = ''
}
async function save() {
  busy.value = true
  formError.value = ''
  try {
    const before = editing.value
    await api(before ? `/users/${before.userId}` : '/users', {
      method: before ? 'PATCH' : 'POST',
      body: before
        ? {
            name: form.name,
            ...(before.role !== form.role ? { role: form.role } : {}),
            isActive: form.isActive,
          }
        : {
            name: form.name,
            email: form.email,
            password: form.password,
            role: form.role,
          },
    })
    open.value = false
    form.password = ''
    await refresh()
    message.value = 'Usuario guardado.'
    if (before?.userId === auth.user.value?.userId) await auth.refresh()
  } catch {
    formError.value =
      'No se pudo guardar. Revisa los datos, el correo o las restricciones del administrador.'
  } finally {
    busy.value = false
  }
}
async function reset() {
  if (!resetUser.value) return
  busy.value = true
  formError.value = ''
  try {
    const self = resetUser.value.userId === auth.user.value?.userId
    await api(`/users/${resetUser.value.userId}/password`, {
      method: 'POST',
      body: { password: resetPassword.value },
    })
    resetUser.value = null
    resetPassword.value = ''
    message.value = 'Contraseña restablecida y sesiones revocadas.'
    if (self) {
      auth.user.value = null
      clearNuxtData()
      await navigateTo('/login')
    }
  } catch {
    formError.value = 'No se pudo restablecer la contraseña.'
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="space-y-4">
    <UBreadcrumb :items="[{ label: 'Inicio', to: '/' }, { label: 'Usuarios' }]" />
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Usuarios</h1>
      <UButton icon="i-lucide-plus" @click="edit()">Nuevo usuario</UButton>
    </div>
    <p v-if="message" role="status" class="text-green-600">{{ message }}</p>
    <p v-if="pending">Cargando usuarios...</p>
    <p v-else-if="error" role="alert" class="text-red-600">No se pudieron cargar los usuarios.</p>
    <div v-else class="overflow-x-auto">
      <table class="w-full text-left">
        <thead>
          <tr class="border-b">
            <th class="p-3">Nombre</th>
            <th class="p-3">Correo</th>
            <th class="p-3">Rol</th>
            <th class="p-3 text-center">Estado</th>
            <th class="p-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in data?.items" :key="user.userId" class="border-b">
            <td class="p-3">{{ user.name }}</td>
            <td class="p-3">{{ user.email }}</td>
            <td class="p-3">{{ labels[user.role] }}</td>
            <td class="p-3 text-center"><ActiveStatusBadge :active="user.isActive" /></td>
            <td class="p-3">
              <div class="flex gap-2">
                <UButton
                  icon="i-lucide-pencil"
                  variant="soft"
                  :aria-label="`Editar ${user.name}`"
                  @click="edit(user)"
                /><UButton
                  icon="i-lucide-key-round"
                  variant="soft"
                  :aria-label="`Restablecer contraseña de ${user.name}`"
                  @click="openReset(user)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="flex gap-3 items-center">
      <UButton
        variant="outline"
        :disabled="page <= 1 || pending"
        @click="
          () => {
            page--
          }
        "
        >Anterior</UButton
      ><span>Página {{ page }}</span
      ><UButton
        variant="outline"
        :disabled="page * 20 >= (data?.total ?? 0) || pending"
        @click="
          () => {
            page++
          }
        "
        >Siguiente</UButton
      >
    </div>
    <UModal v-model:open="open" :title="editing ? 'Editar usuario' : 'Nuevo usuario'"
      ><template #body
        ><form class="space-y-4" @submit.prevent="save">
          <UFormField label="Nombre" required
            ><UInput v-model="form.name" minlength="2" maxlength="100" required class="w-full"
          /></UFormField>
          <UFormField label="Correo electrónico" required
            ><UInput
              v-model="form.email"
              type="email"
              maxlength="254"
              :disabled="!!editing"
              required
              class="w-full"
          /></UFormField>
          <UFormField
            v-if="!editing"
            label="Contraseña inicial"
            help="Entre 12 y 128 caracteres"
            required
            ><UInput
              v-model="form.password"
              type="password"
              minlength="12"
              maxlength="128"
              autocomplete="new-password"
              required
              class="w-full"
          /></UFormField>
          <UFormField label="Rol"
            ><select
              v-model="form.role"
              :disabled="editing?.userId === auth.user.value?.userId"
              class="h-10 w-full rounded-md border border-default bg-default px-3"
            >
              <option v-for="role in roles" :key="role" :value="role">
                {{ labels[role] }}
              </option>
            </select></UFormField
          >
          <UCheckbox
            v-if="editing"
            v-model="form.isActive"
            label="Cuenta activa"
            :disabled="editing.userId === auth.user.value?.userId"
          />
          <p class="text-sm text-muted">
            Cambiar el rol o desactivar la cuenta cierra sus sesiones.
          </p>
          <p v-if="formError" role="alert" class="text-red-600">
            {{ formError }}
          </p>
          <UButton type="submit" :disabled="busy" :loading="busy">Guardar</UButton>
        </form></template
      ></UModal
    >
    <UModal
      :open="!!resetUser"
      title="Restablecer contraseña"
      @update:open="
        (value) => {
          if (!value) resetUser = null
        }
      "
      ><template #body
        ><form class="space-y-4" @submit.prevent="reset">
          <p>Se cerrarán todas las sesiones de {{ resetUser?.name }}.</p>
          <UFormField label="Nueva contraseña" required
            ><UInput
              v-model="resetPassword"
              type="password"
              minlength="12"
              maxlength="128"
              autocomplete="new-password"
              required
              class="w-full"
          /></UFormField>
          <p v-if="formError" role="alert" class="text-red-600">
            {{ formError }}
          </p>
          <UButton type="submit" :disabled="busy" :loading="busy">Restablecer</UButton>
        </form></template
      ></UModal
    >
  </div>
</template>

