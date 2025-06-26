# 📡 API REFERENCE - PERSONAL EXPENSE HUB

**Documentação completa da API REST**  
**Base URL:** `http://localhost:3001/api`  
**Versão:** 2.0.0  
**Total de Endpoints:** 42

## 🔐 **AUTENTICAÇÃO**

### **Sistema JWT**
```http
Authorization: Bearer <jwt_token>
```

**Payload JWT:**
```json
{
  "user_id": 1,
  "email": "user@example.com",
  "nome": "Nome do Usuário",
  "eh_proprietario": true,
  "iat": 1640995200,
  "exp": 1641600000
}
```

---

## 🚪 **AUTENTICAÇÃO (/api/auth)** - 6 endpoints

### **1. POST /api/auth/register**
Registra um novo usuário no sistema.

**Request:**
```json
{
  "nome": "João Silva",
  "email": "joao@example.com",
  "senha": "MinhaSenh@123",
  "telefone": "(11) 99999-9999"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Usuário registrado com sucesso!",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@example.com",
      "eh_proprietario": true
    }
  },
  "refreshToken": "refresh_token_here",
  "timestamp": "2025-01-24T10:30:00.000Z"
}
```

### **2. POST /api/auth/login**
**Request:** `{ "email": "user@email.com", "senha": "senha123" }`
**Response:** JWT token + dados do usuário

### **3. GET /api/auth/me**
**Headers:** `Authorization: Bearer <token>`
**Response:** Dados do usuário logado

### **4. PUT /api/auth/profile**
Atualizar perfil do usuário

### **5. PUT /api/auth/change-password**
Alterar senha do usuário

### **6. GET /api/auth/info**
Documentação dos endpoints de autenticação

---

## 👥 **PESSOAS (/api/pessoas)** - 6 endpoints

### **1. GET /api/pessoas**
Lista todas as pessoas do sistema.

