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

**Validações:**
- Nome: 2-100 caracteres, apenas letras e espaços
- Email: formato válido, único no sistema
- Senha: 8+ caracteres, maiúscula, minúscula, número, especial
- Telefone: formato (XX) XXXXX-XXXX (opcional)

### **2. POST /api/auth/login**
Autentica usuário no sistema.

**Request:**
```json
{
  "email": "joao@example.com",
  "senha": "MinhaSenh@123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso!",
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

### **3. GET /api/auth/me**
Retorna dados do usuário logado.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@example.com",
    "telefone": "(11) 99999-9999",
    "eh_proprietario": true,
    "ativo": true,
    "data_cadastro": "2025-01-24T10:30:00.000Z"
  },
  "timestamp": "2025-01-24T10:30:00.000Z"
}
```

### **4. PUT /api/auth/profile**
Atualiza perfil do usuário logado.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "nome": "João Silva Santos",
  "email": "joao.santos@example.com",
  "telefone": "(11) 88888-8888"
}
```

### **5. PUT /api/auth/change-password**
Altera senha do usuário logado.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "senhaAtual": "MinhaSenh@123",
  "novaSenha": "NovaSenha@456",
  "confirmarSenha": "NovaSenha@456"
}
```

### **6. GET /api/auth/info**
Documentação das rotas de autenticação.

---

## 👥 **PESSOAS (/api/pessoas)** - 6 endpoints

### **1. GET /api/pessoas**
Lista todas as pessoas com filtros e paginação.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `ativo` (boolean): Filtrar por status ativo
- `proprietario` (boolean): Filtrar por proprietário
- `page` (number): Página (padrão: 1)
- `limit` (number): Itens por página (padrão: 20, máx: 100)

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@example.com",
      "telefone": "(11) 99999-9999",
      "eh_proprietario": true,
      "ativo": true,
      "data_cadastro": "2025-01-24T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  },
  "timestamp": "2025-01-24T10:30:00.000Z"
}
```

### **2. POST /api/pessoas**
Cria uma nova pessoa (apenas proprietário).

**Headers:** `Authorization: Bearer <token>`
**Permissão:** Proprietário

**Request:**
```json
{
  "nome": "Maria Santos",
  "email": "maria@example.com",
  "telefone": "(11) 88888-8888",
  "eh_proprietario": false
}
```

### **3. GET /api/pessoas/:id**
Busca detalhes de uma pessoa específica.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "João Silva",
    "email": "joao@example.com",
    "telefone": "(11) 99999-9999",
    "eh_proprietario": true,
    "ativo": true,
    "estatisticas": {
      "total_transacoes": 15,
      "total_gastos": 1500.00,
      "total_pagamentos": 1200.00,
      "saldo_pendente": 300.00
    }
  },
  "timestamp": "2025-01-24T10:30:00.000Z"
}
```

### **4. PUT /api/pessoas/:id**
Atualiza dados de uma pessoa (apenas proprietário).

**Headers:** `Authorization: Bearer <token>`
**Permissão:** Proprietário

### **5. DELETE /api/pessoas/:id**
Desativa uma pessoa (soft delete - apenas proprietário).

**Headers:** `Authorization: Bearer <token>`
**Permissão:** Proprietário

### **6. GET /api/pessoas/info**
Documentação das rotas de pessoas.

---

## 🏷️ **TAGS (/api/tags)** - 6 endpoints

### **1. GET /api/tags**
Lista todas as tags com filtros.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `ativo` (boolean): Filtrar por status ativo
- `criado_por` (number): Filtrar por criador
- `page` (number): Página
- `limit` (number): Itens por página

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nome": "Alimentação",
      "cor": "#FF6B6B",
      "icone": "🍽️",
      "ativo": true,
      "criado_por": 1,
      "criado_em": "2025-01-24T10:30:00.000Z"
    }
  ]
}
```

### **2. POST /api/tags**
Cria uma nova tag.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "nome": "Transporte",
  "cor": "#4ECDC4",
  "icone": "🚗"
}
```

**Validações:**
- Nome: único, 1-50 caracteres
- Cor: formato hexadecimal #RRGGBB
- Ícone: opcional, até 10 caracteres

