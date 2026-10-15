import { test } from 'node:test'
import assert from 'node:assert/strict'
import { proxyClientAddress, signedClientHeaders } from '../server/utils/proxy-client.ts'

test('only the configured immediate proxy can assert a single client IP', () => {
  assert.equal(proxyClientAddress('172.30.72.2', '203.0.113.7', ''), '172.30.72.2')
  assert.equal(proxyClientAddress('203.0.113.9', '203.0.113.7', '172.30.72.2'), '203.0.113.9')
  assert.equal(proxyClientAddress('::ffff:172.30.72.2', '203.0.113.7', '172.30.72.2'), '203.0.113.7')
  assert.equal(proxyClientAddress('172.30.72.2', '2001:db8::1', '172.30.72.2'), '2001:db8::1')
  for (const value of [undefined, '', '203.0.113.7, 203.0.113.8', 'forged'])
    assert.throws(() => proxyClientAddress('172.30.72.2', value, '172.30.72.2'))
})

test('clients behind the trusted proxy receive different signed identities', () => {
  const secret = 'private-test-secret-at-least-32-characters'
  const identity = ip => signedClientHeaders(proxyClientAddress('172.30.72.2', ip, '172.30.72.2'), secret)
  assert.notEqual(identity('203.0.113.1')['x-tienda-client-signature'], identity('203.0.113.2')['x-tienda-client-signature'])
})
