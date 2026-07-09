<script setup lang="ts"></script>

<template>
    <!-- Decimos que el contenedor tiene 12 columnas en total -->
    <main class="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 p-4">
        <!-- Ocupa 3 de 12 partes -->
        <div class="md:col-span-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p>Izquierda (2/12)</p>
        </div>
        <!-- Ocupa 8 de 12 partes (El doble que las otras) -->
        <div class="md:col-span-8 bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h1>Aca tiene que venir info (8/12)</h1>
        </div>
        <!-- Ocupa 2 de 12 partes -->
        <div class="md:col-span-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <p>Derecha (2/12)</p>
        </div>
    </main>
</template>