### **3. GET /api/tags/:id**
Busca detalhes de uma tag com estatísticas.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nome": "Alimentação",
    "cor": "#FF6B6B",
    "icone": "🍽️",
    "estatisticas": {
      "total_transacoes": 25,
      "valor_total": 2500.00,
      "valor_medio": 100.00,
      "ultima_utilizacao": "2025-01-24T10:30:00.000Z"
    }
  }
}
```

### **4. PUT /api/tags/:id**
Atualiza uma tag.

### **5. DELETE /api/tags/:id**
Desativa uma tag (soft delete).

### **6. GET /api/tags/info**
Documentação das rotas de tags.

---

## 💰 **TRANSAÇÕES (/api/transacoes)** - 8 endpoints

### **1. GET /api/transacoes**
Lista transações com filtros avançados.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `tipo` (string): GASTO ou RECEITA
- `status_pagamento` (string): PENDENTE, PAGO_PARCIAL, PAGO_TOTAL
- `data_inicio` (string): Data início (YYYY-MM-DD)
- `data_fim` (string): Data fim (YYYY-MM-DD)
- `pessoa_id` (number): Filtrar por pessoa
- `tag_id` (number): Filtrar por tag
- `eh_parcelado` (boolean): Filtrar parceladas
- `grupo_parcela` (string): Filtrar por grupo
- `page` (number): Página
- `limit` (number): Itens por página

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transacoes": [
      {
        "id": 1,
        "tipo": "GASTO",
        "descricao": "Almoço no restaurante",
        "local": "Restaurante ABC",
        "valor_total": 150.00,
        "data_transacao": "2025-01-24",
        "eh_parcelado": false,
        "status_pagamento": "PENDENTE",
        "proprietario": {
          "id": 1,
          "nome": "João Silva"
        },
        "participantes": [
          {
            "pessoa_id": 1,
            "nome": "João Silva",
            "valor_devido": 75.00,
            "valor_pago": 0.00
          }
        ],
        "tags": [
          {
            "id": 1,
            "nome": "Alimentação",
            "cor": "#FF6B6B"
          }
        ]
      }
    ],
    "paginacao": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    },
    "estatisticas": {
      "total_transacoes": 50,
      "valor_total": 5000.00,
      "valor_medio": 100.00
    }
  }
}
```

### **2. POST /api/transacoes**
Cria um novo gasto (apenas proprietário).

**Headers:** `Authorization: Bearer <token>`
**Permissão:** Proprietário

**Request:**
```json
{
  "descricao": "Jantar em família",
  "local": "Restaurante XYZ",
  "valor_total": 200.00,
  "data_transacao": "2025-01-24",
  "observacoes": "Comemoração aniversário",
  "eh_parcelado": false,
  "total_parcelas": 1,
  "participantes": [
    {
      "pessoa_id": 1,
      "valor_devido": 100.00
    },
    {
      "pessoa_id": 2,
      "valor_devido": 100.00
    }
  ],
  "tags": [1, 2]
}
```

**Validações:**
- Descrição: 3-200 caracteres
- Valor total: deve ser igual à soma dos participantes (±1 centavo)
- Participantes: pelo menos 1, máximo 10
- Tags: máximo 5 tags

### **3. GET /api/transacoes/:id**
Busca detalhes completos de uma transação.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tipo": "GASTO",
    "descricao": "Almoço no restaurante",
    "local": "Restaurante ABC",
    "valor_total": 150.00,
    "data_transacao": "2025-01-24",
    "data_criacao": "2025-01-24T10:30:00.000Z",
    "eh_parcelado": false,
    "observacoes": "Encontro com clientes",
    "status_pagamento": "PENDENTE",
    "proprietario": {
      "id": 1,
      "nome": "João Silva",
      "email": "joao@example.com"
    },
    "participantes": [
      {
        "pessoa_id": 1,
        "nome": "João Silva",
        "valor_devido": 75.00,
        "valor_pago": 0.00,
        "eh_proprietario": true
      },
      {
        "pessoa_id": 2,
        "nome": "Maria Santos",
        "valor_devido": 75.00,
        "valor_pago": 0.00,
        "eh_proprietario": false
      }
    ],
    "tags": [
      {
        "id": 1,
        "nome": "Alimentação",
        "cor": "#FF6B6B",
        "icone": "🍽️"
      }
    ],
    "pagamentos": [],
    "parcelas_relacionadas": []
  }
}
```

### **4. PUT /api/transacoes/:id**
Edita um gasto (campos limitados).

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "descricao": "Almoço no restaurante - atualizado",
  "local": "Restaurante ABC - Centro",
  "observacoes": "Encontro com clientes importantes",
  "tags": [1, 3]
}
```

**Campos editáveis:**
- Descrição
- Local
- Observações
- Tags

**Campos NÃO editáveis:**
- Valor total
- Data da transação
- Participantes
- Tipo (GASTO/RECEITA)

### **5. DELETE /api/transacoes/:id**
Exclui uma transação.

