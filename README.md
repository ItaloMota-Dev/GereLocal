<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:10242F,100:2F7F93&height=200&section=header&text=GereLocal&fontSize=52&fontColor=ffffff&fontAlignY=38&desc=Gest%C3%A3o%20de%20vendas%20e%20estoque%20para%20pequenos%20com%C3%A9rcios&descSize=20&descAlignY=60" alt="GereLocal – gestão de vendas e estoque para pequenos comércios" />

Projeto de extensão universitária com foco social · UNIFOR

<p align="center">
<img src="https://img.shields.io/badge/Projeto%20de%20extens%C3%A3o-UNIFOR-10242F?style=for-the-badge" alt="Projeto de extensão UNIFOR" /> <img src="https://img.shields.io/badge/Status-Prot%C3%B3tipo-F59E0B?style=for-the-badge" alt="Status: protótipo" />
</p>

<p align="center">
<a href="https://github.com/ItaloMota-Dev">← Voltar ao perfil</a>
</p>

</div>

---

## Sobre o projeto

O **GereLocal** é um protótipo de gestão para pequenos comércios. Ele reúne vendas, estoque e acompanhamento do negócio em uma interface simples, pensada para quem tem pouca familiaridade com tecnologia.

A proposta surgiu da preocupação em tornar esse tipo de sistema mais acessível, priorizando uma experiência de uso clara, intuitiva e fácil de compreender, como alternativa direta aos sistemas de gestão mais complexos.

> [!WARNING]
> Este é um protótipo **somente de front-end, por enquanto**. Contas, sessão, produtos, vendas e caixa ficam no `localStorage` do navegador. Isso serve para demonstração com dados fictícios, mas **por enquanto não sincroniza entre aparelhos e não oferece autenticação nem permissões seguras**. As restrições de perfil são aplicadas no próprio front-end e, por enquanto, não protegem dados reais.

---

## Funcionalidades

O sistema tem dois perfis, com menus e acessos diferentes.

### Gerente
- Acesso a Dashboard, estoque, vendas e relatório
- Cadastro de produtos e ajustes de estoque
- Cancelamento de vendas
- Painel com indicadores e produtos mais vendidos
- Fechamento de caixa por período e registro de entradas e retiradas
- Histórico de operações
- Exportação de dados em CSV e geração/importação de backups
- Ao criar a conta, recebe um **código da loja** para cadastrar atendentes

### Atendente
- Cadastro com o código informado pelo gerente
- Registro de vendas, com descontos e diferentes formas de pagamento
- Consulta ao estoque, sem acesso a custos nem a ações administrativas
- Histórico limitado às vendas que ele mesmo registrou
- Redirecionamento automático ao tentar abrir as páginas de Dashboard ou Relatório

---

## Tecnologias

<p>
<b>Interface</b><br>
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" /> <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" /> <img src="https://img.shields.io/badge/Sass-CC6699?style=for-the-badge&logo=sass&logoColor=white" alt="Sass" /> <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5" />
</p>

<p>
<b>Bibliotecas</b><br>
<img src="https://img.shields.io/badge/React%20Router-CA4245?style=for-the-badge&logo=reactrouter&logoColor=white" alt="React Router" /> <img src="https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge" alt="Recharts" /> <img src="https://img.shields.io/badge/Lucide-F56565?style=for-the-badge&logo=lucide&logoColor=white" alt="Lucide React" />
</p>

<p>
<b>Ferramentas</b><br>
<img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" /> <img src="https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white" alt="ESLint" /> <img src="https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black" alt="Prettier" /> <img src="https://img.shields.io/badge/Stylelint-263238?style=for-the-badge&logo=stylelint&logoColor=white" alt="Stylelint" />
</p>

---

## Como executar

**Pré-requisitos:** Node.js 20 LTS ou superior e npm.

```bash
git clone https://github.com/ItaloMota-Dev/GereLocal.git
cd GereLocal
npm ci
npm run dev
```

Abra o endereço mostrado no terminal (normalmente `http://localhost:5173`).

**Como testar os dois perfis:**
1. Crie uma conta de **gerente** e copie o código da loja.
2. Crie uma conta de **atendente** usando esse código. Como os dados ficam no navegador, use o mesmo navegador nos dois cadastros.

**Para validar alterações:**

```bash
npm run lint
npm run build
```

---

## Organização do código

```text
src/
├── app/        inicialização e rotas
├── features/   autenticação, Dashboard, estoque, vendas, relatório e ajuda
└── shared/     componentes, contextos, estilos, serviços e utilitários
```

A interface é em português; arquivos e componentes usam nomes em inglês.

---

## Próximos passos

- Autenticação e regras de autorização no servidor
- Banco de dados para guardar as informações de forma segura (a opção avaliada é PostgreSQL gerenciado no Supabase, ainda não criado nem conectado)

---

<div align="center">

## Autor

Desenvolvido por **Italo Mota**

<p align="center">
<a href="https://github.com/ItaloMota-Dev"><img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" /></a> <a href="https://www.linkedin.com/in/italo-galdino-mota-a88194423"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge" alt="LinkedIn" /></a> <a href="mailto:italo.mota.dev@gmail.com"><img src="https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="E-mail" /></a>
</p>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:10242F,100:2F7F93&height=100&section=footer" alt="" />

</div>