import { createContext, useState, useEffect } from 'react'
import {
  getCanceledSales,
  getCashMovements,
  getAuditLogs,
  getProducts,
  getSales,
  saveCanceledSales,
  saveCashMovements,
  saveAuditLogs,
  saveProducts,
  saveSales,
} from '../services/storage'
import useAuth from '../hooks/useAuth'

const DataContext = createContext(null)
export default DataContext

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [products, setProducts] = useState([])
  const [sales, setSales] = useState([])
  const [cashMovements, setCashMovements] = useState([])
  const [canceledSales, setCanceledSales] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loaded, setLoaded] = useState(false)
  const [loadedOwnerId, setLoadedOwnerId] = useState('')
  const ownerId = user?.ownerId || user?.id || user?.email || ''

  useEffect(() => {
    if (!ownerId) {
      setProducts([])
      setSales([])
      setCashMovements([])
      setCanceledSales([])
      setAuditLogs([])
      setLoaded(false)
      setLoadedOwnerId('')
      return
    }

    setLoaded(false)
    setProducts(getProducts(ownerId))
    setSales(getSales(ownerId))
    setCashMovements(getCashMovements(ownerId))
    setCanceledSales(getCanceledSales(ownerId))
    setAuditLogs(getAuditLogs(ownerId))
    setLoadedOwnerId(ownerId)
    setLoaded(true)
  }, [ownerId])

  useEffect(() => {
    if (loaded && ownerId && loadedOwnerId === ownerId) saveProducts(products, ownerId)
  }, [products, loaded, loadedOwnerId, ownerId])

  useEffect(() => {
    if (loaded && ownerId && loadedOwnerId === ownerId) saveSales(sales, ownerId)
  }, [sales, loaded, loadedOwnerId, ownerId])

  useEffect(() => {
    if (loaded && ownerId && loadedOwnerId === ownerId) saveCashMovements(cashMovements, ownerId)
  }, [cashMovements, loaded, loadedOwnerId, ownerId])

  useEffect(() => {
    if (loaded && ownerId && loadedOwnerId === ownerId) saveCanceledSales(canceledSales, ownerId)
  }, [canceledSales, loaded, loadedOwnerId, ownerId])

  useEffect(() => {
    if (loaded && ownerId && loadedOwnerId === ownerId) saveAuditLogs(auditLogs, ownerId)
  }, [auditLogs, loaded, loadedOwnerId, ownerId])

  const permissions = {
    role: user?.role || 'admin',
    canManageSensitive: (user?.role || 'admin') === 'admin',
  }

  function addAuditLog(action, details = {}) {
    const log = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      action,
      userName: user?.name || user?.email || 'Usuário',
      userRole: permissions.role,
      details,
    }

    setAuditLogs((prev) => [log, ...prev].slice(0, 200))
    return log
  }

  function addProduct(product) {
    const newProduct = { ...product, id: crypto.randomUUID() }
    setProducts((prev) => [...prev, newProduct])
    addAuditLog('Produto cadastrado', { productName: newProduct.name })
    return newProduct
  }

  function updateProduct(id, updates) {
    setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
    addAuditLog('Produto atualizado', { productId: id, productName: updates.name })
  }

  function deleteProduct(id) {
    if (!permissions.canManageSensitive) return { success: false, message: 'Apenas administradores podem excluir produtos.' }
    const product = products.find((p) => p.id === id)
    setProducts((prev) => prev.filter((p) => p.id !== id))
    addAuditLog('Produto excluído', { productId: id, productName: product?.name })
    return { success: true }
  }

  function addSale(saleItems, options = {}) {
    if (!saleItems.length) {
      return { success: false, message: 'Adicione pelo menos um produto para registrar a venda.' }
    }

    const invalidItem = saleItems.find((item) => {
      const product = products.find((p) => p.id === item.id)
      return !product || item.quantity <= 0 || item.quantity > Number(product.quantity)
    })

    if (invalidItem) {
      return {
        success: false,
        message: `Estoque insuficiente para "${invalidItem.name}". Revise a quantidade antes de finalizar.`,
      }
    }

    const normalizedItems = saleItems.map((item) => {
      const product = products.find((p) => p.id === item.id)
      const price = Number(item.price) || 0
      const quantity = Number(item.quantity) || 0
      const lineSubtotal = price * quantity
      const productDiscountMode = product?.discountMode || 'none'
      const productDiscountValue = Number(product?.discountValue) || 0
      const productDiscount = productDiscountMode === 'percent'
        ? Math.min(lineSubtotal * (Math.min(productDiscountValue, 100) / 100), lineSubtotal)
        : productDiscountMode === 'amount'
          ? Math.min(productDiscountValue * quantity, lineSubtotal)
          : 0

      return {
        id: item.id,
        name: item.name,
        price,
        costPrice: Number(product?.costPrice) || 0,
        barcode: product?.barcode || '',
        quantity,
        lineSubtotal,
        productDiscountMode,
        productDiscountValue,
        productDiscount,
      }
    })

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.lineSubtotal, 0)
    const productDiscountTotal = normalizedItems.reduce((sum, item) => sum + item.productDiscount, 0)
    const manualDiscountBase = Math.max(0, subtotal - productDiscountTotal)
    const manualDiscount = Math.min(Math.max(Number(options.manualDiscount ?? options.discount) || 0, 0), manualDiscountBase)
    const discount = productDiscountTotal + manualDiscount
    const total = Math.max(0, subtotal - discount)
    const newSale = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      items: normalizedItems,
      subtotal,
      discount,
      productDiscountTotal,
      manualDiscount,
      discountMode: options.discountMode === 'percent' ? 'percent' : 'amount',
      discountValue: Number(options.discountValue) || manualDiscount,
      paymentMethod: options.paymentMethod || 'Não informado',
      cashReceived: Number(options.cashReceived) || 0,
      cashChange: Number(options.cashChange) || 0,
      customerName: String(options.customerName || '').trim(),
      note: String(options.note || '').trim(),
      total,
    }

    // Deduct stock
    setProducts((prev) =>
      prev.map((p) => {
        const sold = normalizedItems.find((i) => i.id === p.id)
        if (sold) {
          return { ...p, quantity: Math.max(0, p.quantity - sold.quantity) }
        }
        return p
      })
    )

    setSales((prev) => [newSale, ...prev])
    addAuditLog('Venda registrada', { saleId: newSale.id, total: newSale.total, customerName: newSale.customerName })
    return { success: true, sale: newSale }
  }

  function deleteSale(id) {
    const sale = sales.find((s) => s.id === id)
    if (sale) {
      // Restore stock
      setProducts((prev) =>
        prev.map((p) => {
          const item = sale.items.find((i) => i.id === p.id)
          if (item) {
            return { ...p, quantity: p.quantity + item.quantity }
          }
          return p
        })
      )
    }
    setSales((prev) => prev.filter((s) => s.id !== id))
  }

  function cancelSale(id, reason = '') {
    if (!permissions.canManageSensitive) return { success: false, message: 'Apenas administradores podem cancelar vendas.' }
    const sale = sales.find((s) => s.id === id)
    if (!sale) return { success: false, message: 'Venda não encontrada.' }

    deleteSale(id)
    setCanceledSales((prev) => [
      {
        ...sale,
        canceledAt: new Date().toISOString(),
        cancelReason: String(reason || 'Motivo não informado').trim(),
      },
      ...prev,
    ])
    addAuditLog('Venda cancelada', { saleId: id, reason, total: sale.total })
    return { success: true }
  }

  function addCashMovement(movement) {
    const value = Number(movement.value) || 0
    if (value <= 0) {
      return { success: false, message: 'Informe um valor maior que zero.' }
    }

    const newMovement = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      type: movement.type === 'withdrawal' ? 'withdrawal' : 'inflow',
      value,
      description: String(movement.description || '').trim(),
    }

    setCashMovements((prev) => [newMovement, ...prev])
    addAuditLog(newMovement.type === 'withdrawal' ? 'Sangria registrada' : 'Reforço registrado', {
      value: newMovement.value,
      description: newMovement.description,
    })
    return { success: true, movement: newMovement }
  }

  function deleteCashMovement(id) {
    setCashMovements((prev) => prev.filter((movement) => movement.id !== id))
    addAuditLog('Movimentação de caixa excluída', { movementId: id })
  }

  function replaceData(nextProducts, nextSales, nextCashMovements = [], nextCanceledSales = [], nextAuditLogs = []) {
    setProducts(Array.isArray(nextProducts) ? nextProducts : [])
    setSales(Array.isArray(nextSales) ? nextSales : [])
    setCashMovements(Array.isArray(nextCashMovements) ? nextCashMovements : [])
    setCanceledSales(Array.isArray(nextCanceledSales) ? nextCanceledSales : [])
    setAuditLogs(Array.isArray(nextAuditLogs) ? nextAuditLogs : [])
  }

  return (
    <DataContext.Provider
      value={{
        products,
        sales,
        cashMovements,
        canceledSales,
        auditLogs,
        permissions,
        loaded,
        addProduct,
        updateProduct,
        deleteProduct,
        addSale,
        deleteSale,
        cancelSale,
        addCashMovement,
        deleteCashMovement,
        replaceData,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}
