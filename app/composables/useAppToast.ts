// composables/useAppToast.ts
export const useAppToast = () => {
  const toast = useToast()

  // Toast para casos Exitosos (Verde)
  const success = (title: string, description?: string) => {
    toast.add({
      title,
      description,
      color: 'success',
      icon: 'i-heroicons-check-circle'
    })
  }

  // Toast para Errores (Rojo)
  const error = (title: string, description?: string) => {
    toast.add({
      title,
      description,
      color: 'error',
      icon: 'i-heroicons-x-circle'
    })
  }

  // Toast para Advertencias / Info (Amarillo/Azul si lo deseas)
  const warn = (title: string, description?: string) => {
    toast.add({
      title,
      description,
      color: 'warning',
      icon: 'i-heroicons-exclamation-triangle'
    })
  }

  return {
    success,
    error,
    warn
  }
}