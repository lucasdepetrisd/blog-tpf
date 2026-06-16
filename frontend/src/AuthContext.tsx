import { createContext, useContext, useState, type ReactNode } from 'react'
import { login as apiLogin } from './api'

interface AuthCtx {
  token: string | null
  isAuth: boolean
  doLogin: (user: string, pass: string) => Promise<void>
  doLogout: () => void
}

const AuthContext = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))

  const doLogin = async (user: string, pass: string) => {
    const res = await apiLogin(user, pass)
    const t = res.data.access_token
    localStorage.setItem('token', t)
    setToken(t)
  }

  const doLogout = () => {
    localStorage.removeItem('token')
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, isAuth: !!token, doLogin, doLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
