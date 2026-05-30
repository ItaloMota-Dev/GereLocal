import {
  BarChart3,
  CircleEllipsis,
  ClipboardList,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Zap,
} from 'lucide-react'
import useAuth from '../../hooks/useAuth'
import styles from './Ajuda.module.scss'

const sections = [
  {
    title: 'Dashboard',
    Icon: LayoutDashboard,
    blocks: [
      {
        heading: 'Vendas por dia',
        text: 'O gráfico mostra quanto entrou em cada dia. Cada ponto representa o faturamento daquele dia, e ao passar o mouse você vê o valor e a quantidade de itens vendidos.',
      },
      {
        heading: 'Produtos mais vendidos',
        text: 'Este gráfico ajuda a identificar quais produtos saem mais. As barras maiores indicam maior quantidade vendida, então fica mais fácil decidir o que repor primeiro.',
      },
      {
        heading: 'Histórico recente',
        text: 'A lista exibe apenas as últimas 7 vendas para consulta rápida. Os detalhes completos de produtos vendidos ficam na tela de Vendas.',
      },
      {
        heading: 'Atalhos',
        text: 'Registrar Venda leva direto para a criação de uma venda. Cadastrar Produto abre o estoque. Mais opções permite gerar backup, exportar CSV e importar backup.',
      },
    ],
  },
  {
    title: 'Botões de ação',
    Icon: CircleEllipsis,
    blocks: [
      {
        heading: 'Botão de 3 pontos',
        text: 'O botão com três pontos abre ações extras daquele item. Ele aparece quando existem opções que não precisam ficar sempre ocupando espaço na tela.',
      },
      {
        heading: 'Editar',
        text: 'Abre o cadastro com os dados já preenchidos para corrigir nome, preço, quantidade ou categoria.',
      },
      {
        heading: 'Repor Estoque',
        text: 'Adiciona novas unidades ao produto selecionado e atualiza o limite usado pela linha colorida do card.',
      },
      {
        heading: 'Excluir',
        text: 'Remove o produto ou a venda depois de uma confirmação. Ao excluir uma venda, o estoque dos itens vendidos é restaurado.',
      },
    ],
  },
  {
    title: 'Estoque',
    Icon: Package,
    blocks: [
      {
        heading: 'Criar produto',
        text: 'Abra Estoque, clique em Novo Produto e preencha nome, preço de venda, preço de custo, quantidade e categoria. O preço de custo permite calcular lucro e margem no fechamento.',
      },
      {
        heading: 'Linha colorida',
        text: 'A linha do card mostra o nível atual do estoque em relação ao maior estoque registrado para aquele produto. Verde indica estoque confortável, amarelo indica atenção e vermelho indica estoque baixo.',
      },
      {
        heading: 'Busca e ordenação',
        text: 'Use Buscar produto para localizar pelo nome. Os botões Alfabética e Inserção reorganizam a lista rapidamente por nome ou pela ordem em que os produtos foram cadastrados.',
      },
      {
        heading: 'Atalhos de estoque',
        text: 'Use Repor Estoque quando chegaram novas unidades. Use Editar para corrigir dados do produto. Use Excluir apenas quando o item não deve mais aparecer na loja.',
      },
    ],
  },
  {
    title: 'Vendas',
    Icon: ShoppingCart,
    blocks: [
      {
        heading: 'Registrar venda',
        text: 'Clique em Nova Venda, selecione os produtos, ajuste as quantidades no carrinho, escolha a forma de pagamento, aplique desconto em reais ou porcentagem, escreva uma observação se precisar e finalize.',
      },
      {
        heading: 'Tabela de vendas',
        text: 'A tabela mostra ID, data, produtos vendidos, forma de pagamento, desconto quando houver e total. Ao cancelar uma venda, informe o motivo para aparecer no fechamento.',
      },
      {
        heading: 'Filtros',
        text: 'A busca encontra vendas pelo ID ou nome do produto. Os campos de data limitam o período. Os valores mínimo e máximo ajudam a localizar vendas por faixa de preço.',
      },
      {
        heading: 'Filtros rápidos',
        text: 'Hoje, Esta Semana e Este Mês preenchem as datas automaticamente para acelerar consultas comuns.',
      },
    ],
  },
  {
    title: 'Fechamento',
    Icon: ClipboardList,
    blocks: [
      {
        heading: 'Resumo do dia',
        text: 'No topo ficam os números principais: total líquido que entrou, bruto vendido, descontos, vendas, itens, ticket médio, maior venda, lucro estimado, margem e saldo em caixa.',
      },
      {
        heading: 'Formas de pagamento',
        text: 'Esta seção divide o total do dia por Pix, dinheiro, cartão ou outro meio informado na venda. Assim fica mais fácil conferir o caixa e os recebimentos digitais.',
      },
      {
        heading: 'Sangrias, reforços e cancelamentos',
        text: 'Registre reforços quando entra dinheiro extra no caixa e sangrias quando dinheiro é retirado. Cancelamentos, estoque baixo e observações aparecem em áreas próprias do relatório.',
      },
      {
        heading: 'Produtos vendidos',
        text: 'A lista agrupa tudo que foi vendido hoje, mostrando produto, quantidade total e valor gerado por cada item.',
      },
      {
        heading: 'Vendas do dia',
        text: 'Esta área mostra cada venda com horário, produtos vendidos e total. Use para conferir o movimento antes de imprimir o relatório.',
      },
      {
        heading: 'Como interpretar',
        text: 'Compare ticket médio, itens vendidos e produtos mais vendidos para entender se o dia teve muitas vendas pequenas ou poucas vendas de maior valor.',
      },
    ],
  },
]

export default function Ajuda() {
  const { user } = useAuth()
  const visibleSections = user?.role === 'attendant'
    ? sections.filter((section) => section.title !== 'Dashboard')
    : sections

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>Manual GereLocal</span>
          <h2>Como usar o sistema</h2>
        </div>
        <div className={styles.headerIcon}>
          <Zap size={24} strokeWidth={1.8} aria-hidden="true" />
        </div>
      </header>

      <div className={styles.manualGrid}>
        {visibleSections.map((section) => (
          <section key={section.title} className={styles.card}>
            <div className={styles.cardTitle}>
              <span className={styles.icon}>
                <section.Icon size={24} strokeWidth={1.8} aria-hidden="true" />
              </span>
              <h3>{section.title}</h3>
            </div>

            <div className={styles.blocks}>
              {section.blocks.map((block) => (
                <article key={block.heading} className={styles.block}>
                  <div className={styles.blockHeading}>
                    <BarChart3 size={16} strokeWidth={1.8} aria-hidden="true" />
                    <h4>{block.heading}</h4>
                  </div>
                  <p>{block.text}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
