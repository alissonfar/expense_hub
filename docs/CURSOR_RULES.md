# 🎯 CURSOR AI RULES - PERSONAL EXPENSE HUB

**Regras específicas para desenvolvimento com Cursor AI**  
**Baseadas nos padrões reais implementados no projeto**  
**Última atualização:** Janeiro 2025

## 🚨 **REGRAS CRÍTICAS - NUNCA IGNORAR**

### **1. DESCOBERTA OBRIGATÓRIA ANTES DE QUALQUER CÓDIGO**

```bash
# SEQUÊNCIA OBRIGATÓRIA - SEMPRE EXECUTAR
@codebase                 # Análise geral do projeto
@routes                   # Descobrir endpoints existentes  
@controllers              # Analisar padrões de controller
@schemas                  # Verificar validações existentes
@prisma/schema.prisma     # Estrutura atual do banco
@middleware               # Verificar middlewares disponíveis
@types                    # Verificar tipos disponíveis
@utils                    # Verificar utilitários disponíveis
@docs                     # Consultar documentação existente
```

### **2. PERGUNTAS OBRIGATÓRIAS**

Antes de implementar QUALQUER funcionalidade, SEMPRE responder:

1. **"O que já existe relacionado a isso no @codebase?"**
2. **"Como implementações similares são feitas em @controllers?"**
3. **"Que validações existem em @schemas?"**
4. **"Que middlewares estão disponíveis em @middleware?"**
5. **"Como está a estrutura atual em @prisma/schema.prisma?"**

### **3. NUNCA ASSUMIR - SEMPRE DESCOBRIR**

❌ **PROIBIDO:**
- Criar código baseado em suposições
- Assumir estrutura sem verificar
- Ignorar padrões existentes
- Reinventar funcionalidades que já existem

✅ **OBRIGATÓRIO:**
- Usar comandos de descoberta primeiro
- Seguir padrões encontrados no código
- Reutilizar componentes existentes
- Manter consistência arquitetural

---

## 🏗️ **PADRÕES ARQUITETURAIS OBRIGATÓRIOS**

### **Stack Tecnológica Fixa**
```typescript
// Backend - NÃO ALTERAR
{
  "express": "4.21.1",           // Framework web
  "typescript": "5.7.2",         // Linguagem tipada
  "@prisma/client": "6.10.1",    // ORM
  "jsonwebtoken": "8.5.1",       // Autenticação JWT
  "bcrypt": "6.0.0",             // Hash de senhas
  "zod": "3.25.67",              // Validação
  "helmet": "^8.0.0",            // Segurança HTTP
  "cors": "^2.8.5",              // Cross-Origin
  "express-rate-limit": "^7.4.1" // Rate limiting
}

// Frontend - NÃO ALTERAR
{
  "next": "14.2.18",             // Framework React
  "react": "^18",                // UI Library
  "typescript": "^5",            // Linguagem tipada
  "tailwindcss": "^3.4.1",      // CSS Framework
  "@radix-ui/react-*": "*",     // Componentes base
  "lucide-react": "^0.462.0",   // Ícones
  "recharts": "^2.13.3"         // Gráficos
}
```

### **Padrão de Controller OBRIGATÓRIO**

