<script setup lang="ts">
import type {
  NotificationPage,
  OrderNotificationApi,
} from '~/types/notification'
const auth = useAuth(),
  api = useApi()
const { page, status } = usePagedSearchFilters([
  'PENDING',
  'SENT',
  'FAILED',
  'UNREAD',
])
const query = computed(() => ({
  page: page.value,
  limit: 20,
  status: status.value === 'all' ? undefined : status.value,
}))
const { data, pending, error, refresh } = await useApiFetch<NotificationPage>(
  '/notifications',
  { query },
)
useLiveRefresh(refresh, 30000)
const { pending: saving, error: actionError, run } = useAsyncAction()
const { getApiErrorMessage } = useApiErrorMessage()
async function markRead(notice: OrderNotificationApi) {
  await run(async () => {
    await api('/notifications/' + notice.notificationId + '/read', {
      method: 'PATCH',
    })
    await refresh()
  }, 'No se pudo marcar el aviso como leído')
}
async function retry(notice: OrderNotificationApi) {
  await run(async () => {
    await api('/notifications/' + notice.notificationId + '/retry', {
      method: 'POST',
    })
    await refresh()
  }, 'No se pudo reintentar el envío')
}
</script>
<template>
  <div class="space-y-6">
    <UBreadcrumb
      :items="[{ label: 'Inicio', to: '/' }, { label: 'Notificaciones' }]"
    /><WorkspaceHeader
      eyebrow="Gestión de tienda"
      :title="
        auth.isAdmin.value ? 'Notificaciones de pedidos' : 'Mis notificaciones'
      "
      icon="i-lucide-bell"
      :description="
        auth.isAdmin.value
          ? 'Consulta entregas por correo y reintenta los envíos fallidos.'
          : 'Avisos sobre la confirmación, retiro, cancelación y vencimiento de tus pedidos.'
      "
      ><template #actions
        ><UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-refresh-cw"
          @click="refresh()"
          >Actualizar</UButton
        ></template
      ></WorkspaceHeader
    >
    <UFormField label="Filtrar avisos"
      ><USelect
        id="notification-status"
        v-model="status"
        :items="[
          { label: 'Todos', value: 'all' },
          { label: 'Sin leer', value: 'UNREAD' },
          ...(auth.isAdmin.value
            ? [
                { label: 'Pendientes de envío', value: 'PENDING' },
                { label: 'Enviados por correo', value: 'SENT' },
                { label: 'Sin entrega tras reintentos', value: 'FAILED' },
              ]
            : []),
        ]"
        class="w-full sm:w-80"
    /></UFormField>
    <UAlert
      v-if="error"
      color="error"
      :title="getApiErrorMessage(error, 'No se pudieron consultar los avisos')"
    /><UAlert v-if="actionError" color="error" :title="actionError" />
    <p v-if="pending" role="status">Cargando avisos...</p>
    <template v-else-if="!error"
      ><UCard v-for="notice in data?.items" :key="notice.notificationId"
        ><div class="space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="font-semibold">{{ notice.subject }}</h2>
            <UBadge v-if="!notice.readAt" variant="subtle">{{
              auth.isAdmin.value ? 'Cliente sin leer' : 'Sin leer'
            }}</UBadge>
          </div>
          <p class="text-sm whitespace-pre-wrap">{{ notice.body }}</p>
          <p class="text-xs text-muted">
            {{ formatStoreDate(notice.createdAt) }}
          </p>
          <div v-if="auth.isAdmin.value" class="space-y-2 text-sm">
            <p>Destinatario: {{ notice.recipient }}</p>
            <UBadge
              :color="
                notice.deliveredAt
                  ? 'success'
                  : notice.attempts >= 8
                    ? 'error'
                    : 'warning'
              "
              variant="subtle"
              >{{
                notice.deliveredAt
                  ? 'Aceptado por SMTP'
                  : notice.attempts >= 8
                    ? 'Entrega sin confirmar'
                    : 'Pendiente de envío'
              }}
              · {{ notice.attempts }} intentos</UBadge
            >
            <p v-if="notice.lastError" class="text-muted">
              {{ notice.lastError }}
            </p>
            <p
              v-if="
                !notice.deliveredAt &&
                notice.attempts > 0 &&
                notice.attempts < 8
              "
              class="text-xs text-muted"
            >
              Próximo intento: {{ formatStoreDate(notice.nextAttemptAt) }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <UButton
              :to="'/orders/' + notice.orderId"
              icon="i-lucide-eye"
              color="neutral"
              variant="soft"
              >Ver pedido</UButton
            ><UButton
              v-if="!auth.isAdmin.value && !notice.readAt"
              color="neutral"
              variant="outline"
              :disabled="saving"
              @click="markRead(notice)"
              >Marcar como leído</UButton
            ><UButton
              v-if="
                auth.isAdmin.value && !notice.deliveredAt && notice.attempts > 0
              "
              color="neutral"
              variant="outline"
              :disabled="saving"
              @click="retry(notice)"
              >Reintentar envío</UButton
            >
          </div>
        </div></UCard
      >
      <p v-if="!data?.items.length">
        No hay avisos que coincidan con el filtro.
      </p></template
    ><ListPagination
      v-if="data && !error"
      v-model="page"
      :total="data.total"
      :limit="20"
      :pending="pending"
      label="avisos"
    />
  </div>
</template>