**Headers:** `Authorization: Bearer <token>`

**Restrições:**
- Não pode excluir transações com pagamentos
- Apenas proprietário pode excluir

### **6. POST /api/transacoes/receita**
Cria uma nova receita (apenas proprietário).

**Headers:** `Authorization: Bearer <token>`
**Permissão:** Proprietário

**Request:**
```json
{
  "descricao": "Salário mensal",
  "local": "Empresa XYZ",
  "valor_recebido": 5000.00,
  "data_transacao": "2025-01-24",
  "observacoes": "Salário janeiro 2025",
  "tags": [4]
}
```

### **7. PUT /api/transacoes/receita/:id**
Edita uma receita (apenas proprietário).

**Headers:** `Authorization: Bearer <token>`
**Permissão:** Proprietário

### **8. GET /api/transacoes/info**
Documentação das rotas de transações.

---

## 💳 **PAGAMENTOS (/api/pagamentos)** - 8 endpoints

### **1. GET /api/pagamentos**
Lista pagamentos com filtros.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `pessoa_id` (number): Filtrar por pessoa
- `transacao_id` (number): Filtrar por transação
- `data_inicio` (string): Data início
- `data_fim` (string): Data fim
- `forma_pagamento` (string): PIX, DINHEIRO, etc.
- `tem_excedente` (boolean): Com excedente
- `valor_min` (number): Valor mínimo
- `valor_max` (number): Valor máximo
- `page` (number): Página
- `limit` (number): Itens por página

### **2. POST /api/pagamentos**
Cria pagamento individual ou composto.

**Headers:** `Authorization: Bearer <token>`

**Pagamento Individual:**
```json
{
  "transacao_id": 1,
  "valor_pago": 75.00,
  "data_pagamento": "2025-01-24",
  "forma_pagamento": "PIX",
  "observacoes": "Pagamento via PIX"
}
```

**Pagamento Composto:**
```json
{
  "transacoes": [
    {
      "transacao_id": 1,
      "valor_aplicado": 75.00
    },
    {
      "transacao_id": 2,
      "valor_aplicado": 50.00
    }
  ],
  "data_pagamento": "2025-01-24",
  "forma_pagamento": "PIX",
  "observacoes": "Pagamento múltiplas transações",
  "processar_excedente": true,
  "criar_receita_excedente": true
}
```

