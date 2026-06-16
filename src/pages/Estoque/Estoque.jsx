import { useState } from 'react'
import Modal from '../../components/Modal/Modal'
import useData from '../../hooks/useData'
import { useToast } from '../../context/ToastContext'
import {
  Apple,
  ArrowDownAZ,
  Boxes,
  Edit3,
  History,
  MoreVertical,
  Plus,
  Search,
  ShoppingBag,
  Smartphone,
  Trash2,
} from 'lucide-react'

import { formatCurrency } from '../../utils/formatters'
import styles from './Estoque.module.scss'
import confirmDeleteStyles from './EstoqueConfirmDelete.module.scss'

function parseCurrencyInput(value) {
  const cents = value.replace(/\D/g, '')
  return (Number(cents || '0') / 100).toFixed(2)
}

function formatCurrencyInput(value) {
  return formatCurrency(Number(value || 0))
}

const CATEGORY_CONFIG = {

  'Alimentos & Bebidas': { className: styles.catDefault, icon: <Apple size={14} /> },
  'Eletrônicos & Informática': {
    className: styles.catEletronico,
    icon: <Smartphone size={14} />,
  },
  'Vestuário & Acessórios': { className: styles.catDefault, icon: <ShoppingBag size={14} /> },
  'Saúde & Beleza': { className: styles.catDefault, icon: <ShoppingBag size={14} /> },
  'Casa & Decoração': { className: styles.catDefault, icon: <ShoppingBag size={14} /> },
  'Limpeza & Higiene': { className: styles.catDefault, icon: <ShoppingBag size={14} /> },
  'Papelaria & Escritório': { className: styles.catDefault, icon: <ShoppingBag size={14} /> },
  'Ferramentas & Construção': { className: styles.catDefault, icon: <ShoppingBag size={14} /> },
  'Esporte & Lazer': { className: styles.catDefault, icon: <ShoppingBag size={14} /> },
  'Automotivo': { className: styles.catDefault, icon: <ShoppingBag size={14} /> },
  'Diversos': { className: styles.catDefault, icon: <ShoppingBag size={14} /> },
}

