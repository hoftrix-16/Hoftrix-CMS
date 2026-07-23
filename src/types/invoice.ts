export type InvoiceStatus = 'Draft' | 'Sent' | 'Pending' | 'Paid' | 'Overdue' | 'Cancelled'

export interface InvoiceLineItem {
  description: string
  qty: number
  rate: number
  discount: number
  taxPercent: number
  amount: number
}

export interface InvoiceBillTo {
  companyName: string
  contactPerson: string
  email: string
  phone: string
  address: string
  gstin: string
}

export interface CompanySettings {
  _id?: string
  legalName: string
  brandName: string
  address: string
  email: string
  phone: string
  website: string
  gstin: string
  logoUrl: string
  logoSize: number
  accentColor: string
  signatureUrl?: string
  authorizedName: string
  authorizedDesignation: string
  bankName?: string
  bankAccountName?: string
  bankAccountNumber?: string
  bankSwift?: string
  bankIfsc?: string
  bankAddress?: string
  defaultTerms: string
  defaultNotes: string
}

export interface InvoiceRecord {
  _id: string
  invoiceNumber: string
  client?: { _id: string; companyName?: string; contactPerson?: string; email?: string; phone?: string; address?: string }
  customClientName?: string
  billTo?: InvoiceBillTo
  subject?: string
  invoiceDate: string
  dueDate?: string
  terms?: string
  notes?: string
  items: InvoiceLineItem[]
  subtotal?: number
  discountTotal?: number
  taxTotal?: number
  grossTotal?: number
  billingPercent?: number
  totalAmount: number
  amountPaid?: number
  balanceDue?: number
  currency: 'USD' | 'INR'
  status: InvoiceStatus | string
  signatureUrl?: string
  authorizedName?: string
  authorizedDesignation?: string
  logoUrl?: string
  logoSize?: number
  themeAccent?: string
  createdAt?: string
}

export interface InvoiceStats {
  totalRevenue: number
  paidAmount: number
  pendingAmount: number
  overdueAmount: number
}

export const DEFAULT_TERMS = `1. Payment should be completed within 15 days of invoice generation.
2. Project timeline depends on client approvals.
3. Any additional requirements will be charged separately.`

export const DEFAULT_NOTES = 'Thank you for choosing Hoftrix Technologies Pvt Ltd.'

export const INVOICE_PREFIX = 'INV-HTF-'

export const STATUS_BADGE: Record<string, string> = {
  Draft: 'secondary',
  Sent: 'info',
  Pending: 'warning',
  Paid: 'success',
  Overdue: 'danger',
  Cancelled: 'dark',
}
