import { createContext, useState, useEffect } from 'react'
import { getSession, setSession, clearSession, findAdminByInviteCode, findUserByEmail, saveUser, updateUser } from '../../../shared/services/localStorageStore'

const AuthContext = createContext(null)
export default AuthContext

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const session = getSession()
    if (session) {
      const normalizedSession = {
        ...session,
        role: session.role || 'admin',
        ownerId: session.ownerId || session.id,
        inviteCode: (session.role || 'admin') === 'attendant' ? session.inviteCode || null : session.inviteCode || generateInviteCode(),
      }
      setUser(normalizedSession)
      setSession(normalizedSession)
      updateUser(normalizedSession)
    }
    setLoading(false)
  }, [])

  function login(email, password) {
    const found = findUserByEmail(email)
    if (!found) return { success: false, message: 'Usuário não encontrado.' }
    if (found.password !== password) return { success: false, message: 'Senha incorreta.' }
    const normalizedUser = {
      ...found,
      role: found.role || 'admin',
      ownerId: found.ownerId || found.id,
      inviteCode: found.role === 'attendant' ? found.inviteCode || null : found.inviteCode || generateInviteCode(),
    }
    setUser(normalizedUser)
    setSession(normalizedUser)
    updateUser(normalizedUser)
    return { success: true, user: normalizedUser }
  }

  function generateInviteCode() {
    const existingCodes = new Set(
      JSON.parse(localStorage.getItem('gerelocal_users') || '[]').map((u) => u.inviteCode).filter(Boolean)
    )
    let code = ''
    do {
      code = String(Math.floor(100000 + Math.random() * 900000))
    } while (existingCodes.has(code))

    return code
  }

  function register(name, email, password, role = 'admin', inviteCode = '') {
    const normalizedEmail = email.trim().toLowerCase()
    const normalizedRole = role === 'attendant' ? 'attendant' : 'admin'

    if (findUserByEmail(normalizedEmail)) {
      return { success: false, message: 'Email já cadastrado.' }
    }

    const adminOwner = normalizedRole === 'attendant' ? findAdminByInviteCode(inviteCode) : null
    if (normalizedRole === 'attendant' && !adminOwner) {
      return { success: false, message: 'Código da loja inválido. Confira o código com seu gerente.' }
    }

    const id = crypto.randomUUID()
    const newUser = {
      id,
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: normalizedRole,
      ownerId: normalizedRole === 'attendant' ? adminOwner.id : id,
      ownerName: normalizedRole === 'attendant' ? adminOwner.name : name.trim(),
      inviteCode: normalizedRole === 'admin' ? generateInviteCode() : null,
    }
    saveUser(newUser)
    setUser(newUser)
    setSession(newUser)
    return { success: true }
  }

  function logout() {
    setUser(null)
    clearSession()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