```typescript
export const nomeController = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Log de entrada OBRIGATÓRIO
    console.log(`[${nomeController.name}] Iniciando operação`, { 
      user_id: req.user?.user_id,
      params: req.params 
    });

    // 2. Validação de usuário (já injetado via middleware)
    const user = req.user;
    
    // 3. Validação de permissões (se necessário)
    if (!user.eh_proprietario) {
      res.status(403).json({
        error: 'Acesso negado',
        message: 'Apenas proprietários podem acessar este recurso',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // 4. Dados validados (via middleware validateSchema)
    const validatedData = req.body;
    
    // 5. Log antes da query OBRIGATÓRIO
    console.log(`[${nomeController.name}] Executando operação no banco`, { 
      operation: 'create/update/delete',
      data: validatedData 
    });
    
    // 6. Operação Prisma com relacionamentos
    const result = await req.prisma.tabela.operacao({
      data: validatedData,
      include: { relacionamentos: true }
    });
    
    // 7. Log de sucesso OBRIGATÓRIO
    console.log(`[${nomeController.name}] Operação concluída`, { 
      result_id: result.id 
    });
    
    // 8. Response padronizada OBRIGATÓRIA
    res.status(200).json({
      success: true,
      message: 'Operação realizada com sucesso',
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // 9. Log de erro OBRIGATÓRIO
    console.error(`[${nomeController.name}] Erro na operação:`, error);
    
    // 10. Response de erro padronizada OBRIGATÓRIA
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível completar a operação',
      timestamp: new Date().toISOString()
    });
  }
};
```

### **Padrão de Rota OBRIGATÓRIO**

```typescript
import { Router } from 'express';
import { requireAuth, requireOwner, validateSchema } from '../middleware/auth';
import { schemaValidacao } from '../schemas/modulo';
import * as controller from '../controllers/moduloController';

const router = Router();

// Sequência de middlewares OBRIGATÓRIA
router.post('/endpoint',
  requireAuth,              // 1. Autenticação JWT
  requireOwner,             // 2. Permissões (se necessário)
  validateSchema(schema),   // 3. Validação Zod
  controller.funcao         // 4. Controller
);

// Rota /info OBRIGATÓRIA em todos os módulos
router.get('/info', (req, res) => {
  res.json({
    message: '📋 Sistema de [Módulo] - Personal Expense Hub',
    version: '1.0.0',
    status: 'Operacional',
    endpoints: {
      // Documentação completa dos endpoints
    }
  });
});

export default router;
```

### **Padrão de Schema Zod OBRIGATÓRIO**

```typescript
import { z } from 'zod';

// Mensagens em PORTUGUÊS BRASILEIRO - OBRIGATÓRIO
export const criarSchema = z.object({
  campo_obrigatorio: z
    .string()
    .min(2, 'Campo deve ter pelo menos 2 caracteres')
    .max(100, 'Campo deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Campo deve conter apenas letras e espaços'),
  
  email: z
    .string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .toLowerCase()
    .transform(email => email.trim()),
  
  telefone: z
    .string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX')
    .optional()
    .or(z.literal('')),
    
  valor: z
    .number()
    .positive('Valor deve ser positivo')
    .max(999999.99, 'Valor máximo excedido')
    .multipleOf(0.01, 'Valor deve ter no máximo 2 casas decimais')
});

// Schema de atualização (partial) OBRIGATÓRIO
export const atualizarSchema = criarSchema.partial();

// Schema de parâmetros OBRIGATÓRIO
export const paramsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID deve ser um número')
    .transform(id => parseInt(id))
});

// Tipos inferidos OBRIGATÓRIOS
export type CriarInput = z.infer<typeof criarSchema>;
export type AtualizarInput = z.infer<typeof atualizarSchema>;
export type ParamsInput = z.infer<typeof paramsSchema>;
```

---

## 🔐 **SISTEMA DE AUTENTICAÇÃO OBRIGATÓRIO**

### **JWT Payload Fixo**
```typescript
interface JWTPayload {
  user_id: number;
  email: string;
  nome: string;
  eh_proprietario: boolean;
  iat: number;
  exp: number;
}
```

### **Middlewares de Segurança**
```typescript
// Sequência OBRIGATÓRIA em rotas protegidas
requireAuth       // 1. Verificar JWT
requireOwner      // 2. Verificar proprietário (se necessário)
validateSchema    // 3. Validar dados Zod
controller        // 4. Executar lógica
```

---

## 🗄️ **PADRÕES DE BANCO OBRIGATÓRIOS**

