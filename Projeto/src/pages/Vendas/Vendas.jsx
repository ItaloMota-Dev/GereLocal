import { useEffect, useState } from 'react'
import { Search, Trash2, X } from 'lucide-react'

import Modal from '../../components/Modal/Modal'
import useData from '../../hooks/useData'
import { useToast } from '../../context/ToastContext'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import confirmDeleteStyles from '../Estoque/EstoqueConfirmDelete.module.scss'
import styles from './Vendas.module.scss'

function formatInputDate(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

function parseInputDate(value, endOfDay = false) {
  const [day, month, year] = value.split('/').map((part) => Number(part))
  if (!day || !month || !year) return null

  const date = new Date(year, month - 1, day, endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0)
  if (Number.isNaN(date.getTime())) return null
  return date
}

function parseCurrencyInput(value) {
  const cents = String(value || '').replace(/\D/g, '')
  return Number((Number(cents || '0') / 100).toFixed(2))
}

function formatCurrencyInput(value) {
  return formatCurrency(Number(value || 0))
}

const paymentMethods = ['Pix', 'Dinheiro', 'Cartão de débito', 'Cartão de crédito', 'Outro']

function getItemProductDiscount(item) {
  const subtotal = (Number(item.price) || 0) * (Number(item.quantity) || 0)
  const discountValue = Number(item.discountValue) || 0

  if (item.discountMode === 'percent') {
    return Math.min(subtotal * (Math.min(discountValue, 100) / 100), subtotal)
  }

  if (item.discountMode === 'amount') {
    return Math.min(discountValue * (Number(item.quantity) || 0), subtotal)
  }

  return 0
}

export default function Vendas() {
  const { products, sales, addSale, cancelSale, permissions } = useData()
  const { pushToast } = useToast()
  const isAdmin = permissions.canManageSensitive

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [saleToDelete, setSaleToDelete] = useState(null)
  const [cart, setCart] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('Pix')
  const [cashReceivedInput, setCashReceivedInput] = useState(formatCurrencyInput(0))
  const [customerName, setCustomerName] = useState('')
  const [discountMode, setDiscountMode] = useState('amount')
  const [discountInput, setDiscountInput] = useState(formatCurrencyInput(0))
  const [saleNote, setSaleNote] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [search, setSearch] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [quickPeriod, setQuickPeriod] = useState('today')

  const itemsPerPage = 10
  const [currentPage, setCurrentPage] = useState(1)

  const filteredSales = sales.filter((sale) => {
    const query = search.trim().toLowerCase()
    const saleDate = new Date(sale.date)
    const saleText = [sale.id, sale.paymentMethod, sale.customerName, ...sale.items.map((item) => item.name)].join(' ').toLowerCase()
    const minTotal = minValue === '' ? null : Number(minValue)
    const maxTotal = maxValue === '' ? null : Number(maxValue)

    if (query && !saleText.includes(query)) return false
    if (Number.isFinite(minTotal) && sale.total < minTotal) return false
    if (Number.isFinite(maxTotal) && sale.total > maxTotal) return false

    if (startDate) {
      const start = parseInputDate(startDate)
      if (start && saleDate < start) return false
    }

    if (endDate) {
      const end = parseInputDate(endDate, true)
      if (end && saleDate > end) return false
    }

    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredSales.length / itemsPerPage))
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, startDate, endDate, minValue, maxValue])

  function openModal() {
    setCart([])
    setPaymentMethod('Pix')
    setCashReceivedInput(formatCurrencyInput(0))
    setCustomerName('')
    setDiscountMode('amount')
    setDiscountInput(formatCurrencyInput(0))
    setSaleNote('')
    setIsModalOpen(true)
  }

  function applyQuickFilter(period) {
    setQuickPeriod(period)
    const today = new Date()
    const start = new Date(today)
    const end = new Date(today)

    if (period === 'week') {
      const day = today.getDay()
      const diff = day === 0 ? 6 : day - 1
      start.setDate(today.getDate() - diff)
    }

    if (period === 'month') {
      start.setDate(1)
    }

    setStartDate(formatInputDate(start))
    setEndDate(formatInputDate(end))
  }

  function cycleQuickFilter() {
    const periods = ['today', 'week', 'month']
    const nextPeriod = periods[(periods.indexOf(quickPeriod) + 1) % periods.length]
    applyQuickFilter(nextPeriod)
  }

  function getQuickFilterLabel() {
    if (quickPeriod === 'week') return 'Esta Semana'
    if (quickPeriod === 'month') return 'Este Mês'
    return 'Hoje'
  }

  function handleDateRangeChange(value) {
    const [start = '', end = ''] = value.split(/\s*-\s*/)
    setStartDate(start.trim())
    setEndDate(end.trim())
  }

  function closeModal() {
    setIsModalOpen(false)
    setCart([])
    setPaymentMethod('Pix')
    setCashReceivedInput(formatCurrencyInput(0))
    setCustomerName('')
    setDiscountMode('amount')
    setDiscountInput(formatCurrencyInput(0))
    setSaleNote('')
  }

  function addToCart(product) {
    const existing = cart.find((item) => item.id === product.id)
    if (existing) {
      if (existing.quantity < product.quantity) {
        setCart(cart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        ))
      }
      return
    }

    if (product.quantity > 0) {
      setCart([...cart, {
        ...product,
        discountMode: product.discountMode || 'none',
        discountValue: Number(product.discountValue) || 0,
        quantity: 1,
      }])
    }
  }

  function updateQuantity(id, delta) {
    setCart(cart.map((item) => {
      if (item.id !== id) return item

      const product = products.find((p) => p.id === id)
      const newQty = Math.max(1, Math.min(item.quantity + delta, product?.quantity || 0))
      return { ...item, quantity: newQty }
    }))
  }

  function removeFromCart(id) {
    setCart(cart.filter((item) => item.id !== id))
  }

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartProductDiscount = cart.reduce((sum, item) => sum + getItemProductDiscount(item), 0)
  const manualDiscountBase = Math.max(0, cartSubtotal - cartProductDiscount)
  const discountPercent = Math.min(Math.max(Number(String(discountInput).replace(',', '.')) || 0, 0), 100)
  const manualDiscount = discountMode === 'percent'
    ? Math.min(manualDiscountBase * (discountPercent / 100), manualDiscountBase)
    : Math.min(parseCurrencyInput(discountInput), manualDiscountBase)
  const cartDiscount = cartProductDiscount + manualDiscount
  const cartTotal = Math.max(0, cartSubtotal - cartDiscount)
  const cashReceived = paymentMethod === 'Dinheiro' ? parseCurrencyInput(cashReceivedInput) : 0
  const cashChange = paymentMethod === 'Dinheiro' ? Math.max(0, cashReceived - cartTotal) : 0

  function handleFinalize() {
    if (cart.length === 0) return

    if (paymentMethod === 'Dinheiro' && cashReceived < cartTotal) {
      pushToast({
        type: 'danger',
        title: 'Valor recebido insuficiente',
        message: 'Informe um valor recebido em dinheiro maior ou igual ao total.',
        durationMs: 4500,
      })
      return
    }

    const saleItems = cart.map(({ id, name, price, quantity }) => ({
      id,
      name,
      price,
      quantity,
    }))

    const result = addSale(saleItems, {
      paymentMethod,
      manualDiscount,
      discountMode,
      discountValue: discountMode === 'percent' ? discountPercent : manualDiscount,
      cashReceived,
      cashChange,
      customerName,
      note: saleNote,
    })

    if (!result.success) {
      pushToast({
        type: 'danger',
        title: 'Venda não registrada',
        message: result.message,
        durationMs: 5000,
      })
      return
    }

    pushToast({
      type: 'success',
      title: 'Venda finalizada',
      message: `Venda registrada com sucesso. Total: ${formatCurrency(cartTotal)}.`,
      durationMs: 5000,
    })

    closeModal()
  }

  function openDeleteSaleModal(id) {
    const sale = sales.find((s) => s.id === id)
    if (sale) {
      setSaleToDelete(sale)
      setCancelReason('')
    }
  }

  function closeDeleteSaleModal() {
    setSaleToDelete(null)
    setCancelReason('')
  }

  function confirmDeleteSale() {
    if (!saleToDelete) return

    if (!cancelReason.trim()) {
      pushToast({
        type: 'danger',
        title: 'Informe o motivo',
        message: 'Digite o motivo do cancelamento para continuar.',
        durationMs: 4500,
      })
      return
    }

    const result = cancelSale(saleToDelete.id, cancelReason)
    if (!result.success) {
      pushToast({
        type: 'danger',
        title: 'Venda não cancelada',
        message: result.message,
        durationMs: 4500,
      })
      return
    }

    pushToast({
      type: 'warning',
      title: 'Venda cancelada',
      message: `A venda de ${formatCurrency(saleToDelete.total)} foi cancelada e o estoque foi restaurado.`,
      durationMs: 4500,
    })

    setCurrentPage((p) => {
      const nextTotalPages = Math.max(1, Math.ceil((filteredSales.length - 1) / itemsPerPage))
      return Math.min(p, nextTotalPages)
    })

    closeDeleteSaleModal()
  }

  const safeCurrentPage = Math.min(currentPage, totalPages)
  const safeCurrentSales = filteredSales.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  )
  const emptyRows = Array.from({ length: Math.max(0, itemsPerPage - safeCurrentSales.length) })
  const dateRangeValue = startDate || endDate ? `${startDate} - ${endDate}` : ''

  function getVisiblePages() {
    const maxVisible = 7
    if (totalPages <= maxVisible) return pageNumbers

    const pages = new Set([1, totalPages])
    const start = Math.max(2, safeCurrentPage - 2)
    const end = Math.min(totalPages - 1, safeCurrentPage + 2)

    for (let page = start; page <= end; page += 1) pages.add(page)

    const ordered = Array.from(pages).sort((a, b) => a - b)
    const withEllipsis = []

    for (let index = 0; index < ordered.length; index += 1) {
      const page = ordered[index]
      const next = ordered[index + 1]
      withEllipsis.push(page)
      if (next && next - page > 1) withEllipsis.push('...')
    }

    return withEllipsis
  }

  return (
    <div className={styles.vendas}>
      <div className={styles.header}>
        <div className={styles.filterPanel}>
          {isAdmin ? (
            <>
              <div className={styles.filterRow}>
                <div className={styles.searchWrap}>
                  <Search size={18} strokeWidth={1.6} aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Buscar venda ou produto..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.search}
                  />
                </div>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Valor mínimo"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  className={styles.valueFilter}
                  aria-label="Valor mínimo"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Valor máximo"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  className={styles.valueFilter}
                  aria-label="Valor máximo"
                />

                <input
                  type="text"
                  value={dateRangeValue}
                  onChange={(e) => handleDateRangeChange(e.target.value)}
                  className={styles.dateRangeFilter}
                  aria-label="Período da venda"
                  placeholder="dd/mm/aaaa - dd/mm/aaaa"
                />

                <div className={styles.quickFilters} aria-label="Filtro rápido">
                  <button type="button" onClick={cycleQuickFilter}>{getQuickFilterLabel()}</button>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.sellerActions}>
              <button className={styles.addBtn} onClick={openModal}>
                + Nova Venda
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.list}>
        {sales.length === 0 ? (
          <div className={styles.empty}>
            Nenhuma venda registrada. Clique em "+ Nova Venda" para começar.
          </div>
        ) : filteredSales.length === 0 ? (
          <div className={styles.empty}>
            Nenhuma venda encontrada com os filtros atuais.
          </div>
        ) : (
          <>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Data</th>
                  <th>Itens</th>
                  <th>Total</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {safeCurrentSales.map((sale) => (
                  <tr key={sale.id}>
                    <td className={styles.id}>#{sale.id.slice(0, 8)}</td>
                    <td>{formatDateTime(sale.date)}</td>
                    <td>
                      <div className={styles.saleItems}>
                        <strong>
                          {sale.items.reduce((sum, item) => sum + item.quantity, 0)} produto(s)
                        </strong>
                        <span title={sale.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}>
                          {sale.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}
                        </span>
                        <small>
                          {sale.customerName ? `${sale.customerName} - ` : ''}{sale.paymentMethod || 'Não informado'}
                          {(Number(sale.discount) || 0) > 0 ? ` - desc. ${formatCurrency(sale.discount)}` : ''}
                        </small>
                      </div>
                    </td>
                    <td className={styles.total}>{formatCurrency(sale.total)}</td>
                    <td>
                      <button
                        className={styles.delete}
                        onClick={() => openDeleteSaleModal(sale.id)}
                        title="Cancelar venda"
                        aria-label="Cancelar venda"
                      >
                        <Trash2 size={18} strokeWidth={1.5} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
                {emptyRows.map((_, index) => (
                  <tr key={`empty-slot-${index}`} className={styles.emptySlot} aria-hidden="true">
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
              >
                Anterior
              </button>

              <div className={styles.pageNumbers}>
                {getVisiblePages().map((page, index) =>
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className={styles.ellipsis}>
                      ...
                    </span>
                  ) : (
                    <button
                      key={page}
                      className={page === safeCurrentPage ? styles.pageBtnActive : styles.pageBtn}
                      onClick={() => setCurrentPage(page)}
                      aria-current={page === safeCurrentPage ? 'page' : undefined}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>

              <button
                className={styles.pageBtn}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage >= totalPages}
              >
                Próxima
              </button>
            </div>
          </>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title="Nova Venda" size="wide">
        <div className={styles.modalContent}>
          <div className={styles.productsSection}>
            <h4>Selecionar produtos</h4>
            <div className={styles.productList}>
              {products.length === 0 ? (
                <p className={styles.noProducts}>Nenhum produto em estoque.</p>
              ) : (
                products.map((product) => (
                  <button
                    key={product.id}
                    className={styles.productBtn}
                    onClick={() => addToCart(product)}
                    disabled={product.quantity === 0}
                  >
                    <span>{product.name}</span>
                    <span className={styles.productMeta}>
                      {formatCurrency(product.price)} - {product.quantity} disp.
                      {product.barcode ? ` - ${product.barcode}` : ''}
                      {product.discountMode && product.discountMode !== 'none' && Number(product.discountValue) > 0
                        ? ` - desc. ${product.discountMode === 'percent' ? `${product.discountValue}%` : formatCurrency(product.discountValue)}`
                        : ''}
                    </span>
                    <strong className={styles.addProductText}>Adicionar</strong>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className={styles.cartSection}>
            <h4>Carrinho</h4>
            {cart.length === 0 ? (
              <p className={styles.emptyCart}>Nenhum item selecionado.</p>
            ) : (
              <div className={styles.cartItems}>
                {cart.map((item) => (
                  <div key={item.id} className={styles.cartItem}>
                    <div className={styles.cartInfo}>
                      <span className={styles.cartName}>{item.name}</span>
                      <span className={styles.cartPrice}>
                        {formatCurrency(item.price)} un.
                        {getItemProductDiscount(item) > 0 ? ` - desc. ${formatCurrency(getItemProductDiscount(item))}` : ''}
                      </span>
                    </div>
                    <div className={styles.qtyControl}>
                      <button onClick={() => updateQuantity(item.id, -1)} aria-label="Diminuir quantidade">-</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} aria-label="Aumentar quantidade">+</button>
                    </div>
                    <span className={styles.itemTotal}>
                      {formatCurrency(item.price * item.quantity - getItemProductDiscount(item))}
                    </span>
                    <button
                      className={styles.remove}
                      onClick={() => removeFromCart(item.id)}
                      title="Remover item"
                      aria-label="Remover item"
                    >
                      <X size={18} strokeWidth={1.5} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.saleOptions}>
              <label>
                Cliente
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Opcional"
                />
              </label>

              <label>
                Forma de pagamento
                <select
                  value={paymentMethod}
                  onChange={(e) => {
                    setPaymentMethod(e.target.value)
                    if (e.target.value === 'Dinheiro') setCashReceivedInput(formatCurrencyInput(cartTotal))
                  }}
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </label>

              {paymentMethod === 'Dinheiro' ? (
                <label>
                  Valor recebido
                  <input
                    type="text"
                    inputMode="numeric"
                    value={cashReceivedInput}
                    onChange={(e) => setCashReceivedInput(formatCurrencyInput(parseCurrencyInput(e.target.value)))}
                  />
                </label>
              ) : null}

              <label>
                Desconto
                <div className={styles.discountControl}>
                  <div className={styles.discountModes} aria-label="Tipo de desconto">
                    <button
                      type="button"
                      className={discountMode === 'amount' ? styles.discountModeActive : styles.discountModeBtn}
                      onClick={() => {
                        setDiscountMode('amount')
                        setDiscountInput(formatCurrencyInput(manualDiscount))
                      }}
                    >
                      R$
                    </button>
                    <button
                      type="button"
                      className={discountMode === 'percent' ? styles.discountModeActive : styles.discountModeBtn}
                      onClick={() => {
                        setDiscountMode('percent')
                        setDiscountInput('0')
                      }}
                    >
                      %
                    </button>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={discountInput}
                    onChange={(e) => {
                      const value = e.target.value
                      setDiscountInput(
                        discountMode === 'percent'
                          ? value.replace(/[^\d,.]/g, '')
                          : formatCurrencyInput(parseCurrencyInput(value))
                      )
                    }}
                    aria-label="Valor do desconto"
                  />
                </div>
              </label>
            </div>

            <label className={styles.noteField}>
              Observação da venda
              <textarea
                value={saleNote}
                onChange={(e) => setSaleNote(e.target.value)}
                rows={2}
                placeholder="Ex.: cliente pediu para separar, entrega depois..."
              />
            </label>

            <div className={styles.cartFooter}>
              <div className={styles.cartLine}>
                <span>Subtotal:</span>
                <span>{formatCurrency(cartSubtotal)}</span>
              </div>
              <div className={styles.cartLine}>
                <span>Desconto automático:</span>
                <span>{formatCurrency(cartProductDiscount)}</span>
              </div>
              <div className={styles.cartLine}>
                <span>Desconto extra:</span>
                <span>{formatCurrency(manualDiscount)}</span>
              </div>
              <div className={styles.cartLine}>
                <span>Desconto total:</span>
                <span>{formatCurrency(cartDiscount)}</span>
              </div>
              <div className={styles.cartTotal}>
                <span>Total:</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              {paymentMethod === 'Dinheiro' ? (
                <div className={styles.cartLine}>
                  <span>Troco:</span>
                  <span>{formatCurrency(cashChange)}</span>
                </div>
              ) : null}
              <button
                className={styles.finalize}
                onClick={handleFinalize}
                disabled={cart.length === 0}
              >
                Finalizar Venda
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(saleToDelete)}
        onClose={closeDeleteSaleModal}
        title="Excluir venda"
      >
        <div className={confirmDeleteStyles.body}>
          <p className={confirmDeleteStyles.message}>
            Tem certeza que deseja cancelar esta venda? O estoque dos produtos vendidos sera restaurado.
          </p>
          {!permissions.canManageSensitive ? (
            <p className={confirmDeleteStyles.message}>
              Seu perfil não tem permissão para cancelar vendas.
            </p>
          ) : null}

          <label className={styles.cancelReason}>
            Motivo do cancelamento
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              placeholder="Ex.: cliente desistiu, venda lançada errado..."
            />
          </label>

          <div className={confirmDeleteStyles.actions}>
            <button
              type="button"
              className={confirmDeleteStyles.cancelBtn}
              onClick={closeDeleteSaleModal}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={confirmDeleteStyles.deleteBtn}
              onClick={confirmDeleteSale}
              disabled={!permissions.canManageSensitive}
            >
              Cancelar venda
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
