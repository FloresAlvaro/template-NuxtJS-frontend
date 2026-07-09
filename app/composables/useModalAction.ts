export const useModalAction = () => {
  const open = ref(false)
  const isSaving = ref(false)
  const submitError = ref('')

  const openModal = () => {
    open.value = true
  }

  const closeModal = () => {
    open.value = false
  }

  const resetError = () => {
    submitError.value = ''
  }

  const startSaving = () => {
    submitError.value = ''
    isSaving.value = true
  }

  const stopSaving = () => {
    isSaving.value = false
  }

  return {
    open,
    isSaving,
    submitError,
    openModal,
    closeModal,
    resetError,
    startSaving,
    stopSaving
  }
}
