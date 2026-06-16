# Análise: overflow-x ao expandir navbar/sidebar

## Status em 2026-05-28

Documento mantido como historico da analise de layout. O foco recente foi
estoque, vendas, backup e exportacao. Caso o problema de sidebar/overflow volte
a aparecer, este arquivo continua sendo a referencia tecnica para investigar.

## Sintoma
Ao expandir a navbar/sidebar, o layout “empurra” o conteúdo e aparece **overflow-x horizontal** (a página ultrapassa a largura do viewport). O objetivo é: **não ter overflow-x para a página inteira**.

---

## Arquitetura atual
### Componentes
- `src/components/Layout/Layout.jsx`
- `src/components/Layout/Layout.module.scss`
- `src/components/Sidebar/Sidebar.jsx`
- `src/components/Sidebar/Sidebar.module.scss`

### Estrutura do Layout
`Layout.jsx` renderiza:
- container `.layout` com `display: flex`
- `.sidebar` (aside) que contém o componente `Sidebar`
- `.main` que contém o `<Outlet />`

---

## O que o CSS está fazendo
### `.layout`
```css
.layout {
  position: relative;
  display: flex;
  height: 100vh;
}
```

Ou seja: no desktop, a sidebar e o main participam do fluxo do **flex layout**.

### Sidebar (mudança de largura real)
`Sidebar.module.scss` define:
- sidebar padrão: `width: 72px`
- sidebar expandida: `width: 260px`

Isso implica que o **espaço real ocupado** pela sidebar muda.

### Main (empurrão via transform)
Em `Layout.module.scss`:
```css
.layout.expanded .main {
  transform: translateX(188px);
}
```

Ou seja: além de o flex já alocar espaço com a sidebar maior, o código desloca o conteúdo visualmente com `transform` para a direita.

---

## Causa raiz (provável) — overflow-x
A combinação de:
1. **Sidebar altera largura real no fluxo do flex** (`width` muda)
2. **Main era deslocado por `transform: translateX(...)`**

tende a causar **desalinhamento entre “alocação real” e “desenho visual”** durante a transição.

### Por que isso gera overflow-x?
- `transform` não altera o layout (flow). Ele só move o elemento no desenho.
- Enquanto o flex já está acomodando o aumento da sidebar, o `.main` também era desenhado com deslocamento extra.
- Durante a animação/atualização (transition de `width` + aplicação de `transform`), o conjunto pode ultrapassar a largura total do viewport.
- Como a sidebar usa `overflow: visible`, elementos internos podem “vazar” e contribuir para overflow horizontal.

---

## Mudança aplicada (importante para o novo sintoma)
Para eliminar o overflow-x, removemos o empurrão extra no `Layout.module.scss` (deixamos `transform` em `0` no `.layout.expanded .main`) e desativamos `transition` do `transform` na `.main`.

---

## Novo sintoma: sensação de “travada”/sem fluidez
Apesar de eliminar o overflow-x, pode ocorrer perda de fluidez por dois motivos prováveis:

### 1) A transição do “empurrão” deixou de existir
Ao remover `transform` do `.main`, o deslocamento deixa de ser animado (porque `transform` era o mecanismo visual de animação). Agora o “empurrão” depende apenas do **reflow natural** do flex quando a sidebar muda `width`.

- Isso pode parecer menos suave, especialmente porque o sidebar está animando `width` (layout) e não uma propriedade “barata” de GPU.

### 2) Animar `width` em vez de uma transformação pode degradar performance
`Sidebar.module.scss` faz `transition: width 0.35s ...`.
- Animar `width` força recálculo/layout (reflow) e pode ficar “travado” em páginas com conteúdo pesado.

---

## Conclusão atual (dupla)
- **Overflow-x**: foi causado principalmente pela duplicação “flex (sidebar) + transform (main)”.
- **Travamento/baixa fluidez**: agora o deslocamento ocorre apenas pelo reflow gerado pela animação de `width` na sidebar (e não por uma animação via `transform` no main).

---

## Próxima direção (para recuperar fluidez sem voltar overflow)
Em vez de animar só `width`/`transform` juntos, a abordagem ideal é:
- manter layout sem “transform-empurrando” o main (para não reintroduzir overflow),
- e animar a sidebar com uma técnica que minimize reflow (ex.: trocar de `width` animado para `max-width` com cuidado, ou usar um contêiner e animar via `transform` apenas internamente, garantindo que o documento não ultrapasse o viewport).


---

## Arquivos envolvidos
- `src/components/Layout/Layout.module.scss`
- `src/components/Layout/Layout.jsx`
- `src/components/Sidebar/Sidebar.module.scss`
- `src/components/Sidebar/Sidebar.jsx`
