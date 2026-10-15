/** Refresh operational alerts periodically and when returning to the tab. */
export function useLiveRefresh(
  refresh: () => Promise<unknown>,
  interval = 60000,
) {
  let timer: ReturnType<typeof setInterval> | undefined
  let running = false
  async function update() {
    if (running || document.visibilityState !== 'visible') return
    running = true
    try {
      await refresh()
    } finally {
      running = false
    }
  }
  onMounted(() => {
    timer = setInterval(() => {
      void update()
    }, interval)
    window.addEventListener('focus', update)
  })
  onBeforeUnmount(() => {
    if (timer) clearInterval(timer)
    window.removeEventListener('focus', update)
  })
}
