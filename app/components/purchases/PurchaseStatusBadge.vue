<script setup lang="ts">
import type { PurchaseStatus } from '~/types/purchase'
defineProps<{ status: PurchaseStatus }>()
</script>
<template>
  <UBadge
    :color="
      status === 'RECEIVED'
        ? 'success'
        : status === 'CANCELLED'
          ? 'neutral'
          : 'warning'
    "
    variant="subtle"
    >{{ purchaseStatusLabels[status] }}</UBadge
  >
</template>
