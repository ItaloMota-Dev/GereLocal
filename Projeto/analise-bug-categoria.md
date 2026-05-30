# Analise Bug Categoria (React + SCSS)

## Status em 2026-05-28

Este documento e historico de depuracao. O fluxo atual de estoque salva a
categoria no campo `category`, preenche o select ao editar e exibe fallback
visual somente quando a categoria estiver ausente. Nao ha logs de debug ativos
necessarios para esse fluxo.

## O Diagnóstico do Problema

O sintoma descrito (“o cartão continua caindo no fallback e exibindo `Sem categoria`”) aponta para um **problema no objeto produto** que chega no componente que renderiza o Card.

No seu `src/pages/Estoque/Estoque.jsx`, o fluxo atual é:

1. O Modal monta um `form` com `form.category` (select) e depois cria um `data` para persistir.
2. O Card renderiza a categoria com lógica visual:
   - ele chama `getCategoryVisual(product.category)`
   - e exibe literalmente `{product.category}` dentro de `<span className={styles.catText}>`.

Ponto importante: no seu código do Card **não existe um fallback explícito do tipo “se não tiver categoria, mostrar Sem categoria”**. O fallback `Sem categoria` está sendo inserido **antes**, durante o `handleSubmit`:

- No `handleSubmit`, você faz:
  ```js
  const data = {
    ...,
    category: chosenCategory || 'Sem categoria',
  }
  ```

Logo, se no Card está aparecendo `Sem categoria`, isso significa que o objeto `product` que está indo para o Card está chegando com algo como:
- `product.category === 'Sem categoria'`

Ou seja: **o problema provavelmente é que o `chosenCategory` está vindo vazio** (ou o `form.category` está vazio) no momento do submit/salvar, ou ainda que a atualização do produto está salvando/propagando dados com alguma **chave diferente** (ex: `cat`, `categoryName`, `categoria`, etc.) ou o `updateProduct` não está aplicando corretamente.

Além disso, você tem um `console.log` direto no map do Card:
```js
console.log('Dado recebido no Cartão:', product)
```
Isso é exatamente o tipo de evidência que você precisa para confirmar se `product` realmente tem `category` preenchido ou se está chegando como `undefined`/string vazia e por isso você acabou gravando `Sem categoria`.


## Checklist de Depuração (Onde procurar o erro)

### Passo A (Modal): verificar se o submit/save está capturando o valor do `<select>`

No `src/pages/Estoque/Estoque.jsx`, sua lógica de submit é:

1. `chosenCategory` depende de:
   - `form.newCategorySelected ? form.newCategory.trim() : form.category.trim()`
2. Você constrói `data` com:
   - `category: chosenCategory || 'Sem categoria'`

Aqui está **exatamente o que fazer** para saber onde dá erro:

1) **Instrumentar o código no início do `handleSubmit`** (logo após `e.preventDefault()`).

Adicione logs como abaixo:
```js
console.log('[A] submit iniciado')
console.log('[A1] form.category:', JSON.stringify(form.category))
console.log('[A2] form.newCategorySelected:', form.newCategorySelected)
console.log('[A3] form.newCategory:', JSON.stringify(form.newCategory))

const chosenCategory = form.newCategorySelected
  ? form.newCategory.trim()
  : form.category.trim()

console.log('[A4] chosenCategory (antes do fallback):', JSON.stringify(chosenCategory))

const data = {
  name: form.name.trim(),
  price: parseFloat(form.price),
  quantity: parseInt(form.quantity, 10),
  category: chosenCategory || 'Sem categoria',
}

console.log('[A5] data.category (vai para add/update):', JSON.stringify(data.category))
```

2) **Executar o cenário de teste**
- Crie um produto novo.
- Selecione uma categoria real no `<select>`.
- Salve.

3) **Interpretar o resultado**
- Se **[A4]** ou **[A5]** vier `"Sem categoria"` (ou `""`), então o erro está no Modal: o `<select>` não está alimentando `form.category` corretamente **no momento do submit**.
- Se **[A5]** vier com a categoria correta (ex: `"Eletrônicos & Informática"`), então a origem do erro sai do Modal e vai para **Passo B/C**.

4) Cenários que causam `chosenCategory` vazio mesmo com UI aparentemente ok
- O estado do modal foi resetado antes do submit (ex: clique duplo / botão / closeModal acionado cedo).
- Ao editar, você pode estar abrindo o modal com `category: product.category || ''` e o `product` original já está sem categoria (caso em que o erro é anterior/salvo errado na rodada anterior).



### Passo B (Estado/Backend): verificar se a lista global de produtos está salvando `categoria` dentro do objeto

Seu backend “real” aqui é o **LocalStorage** via `src/services/storage.js` e o estado global é gerenciado pelo `src/context/DataContext.jsx`.

Verificações:

1. Confirme que o `DataContext` salva a propriedade `category`:
   - No `DataProvider`, você faz:
     - `updateProduct(id, updates)`
       ```js
       setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)))
       ```
   - Ou seja: se `updates` tem `category`, ela deve entrar em `p.category`.