### **3. GET /api/pagamentos/:id**
Busca detalhes de um pagamento.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "pessoa_id": 2,
    "valor_total": 125.00,
    "valor_excedente": 0.00,
    "data_pagamento": "2025-01-24",
    "forma_pagamento": "PIX",
    "observacoes": "Pagamento via PIX",
    "pessoa": {
      "id": 2,
      "nome": "Maria Santos"
    },
    "transacoes_pagas": [
      {
        "transacao_id": 1,
        "valor_aplicado": 75.00,
        "transacao": {
          "descricao": "Almoço restaurante",
          "valor_total": 150.00
        }
      }
    ],
    "receita_excedente": null
  }
}
```

### **4. PUT /api/pagamentos/:id**
Atualiza um pagamento.

### **5. DELETE /api/pagamentos/:id**
Exclui um pagamento.

### **6. GET /api/pagamentos/configuracoes/excedente**
Busca configurações de excedente.

### **7. PUT /api/pagamentos/configuracoes/excedente**
Atualiza configurações de excedente (apenas proprietário).

**Request:**
```json
{
  "auto_criar_receita_excedente": true,
  "valor_minimo_excedente": 10.00,
  "descricao_receita_excedente": "Excedente de pagamento"
}
```

### **8. GET /api/pagamentos/info**
Documentação das rotas de pagamentos.

---

## 📊 **RELATÓRIOS (/api/relatorios)** - 6 endpoints

### **1. GET /api/relatorios/dashboard**
Dashboard principal com métricas.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `periodo` (string): mes_atual, mes_anterior, ano_atual
- `data_inicio` (string): Data personalizada início
- `data_fim` (string): Data personalizada fim
- `incluir_graficos` (boolean): Incluir dados para gráficos
- `incluir_comparativo` (boolean): Comparativo período anterior

**Response (200):**
```json
{
  "success": true,
  "data": {
    "resumo": {
      "total_gastos": 5000.00,
      "total_receitas": 8000.00,
      "saldo_periodo": 3000.00,
      "transacoes_pendentes": 15,
      "pessoas_devedoras": 3
    },
    "comparativo": {
      "gastos_variacao": 10.5,
      "receitas_variacao": -5.2,
      "transacoes_variacao": 8
    },
    "graficos": {
      "gastos_por_categoria": [
        {
          "categoria": "Alimentação",
          "valor": 2000.00,
          "percentual": 40.0
        }
      ],
      "evolucao_mensal": [
        {
          "mes": "2025-01",
          "gastos": 5000.00,
          "receitas": 8000.00
        }
      ]
    }
  }
}
```

### **2. GET /api/relatorios/saldos**
Saldos por pessoa.

**Query Parameters:**
- `pessoa_id` (number): Pessoa específica
- `apenas_ativos` (boolean): Apenas pessoas ativas
- `data_inicio` (string): Período início
- `data_fim` (string): Período fim
- `status_saldo` (string): DEVEDOR, CREDOR, QUITADO
- `valor_minimo` (number): Valor mínimo saldo
- `ordenar_por` (string): nome, saldo, transacoes
- `ordem` (string): asc, desc

### **3. GET /api/relatorios/pendencias**
Análise de pendências.

**Query Parameters:**
- `pessoa_id` (number): Pessoa específica
- `valor_minimo` (number): Valor mínimo pendência
- `vencimento_ate` (string): Data limite vencimento
- `urgencia` (string): baixa, media, alta
- `ordenar_por` (string): valor, data, pessoa
- `incluir_historico_pagamentos` (boolean): Incluir histórico

### **4. GET /api/relatorios/transacoes**
Relatório completo de transações.

### **5. GET /api/relatorios/categorias**
Análise por categorias/tags.

**Query Parameters:**
- `data_inicio` (string): Período início
- `data_fim` (string): Período fim
- `tipo` (string): GASTO ou RECEITA
- `tag_ids` (array): IDs das tags
- `metrica` (string): valor, quantidade, media
- `ordenar_por` (string): valor, nome, quantidade
- `limite` (number): Limite de resultados

### **6. GET /api/relatorios/info**
Documentação das rotas de relatórios.

---

## ⚙️ **CONFIGURAÇÕES (/api/configuracoes)** - 4 endpoints

### **1. GET /api/configuracoes/interface**
Busca configurações da interface.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "theme_interface": "blue",
    "temas_disponíveis": {
      "light": {
        "nome": "Claro",
        "descricao": "Tema claro padrão",
        "icone": "Sun"
      },
      "dark": {
        "nome": "Escuro",
        "descricao": "Tema escuro padrão", 
        "icone": "Moon"
      },
      "auto": {
        "nome": "Sistema",
        "descricao": "Segue configuração do sistema",
        "icone": "Computer"
      },
      "blue": {
        "nome": "Azul",
        "descricao": "Tema azul personalizado",
        "icone": "Palette"
      },
      "green": {
        "nome": "Verde",
        "descricao": "Tema verde personalizado",
        "icone": "Palette"
      },
      "purple": {
        "nome": "Roxo", 
        "descricao": "Tema roxo personalizado",
        "icone": "Palette"
      },
      "orange": {
        "nome": "Laranja",
        "descricao": "Tema laranja personalizado",
        "icone": "Palette"
      }
    }
  }
}
```

### **2. PUT /api/configuracoes/interface**
Atualiza configurações da interface (apenas proprietário).

**Headers:** `Authorization: Bearer <token>`
**Permissão:** Proprietário

**Request:**
```json
{
  "theme_interface": "blue"
}
```

**Valores aceitos:** `light`, `dark`, `auto`, `blue`, `green`, `purple`, `orange`

**Response (200):**
```json
{
  "success": true,
  "message": "Tema alterado para \"Azul\" com sucesso!",
  "data": {
    "theme_interface": "blue",
    "temas_disponíveis": { /* objeto completo */ }
  }
}
```

### **3. GET /api/configuracoes/info**
Documentação das rotas de configurações.

### **4. Endpoints Futuros (501 Not Implemented)**
- `GET /api/configuracoes/comportamento`
- `GET /api/configuracoes/alertas`
- `GET /api/configuracoes/relatorios`

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
- `409` - Conflito (email duplicado)
- `500` - Erro interno
- `501` - Não implementado

### **Formatos de Data**
- **Datas:** YYYY-MM-DD
- **Timestamps:** ISO 8601 (2025-01-24T10:30:00.000Z)

### **Valores Monetários**
- **Formato:** Decimal com 2 casas decimais
- **Exemplo:** 1234.56

### **Soft Delete**
- **Campo:** `ativo: boolean`
- **Comportamento:** false = desativado, true = ativo

---

**API Personal Expense Hub - 42 endpoints funcionais**  
**Documentação baseada na implementação real do sistema** 