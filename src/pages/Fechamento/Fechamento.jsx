import { useState } from 'react'
import { AlertTriangle, CalendarDays, ClipboardList, PackageCheck, Printer, TrendingUp, Wallet } from 'lucide-react'
import useData from '../../hooks/useData'
import { useToast } from '../../context/ToastContext'
import { formatCurrency, formatDateTime } from '../../utils/formatters'
import styles from './Fechamento.module.scss'

function parseCurrencyInput(value) {
  const cents = String(value || '').replace(/\D/g, '')
  return Number((Number(cents || '0') / 100).toFixed(2))
}

function formatCurrencyInput(value) {
  return formatCurrency(Number(value || 0))
}

function getDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getPeriodBounds(mode, customStart, customEnd) {
  const today = new Date()
  const start = new Date(today)
  const end = new Date(today)

  start.setHours(0, 0, 0, 0)
  end.setHours(23, 59, 59, 999)

  if (mode === 'week') {
    const day = today.getDay()
    const diff = day === 0 ? 6 : day - 1
    start.setDate(today.getDate() - diff)
  }

  if (mode === 'month') {
    start.setDate(1)
  }

  if (mode === 'custom') {
    const customStartDate = customStart ? new Date(`${customStart}T00:00:00`) : new Date(`${getDateInputValue(today)}T00:00:00`)
    const customEndDate = customEnd ? new Date(`${customEnd}T23:59:59`) : new Date(`${getDateInputValue(today)}T23:59:59`)

    return {
      start: Number.isNaN(customStartDate.getTime()) ? start : customStartDate,
      end: Number.isNaN(customEndDate.getTime()) ? end : customEndDate,
    }
  }

  return { start, end }
}

function isWithinPeriod(value, bounds) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false

  return date >= bounds.start && date <= bounds.end
}

function formatPeriodLabel(bounds) {
  const start = bounds.start.toLocaleDateString('pt-BR')
  const end = bounds.end.toLocaleDateString('pt-BR')

  return start === end ? start : `${start} até ${end}`
}