**Query Parameters:**
- `ativo` - boolean (filtrar por status)
- `proprietario` - boolean (filtrar proprietários)
- `page` - number (página, padrão: 1)
- `limit` - number (itens por página, padrão: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@email.com",
      "telefone": "(11) 99999-9999",
      "eh_proprietario": false,
      "ativo": true,
      "data_cadastro": "2025-01-20T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### **2. POST /api/pessoas**
**Auth:** Proprietário apenas
**Body:** `{ "nome", "email", "telefone?", "eh_proprietario?" }`

### **3. GET /api/pessoas/:id**
Detalhes de uma pessoa específica

### **4. PUT /api/pessoas/:id**
Editar dados de uma pessoa

### **5. DELETE /api/pessoas/:id**
Desativar pessoa (soft delete)

### **6. GET /api/pessoas/info**
Documentação dos endpoints

---

## 🏷️ **TAGS (/api/tags)** - 6 endpoints

### **1. GET /api/tags**
Lista todas as tags do sistema

### **2. POST /api/tags**
**Body:** `{ "nome", "cor?", "icone?" }`
**Validação:** Cor formato #RRGGBB

### **3. GET /api/tags/:id**
Detalhes da tag + estatísticas de uso

### **4. PUT /api/tags/:id**
Editar tag

### **5. DELETE /api/tags/:id**
Desativar tag

### **6. GET /api/tags/info**
Documentação dos endpoints

---

## 💳 **TRANSAÇÕES (/api/transacoes)** - 8 endpoints

### **1. GET /api/transacoes**
Lista transações com filtros avançados

**Query Parameters:**
- `tipo` - 'GASTO' | 'RECEITA'
- `status_pagamento` - 'PENDENTE' | 'PAGO_PARCIAL' | 'PAGO_TOTAL'
- `data_inicio` - YYYY-MM-DD
- `data_fim` - YYYY-MM-DD
- `pessoa_id` - number
- `tag_id` - number
- `eh_parcelado` - boolean

### **2. POST /api/transacoes**
Criar novo gasto compartilhado

**Request:**
```json
{
  "descricao": "Jantar no restaurante",
  "local": "Restaurante Italiano",
  "valor_total": 240.00,
  "data_transacao": "2025-01-24",
  "eh_parcelado": false,
  "participantes": [
    {
      "pessoa_id": 1,
      "valor_devido": 60.00
    },
    {
      "pessoa_id": 2,
      "valor_devido": 60.00
    }
  ],
  "tags": [1, 3]
}
```

### **3. GET /api/transacoes/:id**
Detalhes completos da transação

### **4. PUT /api/transacoes/:id**
Editar transação (campos limitados)

### **5. DELETE /api/transacoes/:id**
Excluir transação

### **6. POST /api/transacoes/receita**
Criar receita (apenas proprietário)

### **7. PUT /api/transacoes/receita/:id**
Editar receita

### **8. GET /api/transacoes/info**
Documentação dos endpoints

---

## 💰 **PAGAMENTOS (/api/pagamentos)** - 8 endpoints

### **1. GET /api/pagamentos**
Lista pagamentos com filtros

### **2. POST /api/pagamentos**
Criar pagamento (individual ou composto)

**Individual:**
```json
{
  "transacao_id": 1,
  "valor_pago": 60.00,
  "data_pagamento": "2025-01-24",
  "forma_pagamento": "PIX"
}
```

**Composto:**
```json
{
  "transacoes": [
    { "transacao_id": 1, "valor_aplicado": 60.00 },
    { "transacao_id": 2, "valor_aplicado": 40.00 }
  ],
  "data_pagamento": "2025-01-24",
  "forma_pagamento": "PIX",
  "processar_excedente": true
}
```

### **3. GET /api/pagamentos/:id**
Detalhes do pagamento

### **4. PUT /api/pagamentos/:id**
Atualizar pagamento

### **5. DELETE /api/pagamentos/:id**
Excluir pagamento

### **6. GET /api/pagamentos/configuracoes/excedente**
Configurações de excedente

### **7. PUT /api/pagamentos/configuracoes/excedente**
Atualizar configurações de excedente

### **8. GET /api/pagamentos/info**
Documentação dos endpoints

---

## 📊 **RELATÓRIOS (/api/relatorios)** - 6 endpoints

### **1. GET /api/relatorios/dashboard**
Dashboard principal com métricas

**Response:**
```json
{
  "success": true,
  "data": {
    "resumo": {
      "total_gastos": 12450.00,
      "total_receitas": 8720.00,
      "pendencias": 3280.00,
      "pagamentos_mes": 23
    },
    "graficos": {
      "gastos_por_mes": [...],
      "categorias": [...]
    }
  }
}
```

### **2. GET /api/relatorios/saldos**
Saldos por pessoa

### **3. GET /api/relatorios/pendencias**
Análise de pendências

### **4. GET /api/relatorios/transacoes**
Relatório detalhado de transações

### **5. GET /api/relatorios/categorias**
Análise por categorias/tags

### **6. GET /api/relatorios/info**
Documentação dos endpoints

---

## ⚙️ **CONFIGURAÇÕES (/api/configuracoes)** - 4 endpoints

### **1. GET /api/configuracoes/interface**
Configurações de interface

### **2. PUT /api/configuracoes/interface**
Atualizar configurações de interface

### **3. GET /api/configuracoes/info**
Documentação dos endpoints

### **4. Futuros endpoints**
- `/comportamento` (501 - Não implementado)
- `/alertas` (501 - Não implementado)
- `/relatorios` (501 - Não implementado)

---

## 📋 **PADRÕES GLOBAIS**

### **Response Padrão**
```json
{
  "success": boolean,
  "message": "string",
  "data": any,
  "timestamp": "ISO 8601 string"
}
```

### **Paginação**
```json
{
  "page": number,
  "limit": number,
  "total": number,
  "totalPages": number,
  "hasNext": boolean,
  "hasPrev": boolean
}
```

### **Códigos de Status HTTP**
- `200` - Sucesso
- `201` - Criado
- `400` - Dados inválidos
- `401` - Não autenticado
- `403` - Sem permissão
- `404` - Não encontrado
- `409` - Conflito
- `500` - Erro interno
- `501` - Não implementado

### **Formatos**
- **Datas:** YYYY-MM-DD
- **Timestamps:** ISO 8601
- **Valores:** Decimal 2 casas
- **Telefone:** (XX) XXXXX-XXXX

---

**API Personal Expense Hub - 42 endpoints funcionais**  
**Documentação baseada na implementação real do sistema** 