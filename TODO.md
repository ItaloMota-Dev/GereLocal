# TODO - Estado atual do GereLocal

Atualizado em 2026-05-28.

## Concluido nesta rodada

- [x] Corrigir paginacao e overflow da listagem de vendas.
- [x] Garantir `itemsPerPage` e renderizar somente os itens da pagina atual.
- [x] Garantir que `currentPage` respeite `totalPages` apos filtros e exclusoes.
- [x] Atualizar botoes de paginacao com `disabled` correto.
- [x] Substituir `confirm()` de exclusao de venda por modal.
- [x] Adicionar busca e filtros por periodo em Vendas.
- [x] Adicionar filtro por valor minimo e maximo em Vendas.
- [x] Isolar produtos e vendas por usuario logado.
- [x] Validar estoque dentro do `DataContext` antes de registrar venda.
- [x] Normalizar email no cadastro/login.
- [x] Centralizar formatacao de moeda e data.
- [x] Exportar backup JSON.
- [x] Importar backup JSON com validacao antes de restaurar.
- [x] Exportar produtos e vendas em CSV.
- [x] Rodar `npm run lint`.
- [x] Rodar `npm run build`.

## Pendencias reais

- [ ] Refatorar `src/pages/Estoque/Estoque.jsx` em componentes menores.
- [ ] Melhorar categorias: icones/cores mais distintos e categoria personalizada de forma simples.
- [ ] Adicionar testes automatizados para:
  - venda baixa estoque;
  - exclusao de venda restaura estoque;
  - backup importa/exporta dados validos;
  - usuarios diferentes nao compartilham produtos/vendas.
- [ ] Otimizar bundle com carregamento sob demanda de rotas/graficos.
- [ ] Preparar persistencia real fora do `localStorage` se o produto for para producao.
- [ ] Trocar autenticacao local por backend/servico de auth antes de uso real com clientes.

## Observacao

O projeto esta funcional para uso local/prototipo. O que falta agora nao impede testar o fluxo principal, mas importa para manutencao, performance e uso em producao.
