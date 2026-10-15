import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { ref, shallowRef, computed, watch, reactive, nextTick, effectScope } from 'vue'
import { apiErrorStatus } from '../app/utils/api-error.ts'
import { signedClientHeaders } from '../server/utils/proxy-client.ts'
import { createHmac } from 'node:crypto'

// Exercise the real composables with Vue reactivity and controlled API/storage.
// Nuxt lifecycle hooks are driven explicitly so a reload can be simulated.
function load(path, globals = {}) {
  let source = readFileSync(new URL(path, import.meta.url), 'utf8')
  if (path.endsWith('.vue')) source = source.split('<script setup lang="ts">')[1].split('</script>')[0]
  source = source.replaceAll('import.meta.client', 'true')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports = {}
  runInNewContext(code, {
    exports, ref, shallowRef, computed, watch,
    require: name => {
      if (name === '~/utils/api-error') return { apiErrorStatus }
      throw new Error(`Unexpected import ${name}`)
    },
    ...globals,
  })
  return exports
}

test('lost sale responses retain the original UUID and payload across a reload', async () => {
  const saved = new Map(), calls = []
  let loseResponse = true
  const api = async (path, options) => {
    calls.push({ path, body: options.body })
    if (loseResponse) throw new Error('response lost after server commit')
    return { saleId: 42 }
  }
  const storage = {
    getItem: key => saved.get(key) ?? null,
    setItem: (key, value) => saved.set(key, value),
    removeItem: key => saved.delete(key),
  }
  function create(userId) {
    const mounts = [], scope = effectScope()
    const result = scope.run(() => {
      const exports = load('../app/composables/api/useIdempotentRequest.ts', {
        useApi: () => api, onMounted: fn => mounts.push(fn), sessionStorage: storage,
        useAsyncAction: () => ({ pending: ref(false), error: ref(''), run: async fn => { try { await fn() } catch {} } }),
      })
      const request = exports.useIdempotentRequest(`sale-create-${userId}`, /^\/sales$/)
      for (const mount of mounts) mount()
      return request
    })
    return { ...result, dispose: () => scope.stop() }
  }
  const payload = { requestId: 'original-id', customerId: 7, items: [{ productId: 3, quantity: 2, expectedUnitPrice: '10.00' }], promotionId: 9, expectedPromotionVersion: 2, expectedTotal: '18.00' }
  const first = create(1)
  await first.send('/sales', () => payload)
  assert.equal(first.locked.value, true)
  assert.ok(saved.has('sale-create-1'))
  first.dispose()
  const otherUser = create(2)
  assert.equal(otherUser.submission.value, null)
  otherUser.dispose()
  const reloaded = create(1)
  loseResponse = false
  assert.equal((await reloaded.send('/sales', () => { throw new Error('must reuse original body') })).saleId, 42)
  assert.equal(JSON.stringify(calls[0]), JSON.stringify(calls[1]))
  assert.equal(reloaded.submission.value, null)
  assert.equal(saved.has('sale-create-1'), false)
  reloaded.dispose()
})

test('initial pagination clamps after data is ready, including an empty result', async () => {
  const scope = effectScope(), page = ref(999)
  const props = reactive({ total: 5, limit: 20, pending: false })
  scope.run(() => load('../app/components/shared/ListPagination.vue', {
    defineModel: () => page, defineProps: () => props, withDefaults: value => value,
  }))
  assert.equal(page.value, 1)
  props.pending = true
  page.value = 999
  await nextTick()
  assert.equal(page.value, 999)
  props.total = 0
  props.pending = false
  await nextTick()
  assert.equal(page.value, 1)
  scope.stop()
})

test('session outages clear stale permissions, keep public pages open and deny private pages', async () => {
  const state = new Map()
  let failure = { statusCode: 502 }
  const { useAuth } = load('../app/composables/auth/useAuth.ts', {
    useApi: () => async () => { if (failure) throw failure; return { userId: 1, role: 'ADMIN' } },
    useState: (key, init) => { if (!state.has(key)) state.set(key, ref(init())); return state.get(key) },
  })
  const auth = useAuth()
  auth.user.value = { userId: 1, role: 'ADMIN' }
  const middleware = load('../app/middleware/auth.global.ts', {
    useAuth, defineNuxtRouteMiddleware: value => value,
    createError: value => Object.assign(new Error(value.statusMessage), value),
    navigateTo: value => value,
  }).default
  assert.equal(await middleware({ path: '/login', fullPath: '/login' }), undefined)
  assert.equal(auth.user.value, null)
  assert.equal(auth.unavailable.value, true)
  await assert.rejects(middleware({ path: '/sales', fullPath: '/sales' }), { statusCode: 503 })
  failure = { statusCode: 401 }
  const redirect = await middleware({ path: '/sales', fullPath: '/sales' })
  assert.equal(redirect.path, '/login')
  assert.equal(auth.unavailable.value, false)
  failure = null
  await auth.refresh()
  assert.equal(auth.isAdmin.value, true)
})

test('proxy asserts only a valid address with a private secret', () => {
  const secret = 'private-test-secret-at-least-32-characters'
  const headers = signedClientHeaders('203.0.113.1', secret)
  assert.equal(headers['x-tienda-client-signature'], createHmac('sha256', secret).update(`${headers['x-tienda-client-at']}\n203.0.113.1`).digest('hex'))
  assert.deepEqual(signedClientHeaders('203.0.113.1', ''), {})
  assert.throws(() => signedClientHeaders('203.0.113.1', 'short'))
  assert.throws(() => signedClientHeaders('forged-address', secret))
})
