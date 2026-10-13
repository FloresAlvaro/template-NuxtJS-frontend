export const useModalAction = () => {
  const open = ref(false)
  const action = useAsyncAction()
  return {
    open,
    isSaving: action.pending,
    submitError: action.error,
    openModal: () => {
      action.error.value = ''
      open.value = true
    },
    closeModal: () => {
      open.value = false
    },
    run: action.run,
  }
}
