# 🔄 **COMANDOS PARA RESETAR BANCO DE PRODUÇÃO**

## 📋 **VISÃO GERAL**

Este documento contém os comandos necessários para resetar e gerenciar o banco de dados de produção do Expense Hub. Todos os comandos usam o arquivo `.env.production` para conectar ao banco Supabase.

---

## 🚨 **ATENÇÃO - DADOS SERÃO PERDIDOS**

⚠️ **IMPORTANTE:** O comando de reset **APAGA TODOS OS DADOS** do banco de produção. Use apenas quando necessário.

---

## 🔧 **COMANDOS PRINCIPAIS**

### **1. RESET COMPLETO DO BANCO**
```bash
npx dotenv -e .env.production -- npx prisma migrate reset --force
```

**O que faz:**
- Apaga todos os dados do banco
- Aplica todas as migrações do zero
- Regenera o Prisma Client
- Confirma automaticamente (--force)

**Quando usar:**
- Quando há problemas estruturais no banco
- Após mudanças significativas no schema
- Para limpar dados de teste em produção

---

### **2. VERIFICAR STATUS DAS MIGRAÇÕES**
```bash
npx dotenv -e .env.production -- npx prisma migrate status
```

**O que faz:**
- Mostra quais migrações foram aplicadas
- Identifica migrações pendentes
- Verifica se o banco está sincronizado

**Quando usar:**
- Antes de fazer reset
- Para verificar se há migrações pendentes
- Para diagnosticar problemas de schema

---

### **3. APLICAR MIGRAÇÕES PENDENTES**
```bash
npx dotenv -e .env.production -- npx prisma migrate deploy
```

**O que faz:**
- Aplica apenas migrações que ainda não foram aplicadas
- Não apaga dados existentes
- Seguro para produção

**Quando usar:**
- Quando há novas migrações para aplicar
- Para atualizar schema sem perder dados
- Deploy de novas funcionalidades

---

### **4. GERENCIAR PRISMA CLIENT**
```bash
npx dotenv -e .env.production -- npx prisma generate
```

**O que faz:**
- Regenera o Prisma Client com o schema atual
- Atualiza tipos TypeScript
- Sincroniza com o banco

**Quando usar:**
- Após mudanças no schema
- Quando há erros de tipos
- Para garantir sincronização

---

## 📝 **ORDEM CORRETA DE EXECUÇÃO**

### **CENÁRIO 1: Reset Completo (Recomendado)**
```bash
# 1. Verificar status atual
npx dotenv -e .env.production -- npx prisma migrate status

# 2. Reset completo
npx dotenv -e .env.production -- npx prisma migrate reset --force

# 3. Verificar se tudo foi aplicado
npx dotenv -e .env.production -- npx prisma migrate status
```

### **CENÁRIO 2: Apenas Aplicar Migrações Pendentes**
```bash
# 1. Verificar migrações pendentes
npx dotenv -e .env.production -- npx prisma migrate status

# 2. Aplicar migrações pendentes
npx dotenv -e .env.production -- npx prisma migrate deploy

# 3. Regenerar Prisma Client
npx dotenv -e .env.production -- npx prisma generate
```

---

## 🔍 **COMANDOS DE DIAGNÓSTICO**

### **Verificar Conexão com o Banco**
```bash
npx dotenv -e .env.production -- npx prisma db pull
```

**O que faz:**
- Testa conexão com o banco
- Puxa schema atual do banco
- Identifica problemas de conexão

### **Verificar Schema Atual**
```bash
npx dotenv -e .env.production -- npx prisma db push --preview-feature
```

**O que faz:**
- Mostra diferenças entre schema local e banco
- Não aplica mudanças (preview)
- Útil para diagnóstico

---

## 🛠️ **COMANDOS DE DESENVOLVIMENTO**

### **Reset Banco Local (Desenvolvimento)**
```bash
npx prisma migrate reset --force
```

**O que faz:**
- Reset do banco local (localhost)
- Usa arquivo .env padrão
- Para desenvolvimento apenas

### **Verificar Status Local**
```bash
npx prisma migrate status
```

---

## 📊 **MIGRAÇÕES ESPERADAS**

Após reset completo, você deve ver estas migrações aplicadas:

```
migrations/
  └─ 20250628005915_multi_tenant_initial_schema/
  └─ 20250628200039_add_invite_system/
  └─ 20250628220701_fix_membros_hub_naming/
  └─ 20250720151759_add_vencimento_forma_pagamento_transacoes/
  └─ 20250720210324_add_god_mode_tables/
  └─ 20250720224538_add_password_reset_fields/
  └─ 20250720231801_add_email_verification_fields/
```

---

## 🚨 **TROUBLESHOOTING**

### **Erro de Permissão (EPERM)**
```
EPERM: operation not permitted, rename '...query_engine-windows.dll.node'
```

**Solução:**
- Feche o VS Code/IDE
- Feche o terminal
- Abra novo terminal
- Execute o comando novamente

### **Erro de Conexão**
```
Error: P1001: Can't reach database server
```

**Verificar:**
- Arquivo .env.production está correto
- Credenciais do Supabase estão válidas
- Internet está funcionando

### **Migrações Falharam**
```
Error: Migration failed
```

**Solução:**
- Verificar logs de erro
- Confirmar que schema.prisma está correto
- Tentar reset completo

---

## ✅ **CHECKLIST PÓS-RESET**

Após executar o reset, verifique:

- [ ] Todas as migrações foram aplicadas
- [ ] Prisma Client foi regenerado
- [ ] Backend consegue conectar ao banco
- [ ] Testes básicos funcionam
- [ ] Frontend consegue fazer login

---

## 📞 **SUPORTE**

Se houver problemas:

1. **Verificar logs** do comando executado
2. **Confirmar credenciais** no .env.production
3. **Testar conexão** com `npx prisma db pull`
4. **Verificar status** com `npx prisma migrate status`

---

**Última atualização:** 20/07/2025
**Versão:** 1.0