const STORAGE_KEYS = {
  USERS: 'gerelocal_users',
  PRODUCTS: 'gerelocal_products',
  SALES: 'gerelocal_sales',
  CASH_MOVEMENTS: 'gerelocal_cash_movements',
  CANCELED_SALES: 'gerelocal_canceled_sales',
  AUDIT_LOGS: 'gerelocal_audit_logs',
  SESSION: 'gerelocal_session',
}

function getScopedKey(baseKey, ownerId) {
  return ownerId ? `${baseKey}:${ownerId}` : baseKey
}

function readArray(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}

export function getUsers() {
  return readArray(STORAGE_KEYS.USERS)
}

export function saveUser(user) {
  const users = getUsers()
  users.push(user)
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users))
}

export function updateUser(updatedUser) {
  const users = getUsers()
  localStorage.setItem(
    STORAGE_KEYS.USERS,
    JSON.stringify(users.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u)))
  )
}

export function findAdminByInviteCode(inviteCode) {
  const normalizedCode = String(inviteCode || '').trim()
  return getUsers().find((u) => u.role === 'admin' && u.inviteCode === normalizedCode)
}

export function findUserByEmail(email) {
  const normalizedEmail = email.trim().toLowerCase()
  return getUsers().find((u) => u.email?.toLowerCase() === normalizedEmail)
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSION)) || null
  } catch {
    return null
  }
}

export function setSession(user) {
  localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user))
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION)
}

export function getProducts(ownerId) {
  return readArray(getScopedKey(STORAGE_KEYS.PRODUCTS, ownerId))
}

export function saveProducts(products, ownerId) {
  localStorage.setItem(getScopedKey(STORAGE_KEYS.PRODUCTS, ownerId), JSON.stringify(products))
}

export function getSales(ownerId) {
  return readArray(getScopedKey(STORAGE_KEYS.SALES, ownerId))
}

export function saveSales(sales, ownerId) {
  localStorage.setItem(getScopedKey(STORAGE_KEYS.SALES, ownerId), JSON.stringify(sales))
}

export function getCashMovements(ownerId) {
  return readArray(getScopedKey(STORAGE_KEYS.CASH_MOVEMENTS, ownerId))
}

export function saveCashMovements(movements, ownerId) {
  localStorage.setItem(getScopedKey(STORAGE_KEYS.CASH_MOVEMENTS, ownerId), JSON.stringify(movements))
}

export function getCanceledSales(ownerId) {
  return readArray(getScopedKey(STORAGE_KEYS.CANCELED_SALES, ownerId))
}

export function saveCanceledSales(sales, ownerId) {
  localStorage.setItem(getScopedKey(STORAGE_KEYS.CANCELED_SALES, ownerId), JSON.stringify(sales))
}

export function getAuditLogs(ownerId) {
  return readArray(getScopedKey(STORAGE_KEYS.AUDIT_LOGS, ownerId))
}

export function saveAuditLogs(logs, ownerId) {
  localStorage.setItem(getScopedKey(STORAGE_KEYS.AUDIT_LOGS, ownerId), JSON.stringify(logs))
}
