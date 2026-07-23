import type { InvoiceLineItem } from '@/types/invoice'

export function computeLineAmount(item: Pick<InvoiceLineItem, 'qty' | 'rate' | 'discount' | 'taxPercent'>): number {
  const qty = Number(item.qty) || 0
  const rate = Number(item.rate) || 0
  const discount = Number(item.discount) || 0
  const taxPercent = Number(item.taxPercent) || 0
  const afterDiscount = Math.max(0, qty * rate - discount)
  const tax = afterDiscount * (taxPercent / 100)
  return Math.round((afterDiscount + tax) * 100) / 100
}

export function computeInvoiceTotals(items: InvoiceLineItem[], amountPaid = 0, billingPercent = 100) {
  let subtotal = 0
  let discountTotal = 0
  let taxTotal = 0

  const normalized = items.map((item) => {
    const qty = Number(item.qty) || 0
    const rate = Number(item.rate) || 0
    const discount = Number(item.discount) || 0
    const taxPercent = Number(item.taxPercent) || 0
    const lineBase = Math.max(0, qty * rate)
    const afterDiscount = Math.max(0, lineBase - discount)
    const tax = afterDiscount * (taxPercent / 100)
    const amount = Math.round((afterDiscount + tax) * 100) / 100

    subtotal += lineBase
    discountTotal += discount
    taxTotal += tax

    return { ...item, qty, rate, discount, taxPercent, amount }
  })

  const grossTotal = Math.round((subtotal - discountTotal + taxTotal) * 100) / 100
  const percent = Math.min(100, Math.max(0, Number(billingPercent) || 100))
  const totalAmount = Math.round((grossTotal * percent) / 100 * 100) / 100
  const paid = Number(amountPaid) || 0
  const balanceDue = Math.max(0, Math.round((totalAmount - paid) * 100) / 100)

  return {
    items: normalized,
    subtotal: Math.round(subtotal * 100) / 100,
    discountTotal: Math.round(discountTotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    grossTotal,
    billingPercent: percent,
    totalAmount,
    amountPaid: paid,
    balanceDue,
  }
}

export function moneySymbol(currency?: string) {
  return currency === 'USD' ? '$' : '₹'
}

export function formatMoney(value: number | undefined, currency?: string) {
  const symbol = moneySymbol(currency)
  return `${symbol}${(value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}