### **Conversão Decimal OBRIGATÓRIA**
```typescript
// SEMPRE converter Decimal para Number no backend
const resultado = await prisma.tabela.findMany({...});

const resultadoFormatado = resultado.map(item => ({
  ...item,
  valor_total: Number(item.valor_total),      // OBRIGATÓRIO
  valor_parcela: Number(item.valor_parcela)   // OBRIGATÓRIO
}));
```

### **Queries Otimizadas OBRIGATÓRIAS**
```typescript
// SEMPRE usar include/select específicos
const resultado = await prisma.tabela.findMany({
  where: { ativo: true },
  include: {
    relacionamento1: true,
    relacionamento2: {
      select: {
        id: true,
        nome: true
        // Apenas campos necessários
      }
    }
  },
  orderBy: { criado_em: 'desc' },
  skip: (page - 1) * limit,
  take: limit
});
```

---

## 📝 **LOGS ESTRATÉGICOS OBRIGATÓRIOS**

### **Pontos de Log OBRIGATÓRIOS**
```typescript
// 1. Entrada de função
console.log(`[${funcaoName}] Iniciando operação`, { params });

// 2. Antes de query no banco
console.log(`[${funcaoName}] Executando query`, { query });

// 3. Sucesso da operação
console.log(`[${funcaoName}] Operação concluída`, { result });

// 4. Erros e exceções
console.error(`[${funcaoName}] Erro na operação`, { error, context });
```

### **Formato de Log OBRIGATÓRIO**
```typescript
console.log(`[${FunctionName}] Mensagem descritiva`, { 
  contextObject: 'dados relevantes'
});
```

---

## 🧹 **LIMPEZA PÓS-CORREÇÃO (CRÍTICO)**

### **APÓS CORRIGIR QUALQUER BUG - OBRIGATÓRIO:**

```typescript
// 1. PROCURAR E REMOVER:
const lixoParaRemover = [
  'console.log de debug temporários',
  'código comentado de tentativas',
  'variáveis não utilizadas',
  'imports desnecessários',
  'funções experimentais',
  'arquivos temporários'
];

// 2. CHECKLIST OBRIGATÓRIO:
const checklist = [
  '[ ] Remover console.log de debug',
  '[ ] Apagar código comentado',
  '[ ] Verificar imports não utilizados',
  '[ ] Remover variáveis não usadas',
  '[ ] Limpar funções experimentais',
  '[ ] Confirmar logs necessários apenas'
];

// 3. MANTER APENAS:
const manter = [
  'Logs estratégicos permanentes',
  'Código funcional necessário',
  'Comentários explicativos relevantes'
];
```

---

## ✅ **VALIDAÇÃO FINAL OBRIGATÓRIA**

### **CHECKLIST ANTES DE FINALIZAR QUALQUER IMPLEMENTAÇÃO**

```typescript
const checklistFinal = [
  // Funcionalidade
  '[ ] Testei se funciona completamente?',
  
  // Consistência  
  '[ ] Segue padrões do @codebase?',
  '[ ] Usa middlewares corretos?',
  '[ ] Mantém estrutura de response?',
  
  // Validação
  '[ ] Schemas Zod em português?',
  '[ ] Tipos TypeScript corretos?',
  
  // Logs
  '[ ] Logs estratégicos adicionados?',
  '[ ] Removido logs de debug?',
  
  // Segurança
  '[ ] Autenticação aplicada?',
  '[ ] Permissões verificadas?',
  
  // Limpeza
  '[ ] Código experimental removido?',
  '[ ] Imports desnecessários removidos?',
  
  // Documentação
  '[ ] docs/ atualizada se necessário?'
];
```

---

## 🚨 **REGRAS ESPECÍFICAS DO PROJETO**

### **Sistema de Proprietário**
- **SEMPRE** verificar `eh_proprietario` para operações sensíveis
- **NUNCA** permitir múltiplos proprietários
- **Primeiro usuário** = proprietário automático

