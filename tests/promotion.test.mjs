import {test} from 'node:test'
import assert from 'node:assert/strict'
import {discountedUnitCents,storeDateInput,storeInputToIso} from '../app/utils/promotion.ts'
test('discount preview matches half-up rounding per unit, including exact fractional cents',()=>{
 assert.equal(discountedUnitCents(5n,5000),2n)
 assert.equal(discountedUnitCents(10n,5000)*3n,15n)
 assert.equal(discountedUnitCents(999999999999999999n,1),999899999999999999n)
 assert.equal(discountedUnitCents(100n,10000),0n)
 assert.equal(discountedUnitCents(999999999999999999n,5001),499900000000000000n)
 assert.throws(()=>discountedUnitCents(100n,10001))
})
test('promotion dates use the store timezone across SSR and browser timezones',()=>{
 assert.equal(storeDateInput('2026-10-15T12:30:00.000Z'),'2026-10-15T08:30')
 assert.equal(storeInputToIso('2026-10-15T08:30'),'2026-10-15T12:30:00.000Z')
 assert.throws(()=>storeInputToIso('2026-02-30T08:30'))
 assert.throws(()=>storeInputToIso('not-a-date'))
})
