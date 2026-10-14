<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
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
const roles = ROLES.map(value => ({ value, label: ROLE_LABELS[value] }))
const roleColors = { ADMIN: 'primary', SELLER: 'info', CUSTOMER: 'neutral' } as const
const userColumns: TableColumn<AuthUser>[] = [
  { accessorKey: 'name', header: 'Usuario' },
  { accessorKey: 'email', header: 'Correo electrónico' },
  { accessorKey: 'role', header: 'Rol' },
  { accessorKey: 'isActive', header: 'Estado' },
  { id: 'actions', header: 'Acciones' },
]
const columns: TableColumn<AuthUser>[] = userColumns.map(column => ({
  ...column,
  meta: { ...column.meta, class: { ...column.meta?.class, th: 'text-center', td: 'text-center' } },
}))
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
  if (busy.value) return
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
  if (!resetUser.value || busy.value) return
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
  <div class="space-y-6">
    <UBreadcrumb :items="[{ label: 'Inicio', to: '/' }, { label: 'Usuarios' }]" />
    <WorkspaceHeader eyebrow="Administración" title="Usuarios" icon="i-lucide-users-round" description="Organiza las cuentas, sus roles y el acceso al espacio de trabajo.">
      <template #actions><UButton icon="i-lucide-user-plus" size="lg" color="neutral" :disabled="busy" :ui="{ base: 'bg-white text-violet-950 hover:bg-violet-100' }" @click="edit()">Nuevo usuario</UButton></template>
    </WorkspaceHeader>
    <div class="grid gap-3 sm:grid-cols-3">
      <div v-for="role in ROLES" :key="role" class="rounded-2xl border border-default bg-default p-5">
        <div class="flex items-center gap-3"><span class="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><UIcon :name="role === 'ADMIN' ? 'i-lucide-shield-check' : role === 'SELLER' ? 'i-lucide-receipt' : 'i-lucide-shopping-bag'" class="size-5" /></span><h2 class="font-semibold">{{ labels[role] }}</h2></div>
        <p class="mt-3 text-sm leading-relaxed text-muted">{{ role === 'ADMIN' ? 'Gestiona usuarios, catálogo, inventario y reportes.' : role === 'SELLER' ? 'Registra ventas y cobros; gestiona clientes y pedidos.' : 'Consulta el catálogo, sus pedidos y su cuenta.' }}</p>
      </div>
    </div>
    <UAlert v-if="message" color="success" variant="subtle" icon="i-lucide-circle-check" :title="message" />
    <section class="space-y-4" aria-labelledby="users-list-title">
      <div class="flex flex-wrap items-center justify-between gap-3"><div><h2 id="users-list-title" class="text-lg font-bold">Cuentas de la tienda</h2><p class="mt-1 text-sm text-muted">Consulta el estado de cada cuenta y administra sus permisos.</p></div><UButton color="neutral" variant="outline" icon="i-lucide-refresh-cw" :loading="pending" :disabled="pending || busy" @click="refresh()">Actualizar</UButton></div>
      <UAlert v-if="error" color="error" variant="subtle" title="No se pudieron cargar los usuarios"><template #actions><UButton color="neutral" variant="outline" @click="refresh()">Reintentar</UButton></template></UAlert>
      <div v-else-if="pending" role="status" class="space-y-3 rounded-2xl border border-default bg-default p-6"><span class="text-sm text-muted">Cargando usuarios...</span><USkeleton v-for="item in 3" :key="item" class="h-12 w-full" /></div>
      <GenericTable v-else-if="data?.items.length" :data="data.items" :columns="columns">
        <template #name="{ row }"><div class="flex items-center justify-center gap-3"><span class="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 font-bold text-primary" aria-hidden="true">{{ row.original.name.slice(0, 1).toUpperCase() }}</span><div><span class="font-semibold text-highlighted">{{ row.original.name }}</span><span v-if="row.original.userId === auth.user.value?.userId" class="mt-1 block text-xs text-primary">Tu cuenta</span></div></div></template>
        <template #role="{ row }"><UBadge :color="roleColors[row.original.role]" variant="subtle">{{ labels[row.original.role] }}</UBadge></template>
        <template #isActive="{ row }"><ActiveStatusBadge :active="row.original.isActive" /></template>
        <template #actions="{ row }"><div class="flex flex-wrap items-center justify-center gap-2"><UButton icon="i-lucide-pencil" color="neutral" variant="soft" :disabled="busy" :aria-label="`Editar ${row.original.name}`" @click="edit(row.original)">Editar</UButton><UButton icon="i-lucide-key-round" color="neutral" variant="outline" :disabled="busy" :aria-label="`Restablecer contraseña de ${row.original.name}`" @click="openReset(row.original)">Contraseña</UButton></div></template>
      </GenericTable>
      <div v-else class="rounded-2xl border border-dashed border-default p-10 text-center"><UIcon name="i-lucide-users-round" class="size-10 text-muted" /><h3 class="mt-3 font-semibold">Sin usuarios para mostrar</h3><p class="mt-2 text-sm text-muted">Crea una cuenta para incorporar a alguien a la tienda.</p></div>
      <ListPagination v-if="!error && !pending && data" v-model="page" :total="data.total" :limit="20" :pending="busy" />
    </section>
    <UAlert color="neutral" variant="subtle" icon="i-lucide-shield-check" title="Accesos protegidos" description="Cambiar el rol, desactivar una cuenta o restablecer su contraseña cierra sus sesiones. El sistema protege al último administrador activo." />
    <UModal v-model:open="open" :title="editing ? 'Editar usuario' : 'Nuevo usuario'" :description="editing ? 'Actualiza el nombre, rol y estado de la cuenta.' : 'Crea una cuenta y define su función en la tienda.'" :close="!busy" :dismissible="!busy"
      ><template #body
        ><form class="space-y-4" @submit.prevent="save">
          <UFormField label="Nombre" required
            ><UInput v-model="form.name" minlength="2" maxlength="100" required :disabled="busy" autocomplete="name" icon="i-lucide-user-round" class="w-full"
          /></UFormField>
          <UFormField label="Correo electrónico" required
            ><UInput
              v-model="form.email"
              type="email"
              maxlength="254"
              :disabled="!!editing || busy"
              autocomplete="email"
              icon="i-lucide-mail"
              required
              class="w-full"
          /></UFormField>
          <UFormField
            v-if="!editing"
            label="Contraseña inicial"
            help="Entre 12 y 128 caracteres"
            required
            ><PasswordInput
              v-model="form.password"
              :disabled="busy"
              type="password"
              minlength="12"
              maxlength="128"
              autocomplete="new-password"
              required
              class="w-full"
          /></UFormField>
          <UFormField label="Rol"
            ><USelect v-model="form.role" :items="roles" :disabled="busy || editing?.userId === auth.user.value?.userId" class="w-full" /></UFormField>
          <UCheckbox
            v-if="editing"
            v-model="form.isActive"
            label="Cuenta activa"
            :disabled="busy || editing.userId === auth.user.value?.userId"
          />
          <p class="text-sm text-muted">
            Cambiar el rol o desactivar la cuenta cierra sus sesiones.
          </p>
          <UAlert v-if="formError" color="error" variant="subtle" :title="formError" />
          <div class="flex flex-wrap justify-end gap-3"><UButton color="neutral" variant="outline" :disabled="busy" @click="() => { open = false }">Cancelar</UButton><UButton type="submit" icon="i-lucide-check" :disabled="busy" :loading="busy">{{ editing ? 'Guardar cambios' : 'Crear usuario' }}</UButton></div>
        </form></template
      ></UModal
    >
    <UModal
      :open="!!resetUser"
      title="Restablecer contraseña"
      description="Define una nueva contraseña para esta cuenta."
      :close="!busy"
      :dismissible="!busy"
      @update:open="
        (value) => {
          if (!value && !busy) resetUser = null
        }
      "
      ><template #body
        ><form class="space-y-4" @submit.prevent="reset">
          <UAlert color="warning" variant="subtle" icon="i-lucide-key-round" title="Se cerrarán las sesiones" :description="`La nueva contraseña se aplicará a ${resetUser?.name ?? 'la cuenta seleccionada'}.`" />
          <UFormField label="Nueva contraseña" help="Entre 12 y 128 caracteres" required
            ><PasswordInput
              v-model="resetPassword"
              :disabled="busy"
              type="password"
              minlength="12"
              maxlength="128"
              autocomplete="new-password"
              required
              class="w-full"
          /></UFormField>
          <UAlert v-if="formError" color="error" variant="subtle" :title="formError" />
          <div class="flex flex-wrap justify-end gap-3"><UButton color="neutral" variant="outline" :disabled="busy" @click="() => { resetUser = null }">Cancelar</UButton><UButton type="submit" icon="i-lucide-key-round" :disabled="busy" :loading="busy">Restablecer contraseña</UButton></div>
        </form></template
      ></UModal
    >
  </div>
</template>

