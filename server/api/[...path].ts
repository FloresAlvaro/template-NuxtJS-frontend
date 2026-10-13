export default defineEventHandler(async event => {
  const config = useRuntimeConfig(event)
  const path = event.path.replace(/^\/api(?=\/|$)/, '')
  return proxyRequest(event, `${config.backendApiBase}${path}`)
})
