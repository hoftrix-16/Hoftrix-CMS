import axios from 'axios'
import { getCookie } from 'cookies-next'

import { API_BASE_URL, AUTH_SESSION_KEY, LEGACY_AUTH_SESSION_KEY } from '@/config/app'
import type { UserType } from '@/types/auth'

export const api = axios.create({
  baseURL: API_BASE_URL,
})

/** Decode JWT payload without verifying signature (client-side expiry check only). */
export function getTokenExpiry(token?: string): number | null {
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

export function isTokenExpired(token?: string): boolean {
  if (!token) return true
  const expMs = getTokenExpiry(token)
  if (!expMs) return false
  // 30s clock skew buffer
  return Date.now() >= expMs - 30_000
}

function readSessionToken(): string | undefined {
  if (typeof window === 'undefined') return undefined

  const readFromStorage = (key: string) => {
    const raw = localStorage.getItem(key)
    if (!raw) return undefined
    try {
      const user = JSON.parse(raw) as UserType
      return user.token
    } catch {
      return undefined
    }
  }

  let token = readFromStorage(AUTH_SESSION_KEY)
  if (!token) {
    token = readFromStorage(LEGACY_AUTH_SESSION_KEY)
  }

  if (!token) {
    const cookieRaw = getCookie(AUTH_SESSION_KEY)?.toString() || getCookie(LEGACY_AUTH_SESSION_KEY)?.toString()
    if (cookieRaw) {
      try {
        token = (JSON.parse(cookieRaw) as UserType).token
      } catch {
        return undefined
      }
    }
  }

  return token
}

let onUnauthorized: (() => void) | null = null

/** Register a handler (usually AuthProvider.removeSession) for expired/invalid tokens. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

api.interceptors.request.use((config) => {
  const token = readSessionToken()
  if (token) {
    if (isTokenExpired(token)) {
      onUnauthorized?.()
      return Promise.reject(new Error('Session expired'))
    }
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      onUnauthorized?.()
    }
    return Promise.reject(error)
  }
)

export default api
