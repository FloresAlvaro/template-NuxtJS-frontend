/** Stable numeric presentation across server/browser locale data versions. */
export function saleDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const parts = new Intl.DateTimeFormat('es-BO', {
    timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date)
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? ''
  return `${part('day')}/${part('month')}/${part('year')} · ${part('hour')}:${part('minute')}`
}
