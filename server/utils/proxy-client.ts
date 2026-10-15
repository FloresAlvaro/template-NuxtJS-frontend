import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'

export const clientIdentityHeaders = [
  'x-tienda-client-ip',
  'x-tienda-client-at',
  'x-tienda-client-signature',
] as const

// Only a single, explicitly trusted peer can supply the overwritten real-IP header.
// Direct connections and arbitrary X-Forwarded-For chains never establish trust.
export function proxyClientAddress(
  peer: string | undefined,
  realIp: string | undefined,
  trustedProxyIp: string,
) {
  const normalizedPeer = peer?.replace(/^::ffff:/, '')
  if (!trustedProxyIp || normalizedPeer !== trustedProxyIp) return peer
  if (!isIP(trustedProxyIp) || !realIp || !isIP(realIp))
    throw new Error('Invalid trusted proxy client address')
  return realIp
}

export function signedClientHeaders(ip: string | undefined, secret: string) {
  if (!secret) return {}
  if (secret.length < 32 || !ip || !isIP(ip))
    throw new Error('Invalid private proxy identity configuration')
  const at = String(Date.now())
  return {
    'x-tienda-client-ip': ip,
    'x-tienda-client-at': at,
    'x-tienda-client-signature': createHmac('sha256', secret)
      .update(`${at}\n${ip}`).digest('hex'),
  }
}
