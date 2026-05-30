function isValidDate(value) {
  return Boolean(value) && !Number.isNaN(new Date(value).getTime())
}

function normalizeNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function normalizeProduct(product) {
  if (!product || typeof product !== 'object') return null

  const price = normalizeNumber(product.price)
  const costPrice = normalizeNumber(product.costPrice)
  const quantity = normalizeNumber(product.quantity)
  const estoqueMaximo = normalizeNumber(product.estoqueMaximo)
  const discountValue = normalizeNumber(product.discountValue)
  const discountMode = ['amount', 'percent'].includes(product.discountMode) ? product.discountMode : 'none'
  const name = String(product.name || '').trim()
  const id = String(product.id || '').trim()

  if (!id || !name || price === null || quantity === null || price < 0 || quantity < 0) {
    return null
  }

  return {
    ...product,
    id,
    name,
    price,
    costPrice: costPrice !== null && costPrice >= 0 ? costPrice : 0,
    quantity,
    barcode: product.barcode ? String(product.barcode).trim() : '',
    supplier: product.supplier ? String(product.supplier).trim() : '',
    discountMode,
    discountValue: discountValue !== null && discountValue >= 0 ? discountValue : 0,
    category: product.category ? String(product.category).trim() : null,
    estoqueMaximo: estoqueMaximo !== null && estoqueMaximo >= 0 ? estoqueMaximo : quantity,
  }
}

function normalizeSaleItem(item) {
  if (!item || typeof item !== 'object') return null

  const price = normalizeNumber(item.price)
  const costPrice = normalizeNumber(item.costPrice)
  const productDiscount = normalizeNumber(item.productDiscount)
  const productDiscountValue = normalizeNumber(item.productDiscountValue)
  const quantity = normalizeNumber(item.quantity)
  const id = String(item.id || '').trim()
  const name = String(item.name || '').trim()

  if (!id || !name || price === null || quantity === null || price < 0 || quantity <= 0) {
    return null
  }

  return {
    id,
    name,
    barcode: item.barcode ? String(item.barcode).trim() : '',
    price,
    costPrice: costPrice !== null && costPrice >= 0 ? costPrice : 0,
    quantity,
    productDiscountMode: ['amount', 'percent'].includes(item.productDiscountMode) ? item.productDiscountMode : 'none',
    productDiscountValue: productDiscountValue !== null && productDiscountValue >= 0 ? productDiscountValue : 0,
    productDiscount: productDiscount !== null && productDiscount >= 0 ? productDiscount : 0,
  }
}

function normalizeSale(sale) {
  if (!sale || typeof sale !== 'object' || !Array.isArray(sale.items)) return null

  const id = String(sale.id || '').trim()
  const date = String(sale.date || '').trim()
  const items = sale.items.map(normalizeSaleItem)
  const total = normalizeNumber(sale.total)
  const subtotal = normalizeNumber(sale.subtotal)
  const discount = normalizeNumber(sale.discount)
  const productDiscountTotal = normalizeNumber(sale.productDiscountTotal)
  const manualDiscount = normalizeNumber(sale.manualDiscount)
  const paymentMethod = String(sale.paymentMethod || 'Não informado').trim() || 'Não informado'
  const cashReceived = normalizeNumber(sale.cashReceived)
  const cashChange = normalizeNumber(sale.cashChange)
  const discountMode = sale.discountMode === 'percent' ? 'percent' : 'amount'
  const discountValue = normalizeNumber(sale.discountValue)
  const note = String(sale.note || '').trim()
  const customerName = String(sale.customerName || '').trim()

  if (!id || !isValidDate(date) || items.some((item) => !item)) return null

  const calculatedTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const safeDiscount = discount !== null && discount >= 0 ? discount : 0
  const safeSubtotal = subtotal !== null && subtotal >= 0 ? subtotal : calculatedTotal + safeDiscount

  return {
    ...sale,
    id,
    date,
    items,
    subtotal: safeSubtotal,
    discount: safeDiscount,
    productDiscountTotal: productDiscountTotal !== null && productDiscountTotal >= 0 ? productDiscountTotal : 0,
    manualDiscount: manualDiscount !== null && manualDiscount >= 0 ? manualDiscount : safeDiscount,
    discountMode,
    discountValue: discountValue !== null && discountValue >= 0 ? discountValue : safeDiscount,
    paymentMethod,
    cashReceived: cashReceived !== null && cashReceived >= 0 ? cashReceived : 0,
    cashChange: cashChange !== null && cashChange >= 0 ? cashChange : 0,
    customerName,
    note,
    total: total !== null && total >= 0 ? total : Math.max(0, safeSubtotal - safeDiscount),
  }
}

