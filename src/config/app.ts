export const AUTH_SESSION_KEY = '_HOFTRIX_AUTH_KEY_'
export const LEGACY_AUTH_SESSION_KEY = '_REBACK_AUTH_KEY_'

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const APP_NAME = 'Hoftrix CRM'
export const DEFAULT_PAGE_TITLE = 'Hoftrix CRM | Admin Dashboard'

/** Official Hoftrix company details — use across invoices, footer, profile, etc. */
export const COMPANY = {
  name: 'Hoftrix',
  legalName: 'Hoftrix Technologies Pvt Ltd',
  brandPrintName: 'Hoftrix Technologies',
  address: 'Mohali, Punjab, India',
  phone: '7889356866',
  phoneDisplay: '+91 7889356866',
  email: 'finance@hoftrix.com',
  supportEmail: 'support@hoftrix.com',
  website: 'www.hoftrix.com',
  websiteUrl: 'https://www.hoftrix.com',
} as const

/** Brand colors — keep in sync with _hoftrix-brand.scss */
export const BRAND = {
  primary: '#FF4D00',
  black: '#000000',
  white: '#FFFFFF',
  bg: '#0B0F14',
  surface: '#111827',
  surface2: '#1F2937',
  fontFamily: 'Montserrat',
} as const
