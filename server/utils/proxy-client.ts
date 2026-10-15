import { createHmac } from 'node:crypto'
import { isIP } from 'node:net'

export const clientIdentityHeaders = [
  'x-tienda-client-ip',
  'x-tienda-client-at',
  'x-tienda-client-signature',
] as const

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
