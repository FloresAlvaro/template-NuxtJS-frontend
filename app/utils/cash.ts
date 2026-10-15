export const cashMovementLabels = {
  CASH_IN: 'Ingreso de efectivo',
  CASH_OUT: 'Retiro de efectivo',
  PAYMENT: 'Cobro',
  REFUND: 'Reembolso',
}
export function cashAmount(value: string): string {
  const text = value.trim()
  if (!/^(0|[1-9]\d{0,15})(\.\d{1,2})?$/.test(text))
    throw new Error('Introduce un importe válido con hasta dos decimales')
  const [whole, fraction = ''] = text.split('.')
  return whole + '.' + fraction.padEnd(2, '0')
}
