export function useAsyncAction() {
  const pending = ref(false)
  const error = ref('')
  const { getApiErrorMessage } = useApiErrorMessage()
  const start = () => {
    error.value = ''
    pending.value = true
  }
  const stop = () => {
    pending.value = false
  }
  async function run(action: () => Promise<void>, fallback: string) {
    if (pending.value) return false
    start()
    try {
      await action()
      return true
    } catch (cause) {
      error.value = getApiErrorMessage(cause, fallback)
      return false
    } finally {
      stop()
    }
  }
  return { pending, error, start, stop, run }
}