2. Confirme se o LocalStorage persiste exatamente o objeto com `category`:
   - Você persiste `products` inteiro via `saveProducts(products)`.

3. Verifique se em algum lugar existe transformação/renomeação de campo:
   - O `updateProduct` faz spread direto `{ ...p, ...updates }`, então renomeação só ocorreria se:
     - sua função `updateProduct(editingProduct.id, data)` estiver chamando `updateProduct` com objeto `data` sem `category`
     - ou se você estiver passando `updates` com outra chave.

4. Verifique se o problema aparece no fluxo “Cadastrar” e/ou “Editar”:
   - Se **Cadastrar** já gera `Sem categoria`, o problema está no Passo A.
   - Se **Editar** sempre perde categoria, o problema pode ser: ao abrir o modal para editar, você está populando `form.category` com a chave errada do produto (ex: produto tem `categoria`, mas você lê `product.category`).


### Passo C (Props do Cartão): usar `console.log(produto)` para inspecionar a estrutura do objeto que chega ao Card

Você já tem um `console.log` no map do Card:
```js
console.log('Dado recebido no Cartão:', product)
```

Faça esse log ser “diagnóstico”:

1. Logar também especificamente o campo e o tipo:
   ```js
   console.log('[DEBUG] product.category:', product?.category)
   console.log('[DEBUG] typeof product.category:', typeof product?.category)
   console.log('[DEBUG] full product keys:', Object.keys(product || {}))
   ```

2. Verifique possíveis casos típicos:
   - **Caso 1:** `product.category` existe mas é `'Sem categoria'`:
     - então o problema é “no submit” (Passo A) ou na inicialização do form (openModal).
   - **Caso 2:** `product.category` é `undefined`:
     - então a propriedade não foi persistida (problema no Passo B), ou você está salvando como outra chave.
   - **Caso 3:** existe `product.categoria` (ou `product.cat`) mas não `product.category`:
     - então o problema é de **mapeamento de nomes** (campo salvo com outra grafia e o Card procura `product.category`).

3. Se a categoria estiver vindo como string vazia `''`, confirme se o seu submit realmente foi gravando fallback:
   - Mesmo que o Card mostre `''`, você ainda mencionou “Sem categoria”, então provavelmente o valor está sendo explicitamente colocado como fallback.


## A Solução Esperada

A “solução” aqui é restaurar o fluxo correto: **select → state do formulário → objeto `data` com `category` → update/add → produtos no DataContext → Card renderiza `product.category`**.

### Exemplo prático do objeto `produto` correto circulando

O objeto final esperado no Card deve ser algo como:

```js
{
  id: 'uuid-qualquer',
  name: 'Cabo USB',
  price: 29.9,
  quantity: 12,
  category: 'Eletrônicos & Informática'
}
```

E então o Card fará:
- `getCategoryVisual(product.category)` encontrando um match via normalização
- exibindo `product.category` corretamente

### Como corrigir se estiver omitindo a categoria na função de salvar

Há 2 correções comuns (escolha a que bater com seus logs):

#### Correção 1: `chosenCategory` está vindo vazio (problema no Passo A)

- Garanta que o select está preenchendo o estado e que o `onChange` está sendo executado.
- Garanta que não existe reset indevido do `form` antes do submit.
- Ajuste para logar e depois remover fallback temporário (apenas para detectar):

Exemplo de melhoria diagnóstica (temporária):
```js
console.log('[DEBUG] chosenCategory (antes do fallback):', chosenCategory)

const data = {
  ...,
  category: chosenCategory, // sem 'Sem categoria' temporariamente
}
```

Se isso quebrar a UI, volte o fallback depois, mas confirmará a origem do problema.

#### Correção 2: campo está sendo salvo com outro nome (problema de mapeamento)

Se seus logs mostrarem algo como `product.categoria` (ou `product.cat`) mas o Card usa `product.category`, então você precisa escolher um padrão e alinhar:

- Ou você ajusta o submit para salvar como `category`:
  ```js
  const data = {
    ...,
    category: chosenCategory || 'Sem categoria',
  }
  ```

- Ou você ajusta o Card/visualização para ler a chave real que está vindo.

Exemplo: se o backend salva como `categoria`, mude o Card:
```jsx
const cat = getCategoryVisual(product.categoria)
...
{product.categoria}
```

O ideal (mais consistente) é normalizar para sempre usar `category` em todo o front.

### Ponto final: verificação de consistência

Depois de corrigir:

1. Crie um novo produto e selecione uma categoria válida no select.
2. Salve.
3. Confirme no console no Card que:
   - `product.category` tem exatamente o texto esperado.
4. Edite o mesmo produto, mantenha a categoria, salve.
5. Confirme que o valor continua presente no objeto.


---

> Resultado esperado após correção: o Card deve parar de renderizar `Sem categoria` para produtos onde o usuário selecionou uma opção no Modal, e o `console.log('[DEBUG] product.category: ...')` deve mostrar o valor real selecionado (por exemplo, `Eletrônicos & Informática`).
