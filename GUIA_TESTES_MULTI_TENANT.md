# 🚀 GUIA DE TESTES MULTI-TENANT - POSTMAN

## 📋 PREPARAÇÃO

### 1. Importar Collection
1. Abra o Postman
2. Clique em **Import**
3. Selecione o arquivo: `Personal_Expense_Hub_MultiTenant_Tests.postman_collection.json`
4. Confirme a importação

### 2. Verificar Variables
- **baseUrl**: `http://localhost:3001/api` (deve estar rodando)
- **tokenHubA**, **tokenHubB**: Serão preenchidos automaticamente durante os testes

---

## ⚡ EXECUÇÃO DOS TESTES

### **ORDEN OBRIGATÓRIA:**
Execute as pastas na sequência exata:

### 1️⃣ **🔧 SETUP - Criação de Hubs**
- **1.1 - Registrar Admin Hub A**
- **1.2 - Registrar Admin Hub B**

**❗ IMPORTANTE:** Aguarde cada request completar antes do próximo

### 2️⃣ **🔐 AUTENTICAÇÃO** 
- **2.1 - Login Hub A**
- **2.2 - Login Hub B**

### 3️⃣ **👥 TESTE CRÍTICO: ISOLAMENTO DE PESSOAS**
- **3.1 - Criar Pessoa no Hub A**
- **3.2 - Criar Pessoa no Hub B** 
- **🚨 3.3 - TESTE CRÍTICO: Listar Pessoas Hub A (ISOLAMENTO)**
- **🚨 3.4 - TESTE CRÍTICO: Listar Pessoas Hub B (ISOLAMENTO)**

### 4️⃣ **🏷️ TESTE CRÍTICO: ISOLAMENTO DE TAGS**
- **4.1 - Criar Tag no Hub A**
- **4.2 - Criar Tag no Hub B**
- **🚨 4.3 - TESTE CRÍTICO: Listar Tags Hub A (ISOLAMENTO)**
- **🚨 4.4 - TESTE CRÍTICO: Listar Tags Hub B (ISOLAMENTO)**

### 5️⃣ **🔒 TESTE DE SEGURANÇA**
- **5.1 - Tentar Acesso sem Token**
- **5.2 - Tentar Acesso com Token Inválido**

### 6️⃣ **✅ VALIDAÇÃO JWT**
- **6.1 - Verificar Perfil Hub A**
- **6.2 - Verificar Perfil Hub B**

---

## 🎯 VALIDAÇÕES CRÍTICAS

### ✅ **SUCESSO ESPERADO:**
```json
// Pessoas Hub A deve retornar:
{
  "success": true,
  "data": [
    { "nome": "Admin Hub A", ... },
    { "nome": "João Hub A", ... }
    // SEM "Maria Hub B"!
  ]
}

// Pessoas Hub B deve retornar:
{
  "success": true, 
  "data": [
    { "nome": "Admin Hub B", ... },
    { "nome": "Maria Hub B", ... }
    // SEM "João Hub A"!
  ]
}
```

### 🚨 **FALHAS CRÍTICAS:**
- Se Hub A ver dados do Hub B = **FALHA DE ISOLAMENTO**
- Se Hub B ver dados do Hub A = **FALHA DE ISOLAMENTO**
- Status 500 = **Erro no servidor**
- Status 401 sem token = **OK** (esperado)

---

## 🔍 COMO INTERPRETAR RESULTADOS

### 🟢 **VERDE = APROVADO**
- Status 200/201 nos testes de criação
- Status 401 nos testes de segurança
- Testes "ISOLAMENTO" passaram

### 🔴 **VERMELHO = FALHA**
- Erro "Cannot set headers" = **Middleware com bug**
- Erro "FALHA DE ISOLAMENTO" = **Dados vazando entre Hubs**
- Status 500 = **Erro interno do servidor**

### 🟡 **AMARELO = ATENÇÃO**
- Status 400 = **Dados inválidos** (verificar JSON)
- Timeout = **Servidor não está respondendo**

---

## 🛠️ TROUBLESHOOTING

### **Erro: "Cannot set headers after they are sent"**
✅ **CORRIGIDO** - Era bug no middleware de validação

### **Erro: "Campo nomeHub obrigatório"**  
✅ **CORRIGIDO** - Schema atualizado com nomeHub

### **Erro: "Nome deve conter apenas letras"**
✅ **CORRIGIDO** - Regex de validação corrigida

### **Erro: "Telefone formato inválido"**
✅ **CORRIGIDO** - Regex telefone corrigida

### **Server não responde**
```bash
cd backend && npm run dev
```

---

## 🎯 CRITÉRIOS DE APROVAÇÃO

### **TODOS os itens devem PASSAR:**
- [ ] ✅ Hub A registrado com sucesso
- [ ] ✅ Hub B registrado com sucesso  
- [ ] ✅ Login Hub A funcionando
- [ ] ✅ Login Hub B funcionando
- [ ] ✅ Pessoa criada no Hub A
- [ ] ✅ Pessoa criada no Hub B
- [ ] 🔥 **Hub A NÃO vê pessoas do Hub B**
- [ ] 🔥 **Hub B NÃO vê pessoas do Hub A** 
- [ ] ✅ Tag criada no Hub A
- [ ] ✅ Tag criada no Hub B
- [ ] 🔥 **Hub A NÃO vê tags do Hub B**
- [ ] 🔥 **Hub B NÃO vê tags do Hub A**
- [ ] ✅ Acesso negado sem token
- [ ] ✅ Token inválido rejeitado
- [ ] ✅ Perfil Hub A correto
- [ ] ✅ Perfil Hub B correto

### **SE ALGUM ITEM FALHAR:**
**🚨 SISTEMA NÃO ESTÁ SEGURO PARA PRODUÇÃO!**

---

## 🚀 EXECUÇÃO AUTOMÁTICA

### **Option 1: Collection Runner**
1. No Postman, clique em **Runner**
2. Selecione a collection **"Personal Expense Hub - Multi-Tenant Tests"**
3. Clique **Run Personal Expense Hub - Multi-Tenant Tests**
4. Aguarde todos os testes executarem

### **Option 2: Manual (Recomendado)**
Execute request por request para ver detalhes de cada validação

---

## 📊 RELATÓRIO ESPERADO

### **Resultado Final:**
```
✅ 16/16 tests passed
🔥 Isolamento multi-tenant: FUNCIONAL
🔒 Segurança: APROVADA  
🎯 Sistema: PRONTO PARA PRODUÇÃO
```

### **Se houver falhas:**
```
❌ X/16 tests failed
🚨 Verificar logs do servidor
🔧 Corrigir problemas antes de prosseguir
```

---

**🎯 PRÓXIMOS PASSOS APÓS APROVAÇÃO:**
1. Testar transações multi-tenant
2. Validar relatórios por Hub
3. Testar dashboard isolado
4. Deploy em staging 