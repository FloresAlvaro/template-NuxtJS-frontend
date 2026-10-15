import assert from 'node:assert/strict'

const base = process.env.SSR_BASE_URL || 'http://127.0.0.1:4317'
for (const path of ['/', '/login', '/shop']) {
  const response = await fetch(base + path, { redirect: 'manual' })
  assert.equal(response.status, 200, path)
  assert.match(await response.text(), /No pudimos conectar con la tienda/, path)
}
const privatePage = await fetch(base + '/sales', { redirect: 'manual' })
assert.equal(privatePage.status, 503)
console.log('SSR público disponible con aviso; rutas privadas cerradas durante la caída de API.')
