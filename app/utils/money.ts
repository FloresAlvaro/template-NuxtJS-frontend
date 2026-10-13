export function moneyCents(value: string): bigint {
  const [whole = '0', fraction = ''] = value.split('.')
  return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
}
export function formatCents(value: bigint): string {
  return `${value / 100n}.${String(value % 100n).padStart(2, '0')}`
}
