import { clientIdentityHeaders, proxyClientAddress, signedClientHeaders } from '../utils/proxy-client'

export default defineEventHandler(async event => {
  const config = useRuntimeConfig(event)
  const path = event.path.replace(/^\/api(?=\/|$)/, '')
  // Remove any client-supplied assertion before proxyRequest copies headers.
  for (const name of clientIdentityHeaders) delete event.node.req.headers[name]
  const authWrite = event.method === 'POST' &&
    /^\/auth\/(login|register|forgot-password|reset-password)\/?$/i.test(path.split('?')[0] ?? '')
  const headers = authWrite ? signedClientHeaders(
    proxyClientAddress(
      getRequestIP(event, { xForwardedFor: false }),
      getHeader(event, 'x-real-ip'), config.trustedProxyIp,
    ), config.authProxySecret,
  ) : {}
  return proxyRequest(event, `${config.backendApiBase}${path}`, { headers })
})
