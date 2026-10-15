export function discountedUnitCents(cents: bigint, percentBps: number): bigint {
  if (!Number.isInteger(percentBps) || percentBps < 1 || percentBps > 10000)
    throw new Error('Porcentaje inválido')
  return cents - (cents * BigInt(percentBps) + 5000n) / 10000n
}
/** Promotion times are entered in the store timezone, independently of the device. */
export function storeDateInput(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('Fecha inválida')
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? ''
  return (
    part('year') +
    '-' +
    part('month') +
    '-' +
    part('day') +
    'T' +
    part('hour') +
    ':' +
    part('minute')
  )
}
export function storeInputToIso(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))
    throw new Error('Completa las fechas de vigencia')
  const naive = new Date(value + ':00Z')
  if (Number.isNaN(naive.getTime())) throw new Error('Fecha inválida')
  const rendered = storeDateInput(naive.toISOString())
  const offset = new Date(rendered + ':00Z').getTime() - naive.getTime()
  const result = new Date(naive.getTime() - offset).toISOString()
  if (storeDateInput(result) !== value) throw new Error('Fecha inválida')
  return result
}
