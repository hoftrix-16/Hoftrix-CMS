import type { CompanySettings, InvoiceBillTo, InvoiceLineItem } from '@/types/invoice'
import { COMPANY } from '@/config/app'

export interface InvoicePreviewModel {
  invoiceNumber: string
  invoiceDate?: string
  dueDate?: string
  status: string
  currency: 'USD' | 'INR'
  billTo: InvoiceBillTo
  items: InvoiceLineItem[]
  subtotal: number
  discountTotal: number
  taxTotal: number
  grossTotal?: number
  billingPercent?: number
  totalAmount: number
  amountPaid: number
  balanceDue: number
  notes?: string
  terms?: string
  signatureUrl?: string
  authorizedName?: string
  authorizedDesignation?: string
  logoUrl?: string
  logoSize?: number
  themeAccent?: string
  subject?: string
}

export function resolveCompany(settings?: CompanySettings | null) {
  return {
    legalName: settings?.legalName || COMPANY.legalName,
    brandName: settings?.brandName || COMPANY.brandPrintName,
    address: settings?.address || COMPANY.address,
    email: settings?.email || COMPANY.email,
    phone: settings?.phone || COMPANY.phoneDisplay,
    website: settings?.website || COMPANY.website,
    gstin: settings?.gstin || '',
    logoUrl: settings?.logoUrl || '',
    logoSize: settings?.logoSize || 72,
    accentColor: settings?.accentColor || '#FF4D00',
    signatureUrl: settings?.signatureUrl || '',
    authorizedName: settings?.authorizedName || 'Ashu Sharma',
    authorizedDesignation: settings?.authorizedDesignation || 'Founder',
    bankName: settings?.bankName || 'IndusInd Bank',
    bankAccountName: settings?.bankAccountName || 'Hoftrix Technologies Pvt Ltd',
    bankAccountNumber: settings?.bankAccountNumber || '201036328915',
    bankSwift: settings?.bankSwift || 'INDBINBB',
    bankIfsc: settings?.bankIfsc || 'INDB0000254',
    bankAddress:
      settings?.bankAddress ||
      'IndusInd Bank, Daon Branch, Shop No. 2 Green Enclave, Chandigarh-Kharar Road, Village Daon, Mohali - 140301',
  }
}
