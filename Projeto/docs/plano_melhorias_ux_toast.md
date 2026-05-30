# Plano de melhorias (UX/UI + Toast + ícones)

## Status em 2026-05-28

Este documento virou historico. O problema principal do Toast foi resolvido:
existem chamadas reais a `pushToast(...)` em fluxos de estoque, vendas, backup e
importacao. Algumas ideias de UX ainda podem evoluir, mas a afirmacao antiga de
que "nao existe nenhuma chamada a `pushToast(...)` em `src/`" nao e mais valida.

## 1) Problema original: Toast não aparecia
- O app renderiza `ToastProvider` e `ToastsViewport`.
- Na epoca desta analise, nao existia chamada suficiente a `pushToast(...)`.
- Status atual: ha feedback em acoes reais do app.

## 2) Objetivo imediato do Toast (corrigir primeiro)
### O que vou implementar
- Adicionar `useToast()` nas páginas onde já existe ação de negócio:
  - **Estoque (`src/pages/Estoque/Estoque.jsx`)**
    - ao cadastrar produto: toast de sucesso
    - ao editar produto: toast de sucesso
    - ao excluir produto: toast de sucesso (ou erro)
  - **Vendas (`src/pages/Vendas/Vendas.jsx`)**
    - ao finalizar venda: toast de sucesso
    - ao excluir venda: toast de confirmação/feedback (sucesso)
  - **Login (`src/pages/Login/Login.jsx`)** e **Cadastro (`src/pages/Cadastro/Cadastro.jsx`)**
    - ao falhar login/cadastro: toast de erro (ou informação)
    - ao obter sucesso: toast opcional de sucesso (e navegação)

### Como o Toast vai se comportar
- Posição fixa: canto superior direito.
- Cores por intenção (success/danger/warning/info) com alto contraste.
- Barra de progresso inferior animada (esquerda → direita) até sumir.

## 3) Padronização de ícones (lucide-react)
### Padrão definido a partir da Sidebar
- `size={20}`
- `strokeWidth={1.5}`

### O que vou aplicar
- Substituir ícones inconsistentes/emojis por `lucide-react` nas páginas:
  - **Dashboard**
  - **Estoque**
  - **Vendas**
- Garantir consistência visual (tamanho/espessura/estilo) em botões, cards e modais.

## 4) Melhorias de UX/UI para público idoso (microempreendedores)
### Áreas de clique
- Garantir que botões e alvos clicáveis fiquem com **min-height 44px** (ou 48px) nos componentes/SCSS que ainda não atendem.

### Empty states
- Quando **não houver produtos** no Estoque (ou resultado de busca vazio): exibir um estado vazio com:
  - ícone amigável
  - texto grande e claro
  - instrução: “Clique em ‘Novo Produto’ para começar!”
- Quando **não houver vendas**: estado vazio igualmente amigável.

### Feedback visual claro (disabled/cursor)
- No carrinho de vendas:
  - quando item chega a 0 no estoque, deixar o botão claramente disabled, com cursor adequado e estilo mais “opaco/visível”.

## 5) Entregáveis (o que você vai ver no projeto)
- Toast disparando de fato (aparecendo na tela) ao executar ações reais.
- Ícones padronizados via `lucide-react` no Dashboard/Estoque/Vendas.
- Empty states mais claros.
- Disabled states mais óbvios no carrinho/estoque.

## 6) Arquivos que provavelmente serão editados
- `src/pages/Estoque/Estoque.jsx`
- `src/pages/Vendas/Vendas.jsx`
- `src/pages/Login/Login.jsx`
- `src/pages/Cadastro/Cadastro.jsx`
- `src/pages/*/*.module.scss` (Dashboard/Estoque/Vendas/Login/Cadastro conforme necessidade)
- (possivelmente) `src/components/MetricCard/*` e `src/components/Modal/*` se houver ícones/botões a padronizar

## 7) Status do proximo passo
- Implementado nos fluxos principais. Melhorias futuras devem focar em textos,
  consistencia visual e acessibilidade, nao em "fazer o Toast aparecer".
