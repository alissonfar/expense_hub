# Personal Expense Hub - Frontend

> **Atenção:** Para configurar variáveis de ambiente, siga o guia em `../docs/ENV_SETUP.md` antes de rodar ou fazer deploy.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Problema Resolvido: TailwindCSS/PostCSS não aplicava estilos

### Contexto
Após atualização de dependências e mudanças no build (remoção do Turbopack, downgrade do Tailwind, limpeza de cache), o frontend Next.js passou a exibir as páginas sem qualquer estilização do TailwindCSS.

### Diagnóstico Dinâmico (@investigacao.mdc)
- Confirmado que o arquivo `globals.css` estava corretamente importado no `app/layout.tsx`.
- O conteúdo de `globals.css` continha as diretivas do Tailwind (`@tailwind base;`, `@tailwind components;`, `@tailwind utilities;`).
- O arquivo `tailwind.config.ts` estava correto e cobria todos os paths necessários.
- **Descoberta:** Faltava o arquivo `postcss.config.js` na raiz do frontend. Sem ele, o Next.js não processa as diretivas do Tailwind, resultando em páginas sem estilo.

### Solução
1. Criado o arquivo `frontend/postcss.config.js` com o conteúdo:
   ```js
   module.exports = {
     plugins: {
       tailwindcss: {},
       autoprefixer: {},
     },
   };
   ```
2. Garantido que as dependências `tailwindcss`, `autoprefixer` e `postcss` estavam instaladas.
3. Rodado `npm run build` e `npm run start` para validar a aplicação dos estilos.

### Resultado
- O TailwindCSS voltou a funcionar normalmente em todo o frontend.
- Documentação e histórico de troubleshooting atualizados para futuras referências.

> **Dica:** Sempre verifique a existência do `postcss.config.js` ao debugar problemas de estilos com Tailwind em projetos Next.js.
