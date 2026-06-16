# Análise profunda: Navbar/Sidebar bugada ao passar o mouse (expandir)

## Status em 2026-05-28

Documento mantido como historico. A sidebar atual e controlada por botao de menu
no `Layout`, nao pelo fluxo antigo de `onMouseEnter/onMouseLeave` descrito aqui.
Se a expansao voltar a apresentar instabilidade, revalidar este diagnostico
contra o codigo atual antes de aplicar qualquer correcao.

> Contexto: A sidebar deveria expandir ao passar o mouse (`onMouseEnter`) e voltar ao sair (`onMouseLeave`). Porém, ao “tocar” (provavelmente: clicar/encostar/arrastar no trackpad/mouse) ela fica “muito bugada”.

---

## 1) O que o código atual faz (comportamento pretendido)

### `Sidebar.jsx`
Local: `src/components/Sidebar/Sidebar.jsx`
- Renderiza um `<aside>` com as classes:
  - `styles.sidebar`
  - `expanded ? styles.expanded : ''`
- Eventos:
  - `onMouseEnter={() => onHoverChange(true)}`
  - `onMouseLeave={() => onHoverChange(false)}`

Ou seja: **a expansão é 100% dirigida por hover do cursor**.

### `Layout.jsx`
Local: `src/components/Layout/Layout.jsx`
- Controla o estado:
  - `const [expanded, setExpanded] = useState(false)`
- Passa para a sidebar:
  - `<Sidebar expanded={expanded} onHoverChange={setExpanded} />`
- A classe `expanded` no container impacta:
  - o `main` (margem)
  - o `topLeftSquare` (logos)
  - e (possivelmente) o layout geral.

**Conclusão do fluxo:** qualquer alteração de hover que fique “alternando rapidamente” vai alternar `expanded` e portanto causar re-layout e animações repetindo.

---

## 2) Onde o bug pode estar acontecendo de verdade (pontos encontrados)

### 2.1) A animação da sidebar usa `transform` (bom) mas o container usa `absolute`/`margin` (pode criar “thrash”)

#### `Sidebar.module.scss`
- `.sidebar`:
  - `position: relative;`
  - `transition: transform 0.35s ...;`
  - **`will-change: transform;`**
- `.sidebar.expanded`:
  - `transform: translateX(188px);`
- Em mobile (`width <= 768px`):
  - `.sidebar.expanded { transform: none; }`

#### `Layout.module.scss`
- `.sidebar` (wrapper do aside):
  - `position: absolute; top: 72px; left: 0; width: 72px;`
- `.main`:
  - por padrão `margin-left: 72px`
- `.layout.expanded .main`:
  - `margin-left: 260px`

**Risco:** quando o hover “oscila” (entrou/saiu rapidamente), `expanded` alterna e **a `.main` troca margem**. Mesmo que o container da sidebar use `transform`, **o resto da página muda de largura** e isso pode causar:
- “saltos” visuais
- reposicionamento que faz o mouse voltar a “sair” da área hover
- loop de flicker (expandir → mudar layout → mouse sai → recolhe → mouse reentra ...)

Esse padrão é muito comum quando o hover depende da geometria do elemento que está animando.

---

### 2.2) O wrapper do aside tem largura fixa (72px) e a sidebar expande via `transform`

O wrapper (em `Layout.module.scss`) define:
- `.sidebar { width: 72px; position: absolute; }`

Já o elemento interno (`Sidebar.module.scss`) expande com:
- `transform: translateX(188px);`

**Porém** a área que dispara `onMouseEnter/onMouseLeave` é:
- o próprio `<aside>` dentro de `Sidebar.jsx`.

Quando você expande com `transform`, o DOM do `<aside>` continua existindo, mas o posicionamento “visual” muda. Na prática, dependendo do compositor/precisão do pointer, o cursor pode:
- sair da área original
- “reentrar” rapidamente
- gerar múltiplas chamadas para `setExpanded(true/false)`.

**Resultado típico:** “bugada ao tocar” (principalmente em trackpad/touchpad quando a posição do ponteiro não é estável durante animações).

---

### 2.3) Mobile (<=768px) desliga o `transform` da sidebar, mas o hover continua existindo