function normalizeCategoryKey(value) {
  return (value || '')
    .toString()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

const CATEGORY_CONFIG_NORMALIZED = Object.entries(CATEGORY_CONFIG).reduce(
  (acc, [key, config]) => {
    acc[normalizeCategoryKey(key)] = config
    return acc
  },
  {}
)

function getCategoryVisual(category) {
  if (!category) {
    return { className: styles.catDefault, icon: <ShoppingBag size={14} />, label: 'Sem categoria' }
  }

  const key = normalizeCategoryKey(category)
  if (!key) {
    return { className: styles.catDefault, icon: <ShoppingBag size={14} />, label: 'Sem categoria' }
  }

  const visual = CATEGORY_CONFIG_NORMALIZED[key]
  if (!visual) {
    return { className: styles.catDefault, icon: <ShoppingBag size={14} />, label: 'Sem categoria' }
  }

  return { ...visual, label: category }
}


export default function Estoque() {
  const { products, addProduct, updateProduct, deleteProduct, permissions } = useData()
  const { pushToast } = useToast()

  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState('inserted')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  const categoryOptions = [
    { label: 'Alimentos & Bebidas', icon: <Apple size={14} /> },
    {
      label: 'Eletrônicos & Informática',
      icon: <Smartphone size={14} />,
    },
    { label: 'Vestuário & Acessórios', icon: <ShoppingBag size={14} /> },
    { label: 'Saúde & Beleza', icon: <ShoppingBag size={14} /> },
    { label: 'Casa & Decoração', icon: <ShoppingBag size={14} /> },
    { label: 'Limpeza & Higiene', icon: <ShoppingBag size={14} /> },
    { label: 'Papelaria & Escritório', icon: <ShoppingBag size={14} /> },
    { label: 'Ferramentas & Construção', icon: <ShoppingBag size={14} /> },
    { label: 'Esporte & Lazer', icon: <ShoppingBag size={14} /> },
    { label: 'Automotivo', icon: <ShoppingBag size={14} /> },
    { label: 'Diversos', icon: <ShoppingBag size={14} /> },
  ]

  const selectableCategories = categoryOptions.map((c) => c.label)

  const [form, setForm] = useState({
    name: '',
    barcode: '',
    supplier: '',
    price: '',
    costPrice: '',
    discountMode: 'none',
    discountValue: '',
    quantity: '',
    category: '',
    newCategory: '',
    newCategorySelected: false,
  })

  const filtered = products
    .filter((p) => {
      const query = search.toLowerCase()
      return [p.name, p.barcode, p.supplier].join(' ').toLowerCase().includes(query)
    })
    .sort((a, b) => {
      if (sortMode !== 'alphabetical') return 0
      return (a.name || '').localeCompare(b.name || '', 'pt-BR', { sensitivity: 'base' })
    })

  function openModal(product = null) {
    if (product) {
      setEditingProduct(product)
      setForm({
        name: product.name ?? '',
        barcode: product.barcode ?? '',
        supplier: product.supplier ?? '',
        price: formatCurrencyInput(product.price ?? 0),
        costPrice: formatCurrencyInput(product.costPrice ?? 0),
        discountMode: product.discountMode ?? 'none',
        discountValue: product.discountMode === 'amount'
          ? formatCurrencyInput(product.discountValue ?? 0)
          : (product.discountValue ?? '').toString(),
        quantity: (product.quantity ?? '').toString(),
        // Garantir que o select seja preenchido com o mesmo formato salvo em `category`
        category: product.category ?? '',
        newCategory: '',
        newCategorySelected: false,
      })
    } else {
      setEditingProduct(null)
      setForm({
        name: '',
        barcode: '',
        supplier: '',
        price: '',
        costPrice: '',
        discountMode: 'none',
        discountValue: '',
        quantity: '',
        category: '',
        newCategory: '',
        newCategorySelected: false,
      })
    }
    setIsModalOpen(true)
  }


  function closeModal() {
    setIsModalOpen(false)
    setEditingProduct(null)
    setForm({
      name: '',
      barcode: '',
      supplier: '',
      price: '',
      costPrice: '',
      discountMode: 'none',
      discountValue: '',
      quantity: '',
      category: '',
      newCategory: '',
      newCategorySelected: false,
    })
  }

  function handleSubmit(e) {
    e.preventDefault()

    const chosenCategory =
      form.newCategorySelected
        ? form.newCategory.trim()
        : form.category.trim()

    const data = {
      name: form.name.trim(),
      barcode: form.barcode.trim(),
      supplier: form.supplier.trim(),
      price: Number(parseCurrencyInput(form.price)),
      costPrice: Number(parseCurrencyInput(form.costPrice)),
      discountMode: form.discountMode,
      discountValue: form.discountMode === 'amount'
        ? Number(parseCurrencyInput(form.discountValue))
        : Math.min(Math.max(Number(String(form.discountValue).replace(',', '.')) || 0, 0), 100),
      quantity: parseInt(form.quantity, 10),
      // Persistir exatamente o que foi selecionado; se estiver vazio, salva null
      category: chosenCategory ? chosenCategory : null,
    }





    if (!data.name) {
      pushToast({
        type: 'danger',
        title: 'Nome inválido',
        message: 'Informe o nome do produto para continuar.',
      })
      return
    }

    if (!Number.isFinite(data.price) || data.price < 0) {
      pushToast({
        type: 'danger',
        title: 'Preço inválido',
        message: 'Informe um preço válido (maior ou igual a 0).',
      })
      return
    }

    if (!Number.isFinite(data.costPrice) || data.costPrice < 0) {
      pushToast({
        type: 'danger',
        title: 'Custo inválido',
        message: 'Informe um preço de custo válido (maior ou igual a 0).',
      })
      return
    }

    if (!Number.isFinite(data.quantity) || data.quantity < 0) {
      pushToast({
        type: 'danger',
        title: 'Quantidade inválida',
        message: 'Informe uma quantidade válida (maior ou igual a 0).',
      })
      return
    }

    if (data.discountMode === 'amount' && data.discountValue > data.price) {
      pushToast({
        type: 'danger',
        title: 'Desconto inválido',
        message: 'O desconto em reais não pode ser maior que o preço de venda.',
      })
      return
    }

    if (editingProduct) {
      const estoqueMaximoAtual =
        Number(editingProduct.estoqueMaximo) || Number(editingProduct.quantity) || data.quantity

      const estoqueMaximoNovo = data.quantity > estoqueMaximoAtual ? data.quantity : estoqueMaximoAtual

      const payload = {
        ...data,
        estoqueMaximo: estoqueMaximoNovo,
      }

      updateProduct(editingProduct.id, payload)
      pushToast({
        type: 'success',
        title: 'Produto atualizado',
        message: `O produto “${data.name}” foi atualizado com sucesso.`,
      })
    } else {
      const payload = {
        ...data,
        estoqueMaximo: data.quantity,
      }

      addProduct(payload)
      pushToast({
        type: 'success',
        title: 'Produto cadastrado',
        message: `O produto “${data.name}” foi cadastrado com sucesso.`,
      })
    }


    closeModal()
  }


  const [isReporModalOpen, setIsReporModalOpen] = useState(false)
  const [reporProduct, setReporProduct] = useState(null)
  const [reporValue, setReporValue] = useState('')

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteProductTarget, setDeleteProductTarget] = useState(null)

  function openReporModal(id) {
    const product = products.find((p) => p.id === id)
    if (!product) return
    setReporProduct(product)
    setReporValue('')
    setIsReporModalOpen(true)
  }

  function closeReporModal() {
    setIsReporModalOpen(false)
    setReporProduct(null)
    setReporValue('')
  }

  function submitRepor(e) {
    e.preventDefault()
    if (!reporProduct) return

    const adicionar = parseInt(reporValue, 10)
    if (!Number.isFinite(adicionar) || adicionar <= 0) {
      pushToast({
        type: 'danger',
        title: 'Quantidade inválida',
        message: 'Informe um número inteiro maior que 0.',
      })
      return
    }

    const quantidadeAtual = Number(reporProduct.quantity) || 0
    const novaQuantidade = quantidadeAtual + adicionar

    const payload = {
      ...reporProduct,
      quantity: novaQuantidade,
      estoqueMaximo: novaQuantidade,
    }

    updateProduct(reporProduct.id, payload)
    pushToast({
      type: 'success',
      title: 'Estoque reposto',
      message: `O estoque de “${reporProduct.name}” foi reposto com sucesso.`,
    })
    closeReporModal()
  }

  function openDeleteModal(id) {
    const product = products.find((p) => p.id === id)
    if (!product) return
    setDeleteProductTarget(product)
    setIsDeleteModalOpen(true)
  }

  function closeDeleteModal() {
    setIsDeleteModalOpen(false)
    setDeleteProductTarget(null)
  }

  function confirmDelete() {
    if (!deleteProductTarget) return

    const result = deleteProduct(deleteProductTarget.id)
    if (!result.success) {
      pushToast({
        type: 'danger',
        title: 'Produto não excluído',
        message: result.message,
      })
      return
    }
    pushToast({
      type: 'success',
      title: 'Produto excluído',
      message: deleteProductTarget?.name
        ? `O produto “${deleteProductTarget.name}” foi excluído com sucesso.`
        : 'Produto excluído com sucesso.',
    })

    closeDeleteModal()
  }



  return (
    <div className={styles.estoque}>
      <div className={styles.header}>
        <div className={styles.topActions}>
          <div className={styles.leftActions}>
            <div className={styles.searchWrap}>
              <Search size={18} strokeWidth={1.6} aria-hidden="true" />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles.search}
              />
            </div>
            <div className={styles.sortControls} aria-label="Ordenar produtos">
              <button
                type="button"
                className={sortMode === 'alphabetical' ? styles.sortActive : styles.sortBtn}
                onClick={() => setSortMode('alphabetical')}
                title="Ordenar em ordem alfabética"
              >
                <ArrowDownAZ size={16} strokeWidth={1.8} aria-hidden="true" />
                <span>Alfabética</span>
              </button>
              <button
                type="button"
                className={sortMode === 'inserted' ? styles.sortActive : styles.sortBtn}
                onClick={() => setSortMode('inserted')}
                title="Ordenar por ordem de inserção"
              >
                <History size={16} strokeWidth={1.8} aria-hidden="true" />
                <span>Inserção</span>
              </button>
            </div>
          </div>

          {!permissions.canManageSensitive ? (
            <div className={styles.rightActions}>
              <button className={styles.addBtn} onClick={() => openModal()}>
                <Plus size={18} strokeWidth={2} aria-hidden="true" />
                <span className={styles.addText}>Novo Produto</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className={styles.grid}>
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            {search
              ? 'Nenhum produto encontrado.'
              : 'Nenhum produto cadastrado. Clique em "+ Novo Produto" para começar.'}
          </div>
        ) : (
          filtered.map((product) => {
            const visual = getCategoryVisual(product.category)

            const qty = Number(product.quantity) || 0
            const estoqueMaximo = Number(product.estoqueMaximo) || qty || 0

            const pctRaw = estoqueMaximo > 0 ? (qty / estoqueMaximo) * 100 : 0
            const pct = Math.max(0, Math.min(100, pctRaw))

            const progressVariant =
              pct > 50 ? styles.progressGood : pct >= 20 ? styles.progressMid : styles.progressLow


            return (
              <div key={product.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.info}>
                    <h3>{product.name}</h3>
                    <span className={`${styles.category} ${visual.className}`}>
                      {visual.icon}
                      <span className={styles.catText}>
                        {product.category ? product.category : visual.label}
                      </span>
                    </span>
                  </div>

                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.optionsBtn}
                    aria-label="Opções"
                    title="Opções"
                    onClick={(e) => {
                      e.stopPropagation()
                      e.currentTarget.classList.toggle(styles.open)
                    }}
                  >
                    <MoreVertical size={18} strokeWidth={1.8} aria-hidden="true" />
                  </button>

                  <div className={styles.dropdownMenu}>
                    <ul className={styles.dropdownList}>
                      <li>
                        <button
                          type="button"
                          className={styles.dropdownItem}
                          onClick={() => openModal(product)}
                        >
                          <Edit3 size={16} strokeWidth={1.6} aria-hidden="true" />
                          Editar
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className={styles.dropdownItem}
                          onClick={() => openReporModal(product.id)}

                        >
                          <Boxes size={16} strokeWidth={1.6} aria-hidden="true" />
                          Repor Estoque
                        </button>
                      </li>
                      <li>
                        <button
                          type="button"
                          className={styles.dropdownItem}
                          onClick={() => openDeleteModal(product.id)}

                        >
                          <Trash2 size={16} strokeWidth={1.6} aria-hidden="true" />
                          Excluir
                        </button>
                      </li>

                    </ul>
                  </div>
                </div>
                </div>

                <div className={styles.meta}>
                  <div className={styles.priceRow}>
                    <span className={styles.price}>{formatCurrency(product.price)}</span>
                    <span className={styles.costPrice}>Custo {formatCurrency(product.costPrice)}</span>
                    <span className={styles.discountBadge}>
                      {product.discountMode && product.discountMode !== 'none' && Number(product.discountValue) > 0
                        ? `Desc. ${product.discountMode === 'percent' ? `${product.discountValue}%` : formatCurrency(product.discountValue)}`
                        : 'Sem desconto'}
                    </span>
                    <span className={styles.costPrice}>Fornecedor {product.supplier || 'desconhecido'}</span>
                    <span className={`${styles.stock} ${product.quantity <= 5 ? styles.low : ''}`}>
                      {product.quantity <= 5 ? `Estoque Baixo! ${product.quantity} em estoque` : `${product.quantity} em estoque`}
                    </span>
                  </div>

                  <div className={styles.progress} aria-hidden="true">
                    <div
                      className={`${styles.progressFill} ${progressVariant}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingProduct ? 'Editar Produto' : 'Novo Produto'}
        size="wide"
      >
        <form onSubmit={handleSubmit} className={styles.productForm}>
          <section className={styles.formPanel}>
            <h4>Dados do produto</h4>

            <div className={styles.field}>
              <label>Nome</label>
              <input
                className={styles.formControl}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>Código de barras</label>
                <input
                  className={styles.formControl}
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  placeholder="Opcional"
                />
              </div>

              <div className={styles.field}>
                <label>Fornecedor</label>
                <input
                  className={styles.formControl}
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>Preço de venda (R$)</label>
                <input
                  className={styles.formControl}
                  type="text"
                  value={form.price}
                  inputMode="numeric"
                  onChange={(e) => setForm({ ...form, price: formatCurrencyInput(parseCurrencyInput(e.target.value)) })}
                  required
                />
              </div>

              <div className={styles.field}>
                <label>Preço de custo (R$)</label>
                <input
                  className={styles.formControl}
                  type="text"
                  value={form.costPrice}
                  inputMode="numeric"
                  onChange={(e) => setForm({ ...form, costPrice: formatCurrencyInput(parseCurrencyInput(e.target.value)) })}
                  required
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label>Quantidade</label>
                <input
                  className={styles.formControl}
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                />
              </div>

              <div className={styles.field}>
                <label>Categoria</label>
                <select
                  className={styles.formControl}
                  value={form.category}
                  onChange={(e) => {
                    const v = e.target.value
                    setForm((prev) => ({ ...prev, category: v }))
                  }}
                  required
                >
                  <option value="" disabled>
                    Selecione a categoria
                  </option>
                  {selectableCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.discountRow}>
              <div className={styles.field}>
                <label>Desconto padrão</label>
                <select
                  className={styles.formControl}
                  value={form.discountMode}
                  onChange={(e) => setForm({ ...form, discountMode: e.target.value, discountValue: '' })}
                >
                  <option value="none">Sem desconto</option>
                  <option value="amount">Valor em R$</option>
                  <option value="percent">Porcentagem</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>Valor do desconto</label>
                <input
                  className={styles.formControl}
                  type="text"
                  inputMode="numeric"
                  value={form.discountValue}
                  disabled={form.discountMode === 'none'}
                  placeholder={form.discountMode === 'percent' ? 'Ex.: 10' : 'R$ 0,00'}
                  onChange={(e) => {
                    const value = e.target.value
                    setForm({
                      ...form,
                      discountValue: form.discountMode === 'amount'
                        ? formatCurrencyInput(parseCurrencyInput(value))
                        : value.replace(/[^\d,.]/g, ''),
                    })
                  }}
                />
              </div>
            </div>

            <button type="submit" className={styles.submit}>
              {editingProduct ? 'Salvar alterações' : 'Cadastrar produto'}
            </button>
          </section>

          <aside className={styles.previewPanel}>
            <h4>Prévia</h4>
            <div className={styles.previewCard}>
              <span className={styles.previewName}>{form.name || 'Nome do produto'}</span>
              <span className={styles.previewCategory}>{form.category || 'Categoria'}</span>
              <span className={styles.previewMeta}>{form.barcode || 'Sem código'} · {form.supplier || 'Sem fornecedor'}</span>

              <div className={styles.previewNumbers}>
                <div>
                  <span>Venda</span>
                  <strong>{form.price || formatCurrency(0)}</strong>
                </div>
                <div>
                  <span>Custo</span>
                  <strong>{form.costPrice || formatCurrency(0)}</strong>
                </div>
                <div>
                  <span>Estoque</span>
                  <strong>{form.quantity || 0}</strong>
                </div>
                <div>
                  <span>Desconto</span>
                  <strong>
                    {form.discountMode === 'none'
                      ? 'Nenhum'
                      : form.discountMode === 'percent'
                        ? `${form.discountValue || 0}%`
                        : form.discountValue || formatCurrency(0)}
                  </strong>
                </div>
              </div>

              <div className={styles.previewProgress} aria-hidden="true">
                <span />
              </div>
            </div>

            <div className={styles.previewNote}>
              O preço de custo alimenta lucro e margem no fechamento. A quantidade inicial define a referência da linha colorida do estoque.
            </div>
          </aside>
        </form>
      </Modal>

      <Modal
        isOpen={isReporModalOpen}
        onClose={closeReporModal}
        title="Repor Estoque"
      >
        <form onSubmit={submitRepor} className={styles.form}>
          <div className={styles.field}>
            <label>
              Quantos itens deseja adicionar{reporProduct?.name ? ` para ${reporProduct.name}` : ''}?
            </label>
            <input
              className={styles.formControl}
              type="number"
              min="1"
              step="1"
              value={reporValue}
              onChange={(e) => setReporValue(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.submit}>
            Confirmar reposição
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={closeDeleteModal}
        title="Confirmar Exclusão"
      >
        <div className={confirmDeleteStyles.body}>
          <p className={confirmDeleteStyles.message}>
            Tem certeza que deseja excluir este produto?
          </p>
          {!permissions.canManageSensitive ? (
            <p className={confirmDeleteStyles.message}>
              Seu perfil não tem permissão para excluir produtos.
            </p>
          ) : null}

          <div className={confirmDeleteStyles.actions}>
            <button
              type="button"
              className={confirmDeleteStyles.cancelBtn}
              onClick={closeDeleteModal}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={confirmDeleteStyles.deleteBtn}
              onClick={confirmDelete}
              disabled={!permissions.canManageSensitive}
            >
              Excluir
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}
