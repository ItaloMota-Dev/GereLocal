function escapeCsv(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replace(/"/g, '""')}"`
}

function toCsv(rows) {
  return rows.map((row) => row.map(escapeCsv).join(',')).join('\n')
}

export function buildProductsCsv(products) {
  return toCsv([
    ['ID', 'Nome', 'Codigo de barras', 'Fornecedor', 'Categoria', 'Preco', 'Preco de custo', 'Desconto padrao', 'Valor desconto', 'Quantidade', 'Estoque maximo'],
    ...products.map((product) => [
      product.id,
      product.name,
      product.barcode || '',
      product.supplier || '',
      product.category || 'Sem categoria',
      Number(product.price) || 0,
      Number(product.costPrice) || 0,
      product.discountMode || 'none',
      Number(product.discountValue) || 0,
      Number(product.quantity) || 0,
      Number(product.estoqueMaximo) || Number(product.quantity) || 0,
    ]),
  ])
}

export function buildSalesCsv(sales) {
  return toCsv([
    [
      'ID da venda',
      'Data',
      'Cliente',
      'Forma de pagamento',
      'Valor recebido',
      'Troco',
      'Desconto',
      'Desconto automatico',
      'Desconto extra',
      'Tipo de desconto',
      'Valor informado do desconto',
      'Subtotal da venda',
      'Observacao',
      'Produto',
      'Quantidade',
      'Preco unitario',
      'Preco de custo',
      'Desconto do item',
      'Total do item',
      'Lucro bruto do item',
      'Total da venda',
    ],
    ...sales.flatMap((sale) =>
      sale.items.map((item) => [
        sale.id,
        sale.date,
        sale.customerName || '',
        sale.paymentMethod || 'Não informado',
        Number(sale.cashReceived) || 0,
        Number(sale.cashChange) || 0,
        Number(sale.discount) || 0,
        Number(sale.productDiscountTotal) || 0,
        Number(sale.manualDiscount) || 0,
        sale.discountMode || 'amount',
        Number(sale.discountValue) || Number(sale.discount) || 0,
        Number(sale.subtotal) || Number(sale.total) || 0,
        sale.note || '',
        item.name,
        Number(item.quantity) || 0,
        Number(item.price) || 0,
        Number(item.costPrice) || 0,
        Number(item.productDiscount) || 0,
        (Number(item.price) || 0) * (Number(item.quantity) || 0),
        ((Number(item.price) || 0) - (Number(item.costPrice) || 0)) * (Number(item.quantity) || 0),
        Number(sale.total) || 0,
      ])
    ),
  ])
}

export function downloadTextFile({ content, filename, type = 'text/plain;charset=utf-8' }) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
