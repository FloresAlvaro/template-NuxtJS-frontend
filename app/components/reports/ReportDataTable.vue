<script setup lang="ts">
defineProps<{
  title: string
  columns: { key: string; label: string }[]
  rows: Record<string, string>[]
}>()
</script>
<template>
  <details class="border-t border-default pt-4">
    <summary
      class="cursor-pointer text-sm font-semibold text-primary hover:underline"
    >
      Ver datos de {{ title.toLowerCase() }}
    </summary>
    <div class="mt-4 max-h-80 overflow-auto rounded-xl border border-default">
      <table class="w-full text-sm">
        <caption class="sr-only">
          {{
            title
          }}
        </caption>
        <thead class="bg-elevated">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              class="px-4 py-3 text-left font-semibold whitespace-nowrap"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in rows"
            :key="index"
            class="border-t border-default"
          >
            <td
              v-for="column in columns"
              :key="column.key"
              class="px-4 py-3 tabular-nums"
            >
              {{ row[column.key] }}
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td :colspan="columns.length" class="p-4 text-muted">
              Sin registros.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </details>
</template>
