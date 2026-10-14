/** Keep management list filters in the URL for reloads, links and back navigation. */
export function usePagedSearchFilters(statuses: readonly string[]) {
  const route = useRoute()
  const router = useRouter()
  const readSearch = () =>
    typeof route.query.search === 'string'
      ? route.query.search.slice(0, 150)
      : ''
  const { input, search } = useSearchText(readSearch())
  const page = computed({
    get: () =>
      typeof route.query.page === 'string' &&
      /^[1-9]\d*$/.test(route.query.page)
        ? Math.min(Number(route.query.page), 1000000)
        : 1,
    set: (value) => {
      void router.replace({
        query: {
          ...route.query,
          page: value === 1 ? undefined : String(value),
        },
      })
    },
  })
  const status = computed({
    get: () =>
      typeof route.query.status === 'string' &&
      statuses.includes(route.query.status)
        ? route.query.status
        : 'all',
    set: (value) => {
      void router.replace({
        query: {
          ...route.query,
          status: value === 'all' ? undefined : value,
          page: undefined,
        },
      })
    },
  })
  watch(search, (value) => {
    if (value === readSearch()) return
    void router.replace({
      query: { ...route.query, search: value || undefined, page: undefined },
    })
  })
  watch(
    () => route.query.search,
    () => {
      input.value = readSearch()
    },
  )
  return { input, search: computed(readSearch), page, status }
}