Em `Sidebar.module.scss`:
- Para `width <= 768px`:
  - `.sidebar.expanded { transform: none; }

E em `Layout.module.scss`:
- Para `width <= 768px`:
  - `.topLeftSquare, .sidebar { display: none !important; }`
  - `.main` ajusta margin

Ou seja: em mobile, a sidebar pode ficar **invisível**, mas o estado `expanded` ainda pode estar sendo atualizado por hover se o componente ainda for montado e interceptar algum evento.

Mesmo sem estar “visível”, elementos podem continuar afetando eventos/hover dependendo da estrutura e z-index.

---

### 2.4) Potencial conflito de `z-index` e overlay de logout

`Sidebar.jsx` cria:
- quando `isLoggingOut`:
  - `{isLoggingOut && <div className={styles.overlay}> ... </div>}`

`Sidebar.module.scss`:
- `.overlay { position: fixed; inset:0; z-index: 300; }`

Isso não necessariamente impacta o hover normal, mas pode causar efeitos colaterais se o usuário dispara logout enquanto o hover está oscilando.

---

## 3) Sintoma “ao tocar” vs. “ao passar”

Em desktop, “passar o mouse” deve ser estável: `onMouseEnter/onMouseLeave` tende a disparar pouco.

Quando o usuário “toca” (encosta/clica/arrasta/seleciona), é comum acontecer:
- o ponteiro “oscila” sobre bordas do elemento
- eventos de mouse podem entrar/sair em múltiplos frames durante animações

No seu caso, como `expanded` altera também o layout do `.main` (`margin-left`), é provável que a animação gere reposicionamento que realimenta o hover.

---

## 4) Diagnóstico recomendando evidências (para confirmar 100%)

### 4.1) Logar quando o estado muda
Adicionar temporariamente logs em `Layout.jsx`:
- log de `expanded` a cada mudança
- log de origem do evento (enter/leave)

Objetivo: ver se `true/false` está alternando várias vezes em sequência ao “tocar”.

### 4.2) Medir frequência das mudanças
- Contar quantas vezes `setExpanded` é chamada em 1 segundo durante o bug.
- Se estiver indo para dezenas, o bug é um “hover loop”.

### 4.3) Testar desabilitar re-layout do `.main`
Se remover temporariamente:
- `.layout.expanded .main { margin-left: 260px; }`

e o flicker desaparecer, então **confirmou** a teoria: o reposicionamento do layout reinicia o hover.

### 4.4) Testar limitar hover a uma área estável
Se o problema for borda/transform, uma correção típica é:
- expandir via mudança de `width`/`min-width` em vez de `translateX`?
- ou manter um “hitbox” sempre expandido (ex.: pseudo-elemento/overlay que captura hover)

Mas antes, confirmar com logs.

---

## 5) Hipótese mais provável (ranking)

1. **Loop de hover** causado por alteração de geometria/reflow em conjunto com animação e hover:
   - hover muda `expanded`
   - `expanded` muda `main.margin-left`
   - reposiciona elementos sob o ponteiro
   - `onMouseLeave` dispara de novo
2. Área hover instável por `transform` + wrapper com largura fixa (72px).
3. Questões menores: mobile z-index/display, overlay de logout etc.

---

## 6) Próximos passos práticos (o que fazer depois de confirmar)

Depois da confirmação via logs:
- implementar debounce/throttle em `onHoverChange`
- ou trocar lógica de hover para:
  - expandir em `mouseenter`
  - contrair apenas após um delay ao sair (ex.: 80-150ms)
- ou impedir que `main` cause reflow durante hover (ex.: usar `transform` no `main` também, ou evitar mudança de margem)

Essas mudanças eliminam o flicker.

---

## Arquivos impactados (para referência)
- `src/components/Sidebar/Sidebar.jsx`
- `src/components/Sidebar/Sidebar.module.scss`
- `src/components/Layout/Layout.jsx`
- `src/components/Layout/Layout.module.scss`

---

## Conclusão
Pelo que foi analisado, o mecanismo de expansão está acoplado a hover **sem amortecimento (sem delay/debounce)** e, ao ativar o estado, o layout muda (`main margin-left`). Em conjunto com animações/transform e possíveis reposicionamentos sob o ponteiro, isso é a receita típica para “sidebar bugada” quando o ponteiro encosta/mexe durante a transição.

(Este documento é a base para a próxima etapa: confirmar com logs e então aplicar correção robusta.)