export default function Fechamento() {
  const { products, sales, cashMovements, canceledSales, auditLogs, addCashMovement } = useData()
  const { pushToast } = useToast()
  const [periodMode, setPeriodMode] = useState('today')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [movementForm, setMovementForm] = useState({
    type: 'inflow',
    value: formatCurrencyInput(0),
    description: '',
  })
  const [showCashAdjustment, setShowCashAdjustment] = useState(false)

  const periodBounds = getPeriodBounds(periodMode, customStart, customEnd)
  const todaySales = sales.filter((sale) => isWithinPeriod(sale.date, periodBounds))
  const todayCashMovements = cashMovements.filter((movement) => isWithinPeriod(movement.date, periodBounds))
  const todayCanceledSales = canceledSales.filter((sale) => isWithinPeriod(sale.canceledAt, periodBounds))
  const periodAuditLogs = auditLogs.filter((log) => isWithinPeriod(log.date, periodBounds)).slice(0, 12)
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0)
  const todayDiscounts = todaySales.reduce((sum, sale) => sum + (Number(sale.discount) || 0), 0)
  const todayGrossRevenue = todaySales.reduce(
    (sum, sale) => sum + (Number(sale.subtotal) || Number(sale.total) + (Number(sale.discount) || 0)),
    0
  )
  const todayItems = todaySales.reduce(
    (sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
    0
  )
  const averageTicket = todaySales.length > 0 ? todayRevenue / todaySales.length : 0
  const highestSale = todaySales.reduce((highest, sale) => Math.max(highest, sale.total), 0)
  const todayCost = todaySales.reduce(
    (saleSum, sale) =>
      saleSum + sale.items.reduce((itemSum, item) => itemSum + (Number(item.costPrice) || 0) * (Number(item.quantity) || 0), 0),
    0
  )
  const todayProfit = todayRevenue - todayCost
  const profitMargin = todayRevenue > 0 ? (todayProfit / todayRevenue) * 100 : 0
  const cashInflow = todayCashMovements
    .filter((movement) => movement.type === 'inflow')
    .reduce((sum, movement) => sum + (Number(movement.value) || 0), 0)
  const cashWithdrawal = todayCashMovements
    .filter((movement) => movement.type === 'withdrawal')
    .reduce((sum, movement) => sum + (Number(movement.value) || 0), 0)
  const cashSales = todaySales
    .filter((sale) => sale.paymentMethod === 'Dinheiro')
    .reduce((sum, sale) => sum + (Number(sale.total) || 0), 0)
  const cashBalance = cashSales + cashInflow - cashWithdrawal
  const canceledTotal = todayCanceledSales.reduce((sum, sale) => sum + (Number(sale.total) || 0), 0)
  const lowStockProducts = products.filter((product) => Number(product.quantity) <= 5)
  const salesWithNotes = todaySales.filter((sale) => sale.note)
  const productSummary = todaySales
    .flatMap((sale) => sale.items)
    .reduce((acc, item) => {
      const key = item.id || item.name
      if (!acc[key]) {
        acc[key] = {
          id: key,
          name: item.name || 'Produto',
          quantity: 0,
          revenue: 0,
        }
      }

      acc[key].quantity += Number(item.quantity) || 0
      acc[key].revenue += ((Number(item.price) || 0) * (Number(item.quantity) || 0)) - (Number(item.productDiscount) || 0)
      return acc
    }, {})
  const soldProducts = Object.values(productSummary).sort((a, b) => b.quantity - a.quantity)
  const paymentSummary = todaySales.reduce((acc, sale) => {
    const method = sale.paymentMethod || 'Não informado'
    if (!acc[method]) acc[method] = { method, count: 0, total: 0 }
    acc[method].count += 1
    acc[method].total += Number(sale.total) || 0
    return acc
  }, {})
  const todayLabel = formatPeriodLabel(periodBounds)
  const currentDateLabel = new Date().toLocaleDateString('pt-BR')
  const periodNoun = 'período'

  function handleMovementSubmit(e) {
    e.preventDefault()

    const result = addCashMovement({
      type: movementForm.type,
      value: parseCurrencyInput(movementForm.value),
      description: movementForm.description,
    })

    if (!result.success) {
      pushToast({
        type: 'danger',
        title: 'Movimentação não registrada',
        message: result.message,
      })
      return
    }

    pushToast({
      type: 'success',
      title: 'Caixa atualizado',
      message: 'A movimentação foi adicionada ao fechamento do dia.',
    })

    setMovementForm({
      type: 'inflow',
      value: formatCurrencyInput(0),
      description: '',
    })
    setShowCashAdjustment(false)
  }

  function handleSendReport() {
    const reportText = [
      `Fechamento GereLocal - ${todayLabel}`,
      `Entrou: ${formatCurrency(todayRevenue)}`,
      `Vendas: ${todaySales.length}`,
      `Itens vendidos: ${todayItems}`,
      `Saldo em caixa: ${formatCurrency(cashBalance)}`,
    ].join('\n')

    if (navigator.share) {
      navigator.share({ title: 'Relatório do período', text: reportText }).catch(() => {})
      return
    }

    window.location.href = `mailto:?subject=${encodeURIComponent('Relatório do período')}&body=${encodeURIComponent(reportText)}`
  }

  return (
    <div className={styles.page}>
      <section className={styles.periodBar} aria-label="Período do fechamento">
        <div className={styles.periodButtons}>
          <button type="button" className={periodMode === 'today' ? styles.periodActive : styles.periodBtn} onClick={() => setPeriodMode('today')}>
            Hoje
          </button>
          <button type="button" className={periodMode === 'week' ? styles.periodActive : styles.periodBtn} onClick={() => setPeriodMode('week')}>
            Semana
          </button>
          <button type="button" className={periodMode === 'month' ? styles.periodActive : styles.periodBtn} onClick={() => setPeriodMode('month')}>
            Mês
          </button>
          <button type="button" className={periodMode === 'custom' ? styles.periodActive : styles.periodBtn} onClick={() => setPeriodMode('custom')}>
            Personalizado
          </button>
        </div>

        <div className={styles.periodRight}>
          {periodMode === 'custom' ? (
            <div className={styles.customPeriod}>
              <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} aria-label="Início do período" />
              <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} aria-label="Fim do período" />
            </div>
          ) : null}

          <div className={styles.dateBadge}>
            <CalendarDays size={18} strokeWidth={1.8} aria-hidden="true" />
            {currentDateLabel}
          </div>
        </div>
      </section>

      <section className={styles.summary}>
        <div className={styles.box}>
          <span>Entrou no período</span>
          <strong>{formatCurrency(todayRevenue)}</strong>
        </div>
        <div className={styles.box}>
          <span>Bruto vendido</span>
          <strong>{formatCurrency(todayGrossRevenue)}</strong>
        </div>
        <div className={styles.box}>
          <span>Descontos</span>
          <strong>{formatCurrency(todayDiscounts)}</strong>
        </div>
        <div className={styles.box}>
          <span>Vendas no período</span>
          <strong>{todaySales.length}</strong>
        </div>
        <div className={styles.box}>
          <span>Itens vendidos</span>
          <strong>{todayItems}</strong>
        </div>
        <div className={styles.box}>
          <span>Ticket médio</span>
          <strong>{formatCurrency(averageTicket)}</strong>
        </div>
        <div className={styles.box}>
          <span>Maior venda</span>
          <strong>{formatCurrency(highestSale)}</strong>
        </div>
        <div className={styles.box}>
          <span>Lucro estimado</span>
          <strong>{formatCurrency(todayProfit)}</strong>
        </div>
        <div className={styles.box}>
          <span>Margem</span>
          <strong>{profitMargin.toFixed(1)}%</strong>
        </div>
        <div className={styles.box}>
          <span>Saldo em caixa</span>
          <strong>{formatCurrency(cashBalance)}</strong>
        </div>
      </section>

      <section className={styles.reportSection}>
        <div className={styles.sectionTitle}>
          <Wallet size={22} strokeWidth={1.8} aria-hidden="true" />
          <h3>Caixa em dinheiro e ajustes</h3>
        </div>
        <p className={styles.sectionHint}>
          Vendas em dinheiro entram automaticamente no saldo. Use sangria ou reforço apenas quando dinheiro sair ou entrar no caixa fora de uma venda.
        </p>

        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => setShowCashAdjustment((current) => !current)}
        >
          {showCashAdjustment ? 'Ocultar ajuste de caixa' : 'Adicionar sangria/reforço'}
        </button>

        {showCashAdjustment ? (
          <form className={styles.cashForm} onSubmit={handleMovementSubmit}>
            <select
              value={movementForm.type}
              onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value })}
              aria-label="Tipo de movimentação"
            >
              <option value="inflow">Reforço</option>
              <option value="withdrawal">Sangria</option>
            </select>
            <input
              type="text"
              inputMode="numeric"
              value={movementForm.value}
              onChange={(e) => setMovementForm({ ...movementForm, value: formatCurrencyInput(parseCurrencyInput(e.target.value)) })}
              aria-label="Valor da movimentação"
            />
            <input
              type="text"
              value={movementForm.description}
              onChange={(e) => setMovementForm({ ...movementForm, description: e.target.value })}
              placeholder="Descrição"
              aria-label="Descrição da movimentação"
            />
            <button type="submit">Adicionar</button>
          </form>
        ) : null}

        {todayCashMovements.length === 0 ? (
          <div className={styles.empty}>Nenhuma sangria ou reforço registrado neste {periodNoun}.</div>
        ) : (
          <div className={styles.movementList}>
            {todayCashMovements.map((movement) => (
              <div key={movement.id} className={styles.movementItem}>
                <div>
                  <strong>{movement.type === 'withdrawal' ? 'Sangria' : 'Reforço'}</strong>
                  <span>{movement.description || 'Sem descrição'} - {formatDateTime(movement.date)}</span>
                </div>
                <strong className={movement.type === 'withdrawal' ? styles.negative : styles.positive}>
                  {movement.type === 'withdrawal' ? '-' : '+'}{formatCurrency(movement.value)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.reportSection}>
        <div className={styles.sectionTitle}>
          <PackageCheck size={22} strokeWidth={1.8} aria-hidden="true" />
          <h3>Formas de pagamento</h3>
        </div>

        {todaySales.length === 0 ? (
          <div className={styles.empty}>Nenhum pagamento registrado neste período.</div>
        ) : (
          <div className={styles.paymentGrid}>
            {Object.values(paymentSummary).map((payment) => (
              <div key={payment.method} className={styles.paymentCard}>
                <span>{payment.method}</span>
                <strong>{formatCurrency(payment.total)}</strong>
                <small>{payment.count} venda(s)</small>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.reportSection}>
        <div className={styles.sectionTitle}>
          <TrendingUp size={22} strokeWidth={1.8} aria-hidden="true" />
          <h3>Lucro por produto</h3>
        </div>

        {soldProducts.length === 0 ? (
          <div className={styles.empty}>Nenhum lucro calculado neste período.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Custo</th>
                  <th>Lucro</th>
                </tr>
              </thead>
              <tbody>
                {soldProducts.map((product) => {
                  const saleItems = todaySales.flatMap((sale) => sale.items).filter((item) => (item.id || item.name) === product.id)
                  const cost = saleItems.reduce(
                    (sum, item) => sum + (Number(item.costPrice) || 0) * (Number(item.quantity) || 0),
                    0
                  )
                  return (
                    <tr key={`${product.id}-profit`}>
                      <td>{product.name}</td>
                      <td>{formatCurrency(cost)}</td>
                      <td>{formatCurrency(product.revenue - cost)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.reportSection}>
        <div className={styles.sectionTitle}>
          <PackageCheck size={22} strokeWidth={1.8} aria-hidden="true" />
          <h3>Produtos vendidos no período</h3>
        </div>

        {soldProducts.length === 0 ? (
          <div className={styles.empty}>Nenhum produto foi vendido neste {periodNoun}.</div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Qtd.</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {soldProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.quantity}</td>
                    <td>{formatCurrency(product.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className={styles.reportSection}>
        <div className={styles.sectionTitle}>
          <Printer size={22} strokeWidth={1.8} aria-hidden="true" />
          <h3>Vendas do período</h3>
        </div>

        {todaySales.length === 0 ? (
          <div className={styles.empty}>Nenhuma venda registrada neste {periodNoun}.</div>
        ) : (
          <div className={styles.salesList}>
            {todaySales.map((sale) => (
              <div key={sale.id} className={styles.saleItem}>
                <div>
                  <strong>Venda #{sale.id.slice(0, 8)}</strong>
                  <span>
                    {formatDateTime(sale.date)} - {sale.customerName ? `${sale.customerName} - ` : ''}
                    {sale.paymentMethod || 'Não informado'}
                  </span>
                </div>
                <p>{sale.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}</p>
                <div className={styles.saleTotals}>
                  {(Number(sale.discount) || 0) > 0 ? (
                    <span>Desc. {formatCurrency(sale.discount)}</span>
                  ) : null}
                  <strong>{formatCurrency(sale.total)}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.reportSection}>
        <div className={styles.sectionTitle}>
          <AlertTriangle size={22} strokeWidth={1.8} aria-hidden="true" />
          <h3>Cancelamentos e estoque baixo</h3>
        </div>

        <div className={styles.splitGrid}>
          <div>
            <h4>Cancelamentos do dia</h4>
            {todayCanceledSales.length === 0 ? (
              <p className={styles.muted}>Nenhuma venda cancelada neste período.</p>
            ) : (
              <div className={styles.compactList}>
                {todayCanceledSales.map((sale) => (
                  <div key={`${sale.id}-${sale.canceledAt}`}>
                    <strong>{formatCurrency(sale.total)}</strong>
                    <span>{sale.cancelReason}</span>
                  </div>
                ))}
              </div>
            )}
            <p className={styles.totalLine}>Total cancelado: {formatCurrency(canceledTotal)}</p>
          </div>

          <div>
            <h4>Estoque baixo após vendas</h4>
            {lowStockProducts.length === 0 ? (
              <p className={styles.muted}>Nenhum produto em estoque baixo.</p>
            ) : (
              <div className={styles.compactList}>
                {lowStockProducts.map((product) => (
                  <div key={product.id}>
                    <strong>{product.name}</strong>
                    <span>{product.quantity} em estoque</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.reportSection}>
        <div className={styles.sectionTitle}>
          <ClipboardList size={22} strokeWidth={1.8} aria-hidden="true" />
          <h3>Observações das vendas</h3>
        </div>

        {salesWithNotes.length === 0 ? (
          <div className={styles.empty}>Nenhuma observação registrada neste período.</div>
        ) : (
          <div className={styles.compactList}>
            {salesWithNotes.map((sale) => (
              <div key={`${sale.id}-note`}>
                <strong>Venda #{sale.id.slice(0, 8)}</strong>
                <span>{sale.note}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.reportSection}>
        <div className={styles.sectionTitle}>
          <ClipboardList size={22} strokeWidth={1.8} aria-hidden="true" />
          <h3>Auditoria do período</h3>
        </div>

        {periodAuditLogs.length === 0 ? (
          <div className={styles.empty}>Nenhuma ação importante registrada neste período.</div>
        ) : (
          <div className={styles.compactList}>
            {periodAuditLogs.map((log) => (
              <div key={log.id}>
                <strong>{log.action}</strong>
                <span>{formatDateTime(log.date)} - {log.userName}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <button className={styles.printBtn} type="button" onClick={handleSendReport}>
        <Printer size={24} strokeWidth={1.8} aria-hidden="true" />
        Enviar relatório
      </button>
    </div>
  )
}
