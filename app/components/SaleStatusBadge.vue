<script setup lang="ts">
import type { SaleApi } from '~/types/sale'
import { saleStatusLabels } from '~/utils/sale-labels'
defineProps<{ status: SaleApi['status'] }>()
const colors = { ACTIVE: 'success', PARTIALLY_RETURNED: 'warning', RETURNED: 'info', CANCELLED: 'error' } as const
</script>
<template><UBadge :color="colors[status]" variant="subtle" class="whitespace-nowrap">{{ saleStatusLabels[status] }}</UBadge></template>
