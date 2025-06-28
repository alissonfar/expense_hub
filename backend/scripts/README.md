# Scripts de Banco de Dados - Personal Expense Hub

Este diretório contém scripts para gerenciar o banco de dados da aplicação.

## 📋 Scripts Disponíveis

### 1. **setup-database.js** - Configuração Inicial
**Comando:** `npm run db:setup`
**Arquivo:** `setup-database.bat`

**O que faz:**
- Cria o banco de dados `expense_hub_db`
- Aplica o schema completo
- Insere dados de teste
- Cria arquivo `.env`
- Configura tudo do zero

**Quando usar:**
- Primeira instalação
- Quando o banco não existe
- Para recriar tudo do zero

---

### 2. **reset-database.js** - Reset Completo
**Comando:** `npm run db:reset`
**Arquivo:** `reset-database.bat`

**O que faz:**
- Remove TODOS os dados do banco
- Resetar sequências de ID
- Reaplicar schema completo (opcional)
- Inserir dados básicos (opcional)
- Validação completa

**Quando usar:**
- Reset completo do banco
- Quando há problemas de schema
- Para começar do zero mantendo estrutura

---

### 3. **quick-reset.js** - Reset Rápido
**Comando:** `npm run db:reset:quick`
**Arquivo:** `quick-reset.bat`

**O que faz:**
- Remove apenas os dados
- Resetar sequências de ID
- Mantém o schema atual
- Inserir dados básicos (opcional)
- Mais rápido e seguro

**Quando usar:**
- Limpeza rápida de dados
- Testes e desenvolvimento
- Quando o schema está correto

---

## 🚀 Como Usar

### Opção 1: Via NPM (Recomendado)
```bash
# Navegar para o diretório backend
cd backend

# Setup inicial (primeira vez)
npm run db:setup

# Reset completo
npm run db:reset

# Reset rápido
npm run db:reset:quick
```

### Opção 2: Via Scripts Batch (Windows)
```bash
# Setup inicial
setup-database.bat

# Reset completo
reset-database.bat

# Reset rápido
quick-reset.bat
```

### Opção 3: Execução Direta
```bash
# Setup inicial
node scripts/setup-database.js

# Reset completo
node scripts/reset-database.js

# Reset rápido
node scripts/quick-reset.js
```

---

## ⚠️ Importante

### **Antes de Executar:**
1. **PostgreSQL rodando** na porta 5432
2. **Usuário postgres** com senha configurada
3. **Permissões** adequadas no PostgreSQL
4. **Backup** dos dados importantes (se houver)

### **Durante a Execução:**
- Digite a **senha do PostgreSQL** quando solicitado
- Confirme as operações quando perguntado
- Aguarde a conclusão de cada etapa

### **Após a Execução:**
1. Execute: `npm run db:generate`
2. Execute: `npm run dev`
3. Teste: `http://localhost:3001/api/test-db`

---

## 🔧 Solução de Problemas

### **Erro de Conexão:**
```
❌ Erro ao conectar ao PostgreSQL
```
**Soluções:**
- Verifique se o PostgreSQL está rodando
- Confirme a senha do usuário postgres
- Verifique se a porta 5432 está disponível

### **Banco Não Encontrado:**
```
❌ Banco 'expense_hub_db' não encontrado!
```
**Solução:**
- Execute primeiro: `npm run db:setup`

### **Erro de Permissão:**
```
❌ Erro de permissão
```
**Soluções:**
- Verifique permissões do usuário postgres
- Execute como administrador se necessário

### **Erro de Schema:**
```
❌ Erro ao aplicar schema
```
**Soluções:**
- Use o reset completo: `npm run db:reset`
- Verifique se os arquivos de migração existem

---

## 📊 Estrutura do Banco

### **Tabelas Principais:**
- `pessoas` - Usuários e participantes
- `tags` - Categorias de transações
- `transacoes` - Gastos e receitas
- `transacao_participantes` - Quem participou
- `transacao_tags` - Tags das transações
- `pagamentos` - Pagamentos realizados
- `pagamento_transacoes` - Detalhes dos pagamentos
- `configuracoes_sistema` - Configurações

### **Sequências Resetadas:**
- `pessoas_id_seq`
- `tags_id_seq`
- `transacoes_id_seq`
- `transacao_participantes_id_seq`
- `pagamentos_id_seq`
- `pagamento_transacoes_id_seq`
- `configuracoes_sistema_id_seq`

---

## 🎯 Recomendações

### **Para Desenvolvimento:**
- Use `npm run db:reset:quick` para limpeza rápida
- Mantenha dados de teste para desenvolvimento

### **Para Produção:**
- **NUNCA** use estes scripts em produção
- Sempre faça backup antes de qualquer operação
- Use apenas para ambiente de desenvolvimento

### **Para Testes:**
- Use `npm run db:reset` para testes completos
- Use `npm run db:reset:quick` para testes rápidos

---

## 📝 Logs e Validação

Todos os scripts fornecem:
- ✅ Logs detalhados de cada operação
- 📊 Contadores antes e depois
- 🔍 Validação dos resultados
- ⚠️ Avisos sobre problemas
- 💡 Sugestões de solução

---

## 🔄 Fluxo Recomendado

1. **Primeira Instalação:**
   ```bash
   npm run db:setup
   npm run db:generate
   npm run dev
   ```

2. **Desenvolvimento Diário:**
   ```bash
   npm run db:reset:quick
   npm run dev
   ```

3. **Problemas de Schema:**
   ```bash
   npm run db:reset
   npm run db:generate
   npm run dev
   ```

4. **Testes Completos:**
   ```bash
   npm run db:reset
   npm run db:generate
   npm run dev
   ``` 