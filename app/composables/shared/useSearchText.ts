export function useSearchText(initialValue = '') {
  const input = ref(initialValue)
  const search = ref(initialValue.trim())
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
