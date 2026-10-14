export function useSearchText() {
  const input = ref('')
  const search = ref('')
  let timer: ReturnType<typeof setTimeout> | undefined
  watch(input, (value) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      search.value = value.trim()
    }, 300)
  })
  onBeforeUnmount(() => clearTimeout(timer))
  return { input, search }
}
