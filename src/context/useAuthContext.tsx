import type { UserType } from '@/types/auth'
import { deleteCookie, getCookie, hasCookie, setCookie } from 'cookies-next'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ChildrenType } from '../types/component-props'
import { AUTH_SESSION_KEY, LEGACY_AUTH_SESSION_KEY } from '@/config/app'
import { isTokenExpired, setUnauthorizedHandler } from '@/helpers/api'

export type AuthContextType = {
  user: UserType | undefined
  isAuthenticated: boolean
  saveSession: (session: UserType) => void
  removeSession: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

function migrateLegacySession() {
  if (typeof window === 'undefined') return
  const legacy = localStorage.getItem(LEGACY_AUTH_SESSION_KEY)
  if (legacy && !localStorage.getItem(AUTH_SESSION_KEY)) {
    localStorage.setItem(AUTH_SESSION_KEY, legacy)
    localStorage.removeItem(LEGACY_AUTH_SESSION_KEY)
  }
}

function clearStoredSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_SESSION_KEY)
    localStorage.removeItem(LEGACY_AUTH_SESSION_KEY)
  }
  deleteCookie(AUTH_SESSION_KEY)
  deleteCookie(LEGACY_AUTH_SESSION_KEY)
}

export function AuthProvider({ children }: ChildrenType) {
  const navigate = useNavigate()
  const loggingOut = useRef(false)

  const getSession = (): AuthContextType['user'] => {
    migrateLegacySession()

    if (typeof window !== 'undefined') {
      const fetchedLocal = localStorage.getItem(AUTH_SESSION_KEY)
      if (fetchedLocal) {
        try {
          const parsed = JSON.parse(fetchedLocal) as UserType
          if (isTokenExpired(parsed.token)) {
            clearStoredSession()
            return undefined
          }
          return parsed
        } catch (e) {
          console.error(e)
        }
      }
    }
    const fetchedCookie = getCookie(AUTH_SESSION_KEY)?.toString()
    if (!fetchedCookie) return
    try {
      const parsed = JSON.parse(fetchedCookie) as UserType
      if (isTokenExpired(parsed.token)) {
        clearStoredSession()
        return undefined
      }
      return parsed
    } catch {
      return
    }
  }

  const [user, setUser] = useState<UserType | undefined>(getSession())

  const removeSession = () => {
    if (loggingOut.current) return
    loggingOut.current = true
    clearStoredSession()
    setUser(undefined)
    navigate('/auth/sign-in', { replace: true })
    // allow future logouts after navigation settles
    setTimeout(() => {
      loggingOut.current = false
    }, 500)
  }

  useEffect(() => {
    migrateLegacySession()
    setUnauthorizedHandler(() => {
      removeSession()
    })
    return () => setUnauthorizedHandler(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Periodic check — if JWT expired while tab stays open, force logout
  useEffect(() => {
    if (!user?.token) return
    const tick = () => {
      if (isTokenExpired(user.token)) removeSession()
    }
    tick()
    const id = window.setInterval(tick, 60_000)
    return () => window.clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token])

  const saveSession = (nextUser: UserType) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(nextUser))
      localStorage.removeItem(LEGACY_AUTH_SESSION_KEY)
    }
    const safeUserForCookie = {
      ...nextUser,
      avatar: nextUser.avatar && nextUser.avatar.length > 2000 ? '' : nextUser.avatar,
      cover: nextUser.cover && nextUser.cover.length > 2000 ? '' : nextUser.cover,
    }
    setCookie(AUTH_SESSION_KEY, JSON.stringify(safeUserForCookie))
    deleteCookie(LEGACY_AUTH_SESSION_KEY)
    setUser(nextUser)
    loggingOut.current = false
  }

  const hasStoredSession =
    hasCookie(AUTH_SESSION_KEY) ||
    (typeof window !== 'undefined' && !!localStorage.getItem(AUTH_SESSION_KEY))

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && hasStoredSession && !isTokenExpired(user.token),
        saveSession,
        removeSession,
      }}>
      {children}
    </AuthContext.Provider>
  )
}
