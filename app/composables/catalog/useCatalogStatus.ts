export function useCatalogStatus<T extends { isActive: boolean }>(options: {
  resource: 'categories' | 'sub-categories' | 'products'
  id: (item: T) => number
  messages: { active: string; inactive: string; error: string }
  refresh: () => Promise<unknown>
}) {
  const api = useApi()
  const toast = useAppToast()
  const open = ref(false)
  const selected = shallowRef<T | null>(null)
  const action = useAsyncAction()
  function confirm(item: T) {
    selected.value = item
    action.error.value = ''
    open.value = true
  }
  async function submit() {
    const item = selected.value
    if (!item) return
    await action.run(async () => {
      await api(
        '/' + options.resource + '/' + options.id(item) + (item.isActive ? '' : '/activate'),
        { method: item.isActive ? 'DELETE' : 'PATCH' },
      )
      toast.success(item.isActive ? options.messages.inactive : options.messages.active)
      open.value = false
      await options.refresh()
    }, options.messages.error)
  }
  return {
    open,
    selected,
    pending: action.pending,
    error: action.error,
    confirm,
    submit,
  }
}