### **Valores Monetários**
- **SEMPRE** usar `Decimal` no Prisma
- **SEMPRE** converter para `Number` no response
- **SEMPRE** validar com 2 casas decimais máximo
- **FORMATO:** `999999.99` (máximo R$ 999.999,99)

### **Validações Específicas**
```typescript
// Senha OBRIGATÓRIA
senha: z.string()
  .min(8, 'Senha deve ter pelo menos 8 caracteres')
  .regex(/[a-z]/, 'Deve conter minúscula')
  .regex(/[A-Z]/, 'Deve conter maiúscula')
  .regex(/\d/, 'Deve conter número')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Deve conter especial')

// Telefone brasileiro OBRIGATÓRIO
telefone: z.string()
  .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato: (XX) XXXXX-XXXX')

// Cor hexadecimal OBRIGATÓRIA
cor: z.string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Formato: #RRGGBB')
```

### **Soft Delete OBRIGATÓRIO**
- **NUNCA** deletar fisicamente
- **SEMPRE** usar `ativo: false`
- **SEMPRE** filtrar por `ativo: true` em queries

### **Paginação OBRIGATÓRIA**
```typescript
// Em todas as listagens
const paginacao = {
  page: parseInt(page) || 1,
  limit: Math.min(parseInt(limit) || 20, 100),
  total: count,
  totalPages: Math.ceil(count / limit),
  hasNext: page < Math.ceil(count / limit),
  hasPrev: page > 1
};
```

---

## 🔧 **COMANDOS ESPECÍFICOS WINDOWS**

### **Scripts Batch OBRIGATÓRIOS**
```batch
# Desenvolvimento
start-dev.bat     # Iniciar backend + frontend
stop-dev.bat      # Parar todos os processos
reset-dev.bat     # Reset completo com limpeza
```

### **Verificação de Processos**
```batch
# SEMPRE verificar antes de iniciar
tasklist | findstr "node.exe"
tasklist | findstr "postgres"
```

---

## 📚 **DOCUMENTAÇÃO OBRIGATÓRIA**

### **Após QUALQUER implementação significativa:**

1. **Atualizar docs/ relevantes:**
   - `docs/API.md` - Se criou/modificou endpoints
   - `docs/ARCHITECTURE.md` - Se mudou estrutura
   - `docs/DECISIONS.md` - Se tomou decisão importante
   - `docs/TROUBLESHOOTING.md` - Se resolveu problema

2. **Formato de documentação:**
```markdown
## [Funcionalidade]
**Criado em:** [data]
**Arquivos modificados:** [lista]
**Impactos:** [outras partes afetadas]
**Testes sugeridos:** [como verificar]
```

---

## ⚠️ **AVISOS CRÍTICOS**

### **NUNCA FAZER - PROIBIDO:**
❌ Criar código sem @codebase primeiro  
❌ Assumir estrutura sem verificar @routes/@schemas  
❌ Deixar console.log de debug no código final  
❌ Ignorar padrões de middleware existentes  
❌ Criar validações sem usar Zod  
❌ Não documentar mudanças importantes  
❌ Quebrar estrutura de response padronizada  
❌ Modificar stack tecnológica sem aprovação  

### **SEMPRE FAZER - OBRIGATÓRIO:**
✅ Usar comandos de descoberta primeiro  
✅ Seguir padrões descobertos rigorosamente  
✅ Adicionar logs estratégicos apropriados  
✅ Limpar código experimental após correções  
✅ Testar funcionamento antes de finalizar  
✅ Atualizar documentação quando relevante  
✅ Manter consistência arquitetural  
✅ Validar com Zod em português brasileiro  

---

**ESTAS REGRAS SÃO BASEADAS NO CÓDIGO REAL DO PERSONAL EXPENSE HUB.**  
**SEGUIR RIGOROSAMENTE PARA MANTER QUALIDADE E CONSISTÊNCIA.**  
**QUALQUER DESVIO DEVE SER JUSTIFICADO E DOCUMENTADO.** 