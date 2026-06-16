import { useRef, useState } from 'react'
import {
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts'

import {
  CircleDollarSign,
  Download,
  FileSpreadsheet,
  MoreHorizontal,
  Receipt,
  Package,
  Upload,
} from 'lucide-react'
import Modal from '../../components/Modal/Modal'
import MetricCard from '../../components/MetricCard/MetricCard'
import useAuth from '../../hooks/useAuth'
import useData from '../../hooks/useData'
import { useToast } from '../../context/ToastContext'
import { buildBackupPayload, parseBackupPayload } from '../../utils/backup'
import { buildProductsCsv, buildSalesCsv, downloadTextFile } from '../../utils/csv'
import { formatCurrency, formatDate } from '../../utils/formatters'
import confirmDeleteStyles from '../Estoque/EstoqueConfirmDelete.module.scss'
import styles from './Dashboard.module.scss'

function getLocalDateKey(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function truncateLabel(value, maxLength = 12) {
  const text = String(value || '')
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}...` : text
}


export default function Dashboard() {
  const { products, sales, cashMovements, canceledSales, auditLogs, replaceData } = useData()
  const { user } = useAuth()
  const { pushToast } = useToast()
  const fileInputRef = useRef(null)
  const [pendingBackup, setPendingBackup] = useState(null)
  const [showMoreActions, setShowMoreActions] = useState(false)

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0)
  const totalSales = sales.length
  const lowStock = products.filter((p) => p.quantity <= 5).length


  const salesByDay = sales.reduce((acc, sale) => {
    const dateKey = getLocalDateKey(sale.date)
    if (!dateKey) return acc

    const qtdItens = sale.items.reduce((sum, item) => sum + item.quantity, 0)

    if (!acc[dateKey]) acc[dateKey] = { total: 0, quantity: 0 }
    acc[dateKey].total += sale.total
    acc[dateKey].quantity += qtdItens

    return acc
  }, {})
  const salesChartData = Object.entries(salesByDay)
    .map(([dateKey, data]) => ({ dateKey, date: formatDate(`${dateKey}T00:00:00`), total: data.total, quantity: data.quantity }))
    .sort((a, b) => new Date(a.dateKey) - new Date(b.dateKey))
    .slice(-7)

  const productSales = {}
  sales.forEach((sale) => {
    sale.items.forEach((item) => {
      const key = item.id || item.name
      const name = item.name || 'Produto'
      const quantity = Number(item.quantity) || 0
      const price = Number(item.price) || 0

      if (!productSales[key]) productSales[key] = { name, quantity: 0, revenue: 0 }
      productSales[key].quantity += quantity
      productSales[key].revenue += price * quantity
    })
  })
  const topProductsData = Object.entries(productSales)
    .map(([id, data]) => ({
      id,
      name: data.name,
      displayName: truncateLabel(data.name),
      quantity: data.quantity,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
  const recentSales = sales
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 7)
  const emptyRecentRows = Array.from({ length: Math.max(0, 7 - recentSales.length) })

  const tooltipStyle = {
    padding: '8px 10px',
    maxWidth: 190,
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    background: '#fff',
    boxShadow: '0 8px 18px rgba(15, 23, 42, 0.08)',
    fontSize: 12,
    lineHeight: 1.35,
    whiteSpace: 'normal',
  }

  const tooltipLabelStyle = {
    marginBottom: 4,
    color: '#111827',
    fontWeight: 700,
    fontSize: 12,
  }

  const tooltipItemStyle = {
    color: '#374151',
    fontSize: 12,
  }

  function exportBackup() {
    const date = new Date().toISOString().slice(0, 10)
    const backup = buildBackupPayload({ user, products, sales, cashMovements, canceledSales, auditLogs })

    downloadTextFile({
      content: JSON.stringify(backup, null, 2),
      filename: `gerelocal-backup-${date}.json`,
      type: 'application/json',
    })

    pushToast({
      type: 'success',
      title: 'Backup gerado',
      message: 'Arquivo com produtos e vendas exportado com sucesso.',
    })
  }

  function exportCsv() {
    const date = new Date().toISOString().slice(0, 10)

    downloadTextFile({
      content: buildProductsCsv(products),
      filename: `gerelocal-produtos-${date}.csv`,
      type: 'text/csv;charset=utf-8',
    })

    downloadTextFile({
      content: buildSalesCsv(sales),
      filename: `gerelocal-vendas-${date}.csv`,
      type: 'text/csv;charset=utf-8',
    })

    pushToast({
      type: 'success',
      title: 'CSV gerado',
      message: 'Arquivos de produtos e vendas exportados para planilha.',
    })
  }

  function handleBackupFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'))

        const result = parseBackupPayload(parsed)

        if (!result.success) {
          pushToast({
            type: 'danger',
            title: 'Backup inválido',
            message: result.message,
          })
          return
        }

        setPendingBackup(result.data)
      } catch {
        pushToast({
          type: 'danger',
          title: 'Backup inválido',
          message: 'Selecione um arquivo de backup gerado pelo GereLocal.',
        })
      }
    }
    reader.readAsText(file)
  }

  function confirmImportBackup() {
    if (!pendingBackup) return

    replaceData(
      pendingBackup.products,
      pendingBackup.sales,
      pendingBackup.cashMovements,
      pendingBackup.canceledSales,
      pendingBackup.auditLogs
    )
    setPendingBackup(null)

    pushToast({
      type: 'success',
      title: 'Backup restaurado',
      message: 'Produtos e vendas foram atualizados com os dados do arquivo.',
    })
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.metrics}>

        <MetricCard
          title="Faturamento Total"
          value={formatCurrency(totalRevenue)}
          icon={<CircleDollarSign size={28} strokeWidth={2} />}
        />
        <MetricCard
          title="Total de Vendas"
          value={totalSales}
          icon={<Receipt size={28} strokeWidth={2} />}
        />
        <MetricCard
          title="Estoque Baixo"
          value={lowStock}
          icon={<Package size={28} strokeWidth={2} />}
          variant={lowStock > 0 ? 'warning' : ''}
        />
      </div>


      <div className={styles.charts}>
        <div className={styles.chartCard}>
          <h3>Vendas por dia</h3>
          {salesChartData.length > 0 ? (
            <div className={styles.chartArea}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesChartData} margin={{ top: 8, right: 14, left: 4, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />

                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={72}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    tickFormatter={(v) => formatCurrency(v)}
                  />

                  <Tooltip
                    labelFormatter={(label) => `Data: ${label}`}
                    formatter={(value, _name, props) => {
                      const total = Number(value) || 0
                      const qtd = salesChartData?.find((d) => d.date === props?.payload?.date)?.quantity
                      return [`${formatCurrency(total)} (${qtd ?? 0} itens)`, 'Faturamento']
                    }}
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#2563eb', strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 5, fill: '#1d4ed8', strokeWidth: 2, stroke: '#ffffff' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.empty}>Nenhuma venda registrada ainda.</div>
          )}

        </div>

        <div className={styles.chartCard}>
          <h3>Produtos mais vendidos</h3>
          {topProductsData.length > 0 ? (
            <div className={styles.chartArea}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} margin={{ top: 8, right: 14, left: 4, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />

                  <XAxis
                    dataKey="displayName"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={32}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    allowDecimals={false}
                  />

                  <Tooltip
                    shared={false}
                    labelFormatter={(_label, payload) => payload?.[0]?.payload?.name || 'Produto'}
                    formatter={(value, _name, props) => {
                      const quantity = Number(value) || 0
                      const faturamento = props?.payload?.revenue
                      return [`${quantity} itens - ${formatCurrency(faturamento)}`, 'Vendido']
                    }}
                    contentStyle={tooltipStyle}
                    labelStyle={tooltipLabelStyle}
                    itemStyle={tooltipItemStyle}
                    cursor={false}
                  />

                  <Bar
                    dataKey="quantity"
                    fill="#10b981"
                    stroke="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={46}
                  />

                </BarChart>


              </ResponsiveContainer>
            </div>
          ) : (
            <div className={styles.empty}>Nenhuma venda registrada ainda.</div>
          )}
        </div>
      </div>

      <div className={styles.salesDashboardCard}>
        <header className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Histórico Recente de Vendas</h3>
          <div className={styles.actionsGroup}>
            <div className={styles.moreActions}>
              <button
                className={styles.actionBtn}
                type="button"
                onClick={() => setShowMoreActions((value) => !value)}
              >
                <MoreHorizontal size={18} strokeWidth={1.7} aria-hidden="true" />
                Mais opções
              </button>
              {showMoreActions ? (
                <div className={styles.moreMenu}>
                  <button type="button" onClick={exportBackup}>
                    <Download size={16} strokeWidth={1.7} aria-hidden="true" />
                    Backup
                  </button>
                  <button type="button" onClick={exportCsv}>
                    <FileSpreadsheet size={16} strokeWidth={1.7} aria-hidden="true" />
                    Exportar CSV
                  </button>
                  <button type="button" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={16} strokeWidth={1.7} aria-hidden="true" />
                    Importar backup
                  </button>
                </div>
              ) : null}
            </div>
            <input
              ref={fileInputRef}
              className={styles.fileInput}
              type="file"
              accept="application/json,.json"
              onChange={handleBackupFile}
            />
          </div>
        </header>


        <div className={styles.tableHeader}>
          <span>Últimas Vendas</span>
          <span>Data</span>
          <span>Valor</span>
        </div>

        <div className={styles.salesListBody}>
          {sales.length === 0 ? (
            <div className={styles.salesEmpty}>Nenhuma venda ainda.</div>
          ) : (
            <>
              {recentSales.map((sale, index) => {
                const itemCount = sale.items.reduce((sum, item) => sum + item.quantity, 0)

                return (
                <div key={sale.id} className={styles.salesRow}>
                  <div className={styles.idColumn}>
                    <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" fill="#dcfce7"/>
                      <path d="M9 12l2 2 4-4" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Venda {String(index + 1).padStart(3, '0')} - {itemCount} item(s)
                  </div>
                  <div className={styles.dateColumn}>
                    {formatDate(sale.date)}
                  </div>
                  <div className={styles.valueColumn}>
                    {formatCurrency(sale.total)}
                  </div>
                </div>
                )
              })}
              {emptyRecentRows.map((_, index) => (
                <div key={`empty-recent-${index}`} className={styles.salesRowEmpty} aria-hidden="true" />
              ))}
            </>
          )}
        </div>
      </div>

      <Modal
        isOpen={Boolean(pendingBackup)}
        onClose={() => setPendingBackup(null)}
        title="Restaurar backup"
      >
        <div className={confirmDeleteStyles.body}>
          <p className={confirmDeleteStyles.message}>
            Restaurar este arquivo vai substituir os produtos e vendas atuais desta conta.
          </p>

          <div className={confirmDeleteStyles.actions}>
            <button
              type="button"
              className={confirmDeleteStyles.cancelBtn}
              onClick={() => setPendingBackup(null)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={confirmDeleteStyles.deleteBtn}
              onClick={confirmImportBackup}
            >
              Restaurar backup
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
