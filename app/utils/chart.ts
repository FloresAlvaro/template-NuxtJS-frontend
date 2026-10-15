// Only normalized geometry becomes Number; exact values remain BigInt/string.
export function chartRatio(value: bigint, maximum: bigint): number {
  if (maximum <= 0n) return 0
  return Number((value * 1_000_000n) / maximum) / 1_000_000
}
export function chartMaximum(values: bigint[]): bigint {
  return values.reduce(
    (maximum, value) => (value > maximum ? value : maximum),
    0n,
  )
}
export function reportNumber(value: string | number): string {
  const [whole = '0', fraction] = String(value).split('.')
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}${fraction === undefined ? '' : `.${fraction}`}`
}
export function bucketLabel(date: string, group: 'DAY' | 'MONTH'): string {
  return group === 'MONTH'
    ? `${date.slice(5, 7)}/${date.slice(0, 4)}`
    : `${date.slice(8, 10)}/${date.slice(5, 7)}`
}

export function chartMoneyTick(cents: bigint): string {
  const exact = `${cents / 100n}.${String(cents % 100n).padStart(2, '0')}`
  if (exact.length <= 9) return exact
  const whole = (cents / 100n).toString()
  return `${whole[0]}.${whole.slice(1, 3).padEnd(2, '0')}e${whole.length - 1}`
}
