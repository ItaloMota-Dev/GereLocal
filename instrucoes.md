# Instruções de depuração: onde a `categoria` se perde (Estoque)

## Status em 2026-05-28

Documento mantido apenas como historico de depuracao. O fluxo atual usa
`category` de forma consistente em cadastro, edicao, persistencia e exibicao.
Nao e necessario adicionar os logs abaixo para o estado atual do projeto.

## Visão geral do fluxo que precisa estar correto
1) `<select>` do Modal (onChange) → atualiza `form.category`
2) `handleSubmit()` monta o objeto `data` com `category`
3) `updateProduct/addProduct` salva `products` com a chave `category`
4) Cartão renderiza `product.category` e usa isso em `getCategoryVisual()`

---

## A) Coloque logs para observar o dado real (obrigatório)

### 1) Log do Cartão (produto recebido)
Abra: `src/pages/Estoque/Estoque.jsx`

No trecho onde faz:
```jsx
filtered.map((product) => (
```
ou equivalente, adicione no começo do callback:
```jsx
console.log("Dado recebido no Cartão:", product)
```

✅ O que você deve conferir no console:
- Existe a chave `category` dentro do objeto `product`?
- O valor vem como o selecionado no modal (ex: `Alimentos & Bebidas`)?
- Se não existir `category`, procure o nome alternativo (ex: `categories`, `Category`, `categoryName`, etc.).

---

### 2) (Recomendado) Log no submit (objeto enviado)
No mesmo arquivo, dentro de `handleSubmit(e)`, imediatamente antes do `if (editingProduct) { ... }`, adicione:
```js
console.log("SUBMIT - form:", form)
console.log("SUBMIT - data enviado:", data)
```

✅ O que você deve conferir:
- `form.category` está preenchido quando você escolhe no `<select>`?
- `data.category` está correto e **não** está caindo em `'Sem categoria'`?

---

## B) Teste manual passo a passo (com logs)

### Passo 1 — Teste criando produto
1. Abra o modal: clique em **"Novo Produto"**
2. Preencha Nome, Preço, Quantidade
3. Selecione uma categoria no `<select>`
4. Clique em **"Cadastrar produto"**
5. No console, observe:
   - `SUBMIT - data enviado` deve ter `category: "...categoria selecionada..."`
   - `Dado recebido no Cartão` deve receber `product.category` igual

Se cair em `'Sem categoria'` no submit → o problema está no **Passo 1/2** (Captura do select ou montagem do submit).

---

### Passo 2 — Teste editando produto
1. No cartão do produto, clique em **"Editar"**
2. Troque a categoria no `<select>`
3. Clique em **"Salvar alterações"**
4. No console, observe:
   - `SUBMIT - data enviado.category` com o novo valor
   - `Dado recebido no Cartão` com o valor novo

Se o submit estiver correto, mas o cartão mostra “Sem categoria” → o problema está em **Passo 3/4** (salvamento no estado/props ou render/mapeamento).

---

## C) Checagens específicas pelos 4 pontos de falha

### 1) Captura do Input no Modal (`<select>`)
No arquivo `src/pages/Estoque/Estoque.jsx` valide:
- `value={form.category}`
- `onChange={(e) => setForm({ ...form, category: e.target.value })}`

E valide também:
- As strings das opções (`option value`) batem exatamente com o que o cartão espera salvar.

---

### 2) Função de Salvar/Atualizar (submit)
Ainda em `handleSubmit`:
- Garanta que você está salvando `category: chosenCategory || 'Sem categoria'`
- `chosenCategory` deve vir de:
  - `form.category` (no seu código atual)
  - ou `form.newCategory` se `newCategorySelected` fosse usado (no seu código atual, isso está false por padrão)

✅ Se o console mostrar `data.category === 'Sem categoria'`, então `form.category` está vazio no submit.

---

### 3) Passagem de Props para o Cartão
O seu cartão usa `product.category` diretamente em:
- `getCategoryVisual(product.category)`
- texto: `{product.category}`

✅ Portanto o objeto `product` tem que conter `category`.

Se o log do cartão imprimir `product` sem `category`, então você está perdendo a chave no estado/armazenamento.

---

### 4) Mapeamento string → ícone/visual
Seu `getCategoryVisual()` normaliza acentos e caixa (lowercase). Isso reduz falhas por case/acentos.

✅ Mesmo assim, você deve considerar que o cartão exibe o texto cru (`product.category`). Se estiver vindo `'Sem categoria'`, não é só visual.

---

## D) Como interpretar os resultados

1. **Se `SUBMIT - data enviado` estiver correto, mas o cartão mostra Sem categoria**
   - o estado `products` não está sendo atualizado corretamente com `data.category`
   - ou outro componente usa outra fonte de dados / outro campo

2. **Se `SUBMIT - data enviado.category` vier `'Sem categoria'`**
   - o select não está preenchendo `form.category` como você acredita
   - pode ser porque o valor selecionado não está indo para o state (por exemplo, value/option mismatch)

3. **Se `Dado recebido no Cartão` não tiver `category`**
   - a chave está sendo salva com outro nome em algum ponto (armazenamento, parsing, persistência)

---

## E) Correção típica (após achar a causa)
Quando você descobrir a quebra exata pelos logs:
- Se for mismatch de chave: padronize para sempre usar `category`
- Se for form vazio: garanta `setForm` no onChange e estado consistente
- Se for persistência: ajuste `storage` / leitura para manter `category`

---

## Arquivo alvo
- `src/pages/Estoque/Estoque.jsx`
