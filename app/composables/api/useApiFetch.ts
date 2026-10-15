import type { UseFetchOptions } from '#app'
import type { FetchError } from 'ofetch'
import type { MaybeRefOrGetter } from 'vue'

type ApiReadOptions<T> = Pick<
  UseFetchOptions<T>,
  'key' | 'query' | 'watch' | 'immediate' | 'server' | 'lazy'
>

// Return useFetch directly to retain SSR payload reuse and reactive queries.
export function useApiFetch<T>(request: MaybeRefOrGetter<string>, options?: ApiReadOptions<T>) {
  return useFetch<T, FetchError, string, 'get', T>(request, {
    ...options,
    baseURL: useRuntimeConfig().public.apiBase,
  })
}
