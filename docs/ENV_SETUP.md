# Guia de Configuração de Variáveis de Ambiente

Este guia explica como configurar corretamente as variáveis de ambiente para rodar o Personal Expense Hub em desenvolvimento e produção.

## Backend

### Desenvolvimento
1. Copie `backend/env.example` para `backend/.env.development`.
2. Edite os valores conforme necessário (usuário, senha, etc).
3. O backend carrega automaticamente o arquivo `.env.development` quando `NODE_ENV=development`.
4. Use o script `create-env.bat` para automatizar a criação do `.env.development` se preferir (ajuste o script se necessário).

### Produção
1. Copie `backend/env.production.example` para `backend/.env`.
2. Preencha os valores com segredos e URLs reais de produção.
3. O backend carrega automaticamente o arquivo `.env` em produção.
4. Nunca versionar arquivos `.env*`.

## Frontend

### Desenvolvimento
1. Copie `frontend/.env.local.example` para `frontend/.env.local`.
2. Ajuste o valor de `NEXT_PUBLIC_API_URL` se necessário.

### Produção
1. Copie `frontend/.env.production.local.example` para `frontend/.env.production.local`.
2. Defina `NEXT_PUBLIC_API_URL` para a URL real do backend em produção.

## Dicas de Segurança
- Nunca compartilhe ou versiona arquivos `.env*` com segredos reais.
- Use valores diferentes para dev e prod.
- Sempre revise as variáveis antes de fazer deploy.

## Referências
- Consulte sempre este arquivo antes de configurar ou alterar variáveis de ambiente.
- Dúvidas? Veja também os READMEs do backend e frontend. 