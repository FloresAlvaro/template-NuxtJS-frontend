<script setup lang="ts">
import type { ProductApi } from '~/types/product'
const props = defineProps<{ product: ProductApi }>()
const emit = defineEmits<{ changed: []; busy: [value: boolean] }>()
const fileInputId = useId()
const auth = useAuth()
const api = useApi()
const toast = useAppToast()
const { getApiErrorMessage } = useApiErrorMessage()
const file = ref<File | null>(null)
const preview = ref<string | null>(null)
const input = ref<HTMLInputElement | null>(null)
const imageUrl = ref(props.product.imageUrl)
const revision = ref(0)
const pending = ref(false)
const error = ref('')
const confirmRemove = ref(false)
const displayedImage = computed(() => preview.value || (imageUrl.value ? `${imageUrl.value}?v=${revision.value}` : null))
function clearFile() {
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = null
  file.value = null
  if (input.value) input.value.value = ''
}
function select(event: Event) {
  const selected = (event.target as HTMLInputElement).files?.[0]
  clearFile()
  error.value = ''
  if (!selected) return
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(selected.type)) {
    error.value = 'Selecciona una imagen JPEG, PNG o WebP.'
    return
  }
  if (selected.size > 5 * 1024 * 1024) {
    error.value = 'La imagen debe pesar como máximo 5 MiB.'
    return
  }
  file.value = selected
  preview.value = URL.createObjectURL(selected)
  confirmRemove.value = false
}
async function save(remove = false) {
  if (pending.value || (!remove && !file.value)) return
  pending.value = true
  emit('busy', true)
  error.value = ''
  try {
    const body = new FormData()
    if (file.value) body.append('file', file.value)
    const result = await api<{ imageUrl: string | null }>(`/products/${props.product.productId}/image`, { method: remove ? 'DELETE' : 'POST', ...(remove ? {} : { body }) })
    imageUrl.value = result.imageUrl
    revision.value++
    clearFile()
    confirmRemove.value = false
    toast.success(remove ? 'Foto eliminada' : 'Foto guardada')
    emit('changed')
  } catch (cause) { error.value = getApiErrorMessage(cause, 'No se pudo guardar el cambio. Vuelve a intentarlo.') }
  finally { pending.value = false; emit('busy', false) }
}
onBeforeRouteLeave(() => !pending.value)
onBeforeUnmount(clearFile)
</script>
<template>
  <div class="space-y-4">
    <ProductPhoto :src="displayedImage" :name="product.name" class="h-64 w-full rounded-2xl" />
    <UAlert v-if="error" color="error" :title="error" />
    <template v-if="auth.isAdmin.value">
      <div class="space-y-2"><label :for="fileInputId" class="block text-sm font-medium">Seleccionar foto</label>
        <input :id="fileInputId" :aria-describedby="`${fileInputId}-help`" ref="input" type="file" accept="image/jpeg,image/png,image/webp" :disabled="pending" class="block w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-violet-100 file:px-4 file:py-2 file:font-semibold file:text-violet-700 disabled:opacity-50" @change="select" />
        <p :id="`${fileInputId}-help`" class="text-sm text-muted">JPEG, PNG o WebP estático · máximo 5 MiB y 16 megapíxeles.</p>
      </div>
      <p v-if="file" class="text-sm text-muted break-all">Vista previa de {{ file.name }}. Pulsa Guardar foto para aplicar el cambio.</p>
      <div class="flex flex-wrap gap-2">
        <UButton icon="i-lucide-upload" :loading="pending" :disabled="!file || pending" @click="save()">Guardar foto</UButton>
        <UButton v-if="file" color="neutral" variant="ghost" :disabled="pending" @click="clearFile">Descartar selección</UButton>
        <UButton v-if="imageUrl && !confirmRemove" color="error" variant="soft" icon="i-lucide-trash-2" :disabled="pending" @click="() => { confirmRemove = true }">Eliminar foto</UButton>
      </div>
      <div v-if="confirmRemove" class="rounded-xl border border-default p-4 space-y-3"><p class="text-sm">¿Eliminar la foto actual de este producto?</p><div class="flex gap-2"><UButton color="error" :loading="pending" :disabled="pending" @click="save(true)">Eliminar foto</UButton><UButton color="neutral" variant="ghost" :disabled="pending" @click="() => { confirmRemove = false }">Cancelar</UButton></div></div>
    </template>
    <p v-else class="text-sm text-muted">Solo un administrador puede cambiar la foto.</p>
  </div>
</template>
