import { apiErrorStatus } from '~/utils/api-error'

// A lost response must reuse the same payload, including after a tab reload.
export function useIdempotentRequest<TBody extends { requestId: string }>(
  key: string,
) {
  const api = useApi()
  const { pending, error, run } = useAsyncAction()
  const submission = shallowRef<{ path: string; body: TBody } | null>(null)
  const restored = ref(false)
  onMounted(() => {
    try {
      const saved = sessionStorage.getItem(key)
      if (saved) {
        const value: unknown = JSON.parse(saved)
        if (
          value &&
          typeof value === 'object' &&
          'path' in value &&
          'body' in value &&
          typeof value.path === 'string' &&
          /^\/orders(?:\/[1-9]\d*\/(confirm|ready|complete|cancel))?$/.test(
            value.path,
          ) &&
          value.body &&
          typeof value.body === 'object' &&
          'requestId' in value.body &&
          typeof value.body.requestId === 'string'
        ) {
          submission.value = value as { path: string; body: TBody }
        }
      }
    } catch {
      /* Storage is optional; in-memory retries remain available. */
    }
    restored.value = true
  })
  watch(
    submission,
    (value) => {
      if (!import.meta.client || !restored.value) return
      try {
        if (value) sessionStorage.setItem(key, JSON.stringify(value))
        else sessionStorage.removeItem(key)
      } catch {
        /* Private browsing can disable storage. */
      }
    },
    { flush: 'sync' },
  )
  const locked = computed(
    () => pending.value || submission.value !== null || !restored.value,
  )
  async function send<TResult>(
    path: string,
    createBody: () => TBody,
  ): Promise<TResult | undefined> {
    let result: TResult | undefined
    await run(async () => {
      const current = submission.value ?? { path, body: createBody() }
      submission.value = current
      try {
        result = await api<TResult>(current.path, {
          method: 'POST',
          body: current.body,
        })
        submission.value = null
      } catch (cause) {
        const status = apiErrorStatus(cause)
        if (status && status >= 400 && status < 500) submission.value = null
        throw cause
      }
    }, 'No se pudo confirmar el resultado. Reintenta la misma operación para evitar duplicados.')
    return result
  }
  return { pending, error, submission, locked, send }
}
