<script setup lang="ts">
import type { NotificationPage } from '~/types/notification'
const { data, refresh } = await useApiFetch<NotificationPage>(
  '/notifications',
  { query: { limit: 1, status: 'UNREAD' } },
)
useLiveRefresh(refresh, 30000)
</script>
<template>
  <UButton
    to="/notifications"
    icon="i-lucide-bell"
    color="neutral"
    variant="ghost"
    :aria-label="'Notificaciones: ' + (data?.unread ?? 0) + ' sin leer'"
    ><span v-if="data?.unread">{{ data.unread }}</span></UButton
  >
</template>