function normalizeCashMovement(movement) {
  if (!movement || typeof movement !== 'object') return null

  const id = String(movement.id || '').trim()
  const date = String(movement.date || '').trim()
  const value = normalizeNumber(movement.value)
  const type = movement.type === 'withdrawal' ? 'withdrawal' : 'inflow'

  if (!id || !isValidDate(date) || value === null || value <= 0) return null

  return {
    ...movement,
    id,
    date,
    type,
    value,
    description: String(movement.description || '').trim(),
  }
}

function normalizeAuditLog(log) {
  if (!log || typeof log !== 'object') return null

  const id = String(log.id || '').trim()
  const date = String(log.date || '').trim()
  const action = String(log.action || '').trim()

  if (!id || !isValidDate(date) || !action) return null

  return {
    ...log,
    id,
    date,
    action,
    userName: String(log.userName || 'Usuário').trim(),
    userRole: String(log.userRole || 'admin').trim(),
    details: log.details && typeof log.details === 'object' ? log.details : {},
  }
}

export function parseBackupPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { success: false, message: 'Arquivo vazio ou ilegível.' }
  }

  if (!Array.isArray(payload.products) || !Array.isArray(payload.sales)) {
    return { success: false, message: 'O arquivo não possui produtos e vendas no formato esperado.' }
  }

  const products = payload.products.map(normalizeProduct)
  if (products.some((product) => !product)) {
    return { success: false, message: 'Existe produto com dados incompletos ou inválidos no backup.' }
  }

  const sales = payload.sales.map(normalizeSale)
  if (sales.some((sale) => !sale)) {
    return { success: false, message: 'Existe venda com dados incompletos ou inválidos no backup.' }
  }

  const cashMovements = Array.isArray(payload.cashMovements)
    ? payload.cashMovements.map(normalizeCashMovement)
    : []
  if (cashMovements.some((movement) => !movement)) {
    return { success: false, message: 'Existe movimentação de caixa inválida no backup.' }
  }

  const canceledSales = Array.isArray(payload.canceledSales)
    ? payload.canceledSales.map((sale) => {
        const normalized = normalizeSale(sale)
        if (!normalized) return null
        return {
          ...normalized,
          canceledAt: isValidDate(sale.canceledAt) ? sale.canceledAt : normalized.date,
          cancelReason: String(sale.cancelReason || 'Motivo não informado').trim(),
        }
      })
    : []
  if (canceledSales.some((sale) => !sale)) {
    return { success: false, message: 'Existe cancelamento inválido no backup.' }
  }

  const auditLogs = Array.isArray(payload.auditLogs)
    ? payload.auditLogs.map(normalizeAuditLog)
    : []
  if (auditLogs.some((log) => !log)) {
    return { success: false, message: 'Existe registro de auditoria inválido no backup.' }
  }

  return {
    success: true,
    data: {
      products,
      sales,
      cashMovements,
      canceledSales,
      auditLogs,
      exportedAt: payload.exportedAt || null,
    },
  }
}

export function buildBackupPayload({ user, products, sales, cashMovements = [], canceledSales = [], auditLogs = [] }) {
  return {
    app: 'GereLocal',
    version: 1,
    exportedAt: new Date().toISOString(),
    user: user ? { id: user.id, name: user.name, email: user.email } : null,
    products,
    sales,
    cashMovements,
    canceledSales,
    auditLogs,
  }
}
