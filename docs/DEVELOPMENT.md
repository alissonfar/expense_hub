# 🛠️ GUIA DE DESENVOLVIMENTO - PERSONAL EXPENSE HUB

**Guia completo para desenvolvimento com Cursor AI**  
**Baseado nos padrões reais implementados**  
**Última atualização:** Janeiro 2025

## 🎯 **FLUXO OBRIGATÓRIO PARA CURSOR AI**

### **COMANDOS OBRIGATÓRIOS ANTES DE CRIAR CÓDIGO**

```bash
# 1. ANÁLISE GERAL DO PROJETO
@codebase 

# 2. DESCOBRIR ENDPOINTS EXISTENTES  
@routes

# 3. ANALISAR PADRÕES DE CONTROLLER
@controllers

# 4. VERIFICAR VALIDAÇÕES EXISTENTES
@schemas

# 5. ESTRUTURA ATUAL DO BANCO
@prisma/schema.prisma

# 6. VERIFICAR MIDDLEWARES DISPONÍVEIS
@middleware

# 7. VERIFICAR TIPOS DISPONÍVEIS
@types

# 8. VERIFICAR UTILITÁRIOS DISPONÍVEIS
@utils

# 9. CONSULTAR DOCUMENTAÇÃO EXISTENTE
@docs
```

### **PERGUNTAS OBRIGATÓRIAS ANTES DE IMPLEMENTAR**

1. **"O que já existe relacionado a isso no @codebase?"**
2. **"Como implementações similares são feitas em @controllers?"**
3. **"Que validações existem em @schemas?"**
4. **"Que middlewares estão disponíveis em @middleware?"**
5. **"Como está a estrutura atual em @prisma/schema.prisma?"**

### **NUNCA ASSUMIR - SEMPRE DESCOBRIR**

❌ **Errado:**
- "Vou criar baseado no que imagino que existe"
- "Provavelmente tem X endpoints"  
- "Deve ter essas tabelas no banco"

✅ **Correto:**
- "Vou usar @codebase para ver como está implementado"
- "Vou verificar @routes para ver endpoints existentes"
- "Vou checar @prisma/schema.prisma para ver estrutura atual"

---

## 🏗️ **PADRÕES DE DESENVOLVIMENTO IMPLEMENTADOS**

### **Estrutura de Controller Descoberta**

```typescript
// Padrão seguido em TODOS os controllers
export const nomeController = async (req: Request, res: Response): Promise<void> => {
  try {
    // 1. Log de entrada (estratégico)
    console.log(`[${nomeController}] Iniciando operação`, { 
      user_id: req.user?.user_id,
      params: req.params 
    });

    // 2. Validação de usuário (injetado via middleware)
    const user = req.user; // requireAuth já validou
    
    // 3. Validação de permissões (se necessário)
    if (!user.eh_proprietario) {
      res.status(403).json({
        error: 'Acesso negado',
        message: 'Apenas proprietários podem acessar este recurso',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // 4. Dados já validados pelo middleware validateSchema
    const validatedData = req.body;
    
    // 5. Log antes da query
    console.log(`[${nomeController}] Executando operação no banco`, { 
      operation: 'create/update/delete',
      data: validatedData 
    });
    
    // 6. Operação no banco com Prisma
    const result = await req.prisma.tabela.operacao({
      data: validatedData,
      include: {
        relacionamentos: true
      }
    });
    
    // 7. Log de sucesso
    console.log(`[${nomeController}] Operação concluída com sucesso`, { 
      result_id: result.id 
    });
    
    // 8. Resposta padronizada
    res.status(200).json({
      success: true,
      message: 'Operação realizada com sucesso',
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    // 9. Log de erro
    console.error(`[${nomeController}] Erro na operação:`, error);
    
    // 10. Resposta de erro padronizada
    res.status(500).json({
      error: 'Erro interno do servidor',
      message: 'Não foi possível completar a operação',
      timestamp: new Date().toISOString()
    });
  }
};
```

### **Estrutura de Rota Descoberta**

```typescript
// Padrão seguido em TODAS as rotas
import { Router } from 'express';
import { requireAuth, requireOwner, validateSchema } from '../middleware/auth';
import { schemaValidacao } from '../schemas/modulo';
import * as controller from '../controllers/moduloController';

const router = Router();

// Sequência OBRIGATÓRIA de middlewares
router.post('/endpoint',
  requireAuth,              // 1. Autenticação JWT
  requireOwner,             // 2. Permissões (se necessário)
  validateSchema(schema),   // 3. Validação Zod
  controller.funcao         // 4. Controller
);

// Rota de documentação OBRIGATÓRIA
router.get('/info', (req, res) => {
  res.json({
    message: '📋 Sistema de [Módulo] - Personal Expense Hub',
    version: '1.0.0',
    status: 'Operacional',
    endpoints: {
      // Documentação de todos os endpoints
    }
  });
});

export default router;
```

### **Estrutura de Schema Zod Descoberta**

```typescript
// Padrão seguido em TODOS os schemas
import { z } from 'zod';

// Schema principal
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

// Schema de atualização (campos opcionais)
export const atualizarSchema = criarSchema.partial();

// Schema de parâmetros
export const paramsSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID deve ser um número')
    .transform(id => parseInt(id))
});

// Tipos inferidos
export type CriarInput = z.infer<typeof criarSchema>;
export type AtualizarInput = z.infer<typeof atualizarSchema>;
export type ParamsInput = z.infer<typeof paramsSchema>;
```

### **Padrões de Validação Específicos**

```typescript
// Validações específicas descobertas no projeto
const validacoesPadrao = {
  // Senha forte
  senha: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[a-z]/, 'Senha deve conter pelo menos uma letra minúscula')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos uma letra maiúscula')
    .regex(/\d/, 'Senha deve conter pelo menos um número')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Senha deve conter pelo menos um caractere especial'),
  
  // Telefone brasileiro
  telefone: z
    .string()
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Telefone deve estar no formato (XX) XXXXX-XXXX'),
  
  // Cor hexadecimal
  cor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato #RRGGBB'),
  
  // Data no formato brasileiro
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD'),
  
  // Valor monetário
  valor_monetario: z
    .number()
    .positive('Valor deve ser positivo')
    .max(999999.99, 'Valor máximo de R$ 999.999,99')
    .multipleOf(0.01, 'Valor deve ter no máximo 2 casas decimais')
};
```

---

## 🔐 **PADRÕES DE AUTENTICAÇÃO E SEGURANÇA**

### **Sistema JWT Implementado**

```typescript
// Payload padrão descoberto
interface JWTPayload {
  user_id: number;
  email: string;
  nome: string;
  eh_proprietario: boolean;
  iat: number;
  exp: number;
}

// Geração de token (utils/jwt.ts)
export const generateToken = (user: AuthUser): string => {
  return jwt.sign(
    {
      user_id: user.id,
      email: user.email,
      nome: user.nome,
      eh_proprietario: user.eh_proprietario
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

// Verificação de token
export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
};
```

### **Middlewares de Segurança**

```typescript
// Middleware de autenticação (middleware/auth.ts)
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({
        error: 'Token não fornecido',
        message: 'Acesso negado. Token de autenticação é obrigatório.',
        timestamp: new Date().toISOString()
      });
    }
    
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'Token inválido',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Middleware de proprietário
export const requireOwner = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.eh_proprietario) {
    return res.status(403).json({
      error: 'Acesso negado',
      message: 'Apenas proprietários podem acessar este recurso',
      timestamp: new Date().toISOString()
    });
  }
  next();
};
```

---

## 🗄️ **PADRÕES DE BANCO DE DADOS**

### **Estrutura Prisma Descoberta**

```prisma
// Padrão seguido em todas as tabelas
model nome_tabela {
  // Chave primária
  id              Int      @id @default(autoincrement())
  
  // Campos obrigatórios
  campo_obrigatorio String @db.VarChar(100)
  
  // Campos opcionais
  campo_opcional  String? @db.VarChar(150)
  
  // Valores monetários
  valor           Decimal @db.Decimal(10, 2)
  
  // Booleanos com padrão
  ativo           Boolean? @default(true)
  
  // Timestamps automáticos
  criado_em       DateTime? @default(now()) @db.Timestamptz(6)
  atualizado_em   DateTime? @default(now()) @db.Timestamptz(6)
  
  // Relacionamentos
  pessoa_id       Int
  pessoa          pessoas @relation(fields: [pessoa_id], references: [id])
  
  // Índices para performance
  @@index([campo_frequente])
  @@index([campo1, campo2])
}
```

### **Queries Otimizadas Descobertas**

```typescript
// Padrão de queries com relacionamentos
const resultado = await prisma.tabela.findMany({
  where: {
    ativo: true,
    // Filtros específicos
  },
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
  orderBy: {
    criado_em: 'desc'
  },
  skip: (page - 1) * limit,
  take: limit
});

// Conversão de valores Decimal para Number
const resultadoFormatado = resultado.map(item => ({
  ...item,
  valor_total: Number(item.valor_total),
  valor_parcela: Number(item.valor_parcela)
}));
```

---

## 📝 **LOGS ESTRATÉGICOS IMPLEMENTADOS**

### **Padrão de Logs Descoberto**

```typescript
// Logs em pontos estratégicos
const funcaoController = async (req: Request, res: Response) => {
  try {
    // 1. Log de entrada
    console.log(`[${funcaoController.name}] Iniciando operação`, {
      user_id: req.user?.user_id,
      params: req.params,
      query: req.query
    });

    // 2. Log antes de query importante
    console.log(`[${funcaoController.name}] Executando query no banco`, {
      operation: 'findMany',
      filters: filtros
    });

    // Operação...

    // 3. Log de sucesso
    console.log(`[${funcaoController.name}] Operação concluída`, {
      result_count: resultado.length,
      execution_time: Date.now() - startTime
    });

  } catch (error) {
    // 4. Log de erro
    console.error(`[${funcaoController.name}] Erro na operação:`, {
      error: error.message,
      stack: error.stack,
      user_id: req.user?.user_id,
      params: req.params
    });
  }
};
```

### **Níveis de Log**

```typescript
const logLevels = {
  error: 'Erros e exceções',
  warn: 'Avisos importantes',
  info: 'Informações gerais de operações',
  debug: 'Detalhes para debugging (apenas desenvolvimento)'
};
```

---

## 🧹 **LIMPEZA PÓS-CORREÇÃO (CRÍTICO)**

### **CHECKLIST OBRIGATÓRIO APÓS CORREÇÕES**

```typescript
// ⚠️ APÓS CONFIRMAR QUE UM BUG FOI CORRIGIDO:

// 1. PROCURAR E REMOVER "LIXO":
const lixoParaRemover = [
  'console.log de debug temporários',
  'código comentado de tentativas que não funcionaram',
  'variáveis não utilizadas',
  'imports desnecessários',
  'funções experimentais que não são mais usadas',
  'arquivos temporários criados para testes'
];

// 2. CHECKLIST DE LIMPEZA:
const checklistLimpeza = [
  '[ ] Remover todos os console.log de debug',
  '[ ] Apagar código comentado',
  '[ ] Verificar imports não utilizados',
  '[ ] Remover variáveis declaradas mas não usadas',
  '[ ] Limpar funções experimentais',
  '[ ] Verificar se todos os logs são realmente necessários',
  '[ ] Confirmar que não há duplicação de código'
];

// 3. MANTER APENAS:
const manterApenas = [
  'Logs estratégicos permanentes (error, warn, info)',
  'Código funcional e necessário',
  'Comentários explicativos relevantes'
];
```

---

## ✅ **VALIDAÇÃO FINAL OBRIGATÓRIA**

### **CHECKLIST ANTES DE ENTREGAR SOLUÇÃO**

```typescript
const checklistFinal = [
  // Funcionalidade
  '[ ] Testei se realmente funciona?',
  
  // Consistência
  '[ ] Segue padrões descobertos no @codebase?',
  
  // Logs
  '[ ] Adicionei logs estratégicos apropriados?',
  
  // Validação
  '[ ] Usei schemas Zod com mensagens em português?',
  
  // Segurança
  '[ ] Apliquei middlewares de auth necessários?',
  
  // Tipos
  '[ ] TypeScript está tipado corretamente?',
  
  // Limpeza
  '[ ] Removi todo código experimental/debug?',
  
  // Documentação
  '[ ] Atualizei documentação relevante em docs/?'
];
```

### **DOCUMENTAÇÃO AUTOMÁTICA OBRIGATÓRIA**

```typescript
// Sempre documentar mudanças
const documentacaoObrigatoria = {
  mudancas: 'Explicar MUDANÇAS feitas no código existente',
  arquivos: 'Listar ARQUIVOS criados/modificados',
  impactos: 'Destacar IMPACTOS em outras partes do sistema',
  testes: 'Sugerir TESTES que devem ser feitos',
  docs: 'ATUALIZAR docs/ relevantes com nova implementação'
};
```

---

## 🔧 **COMANDOS DE DESENVOLVIMENTO**

### **Scripts Disponíveis**

```bash
# Backend
cd backend
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run setup-db     # Configurar banco
npm run test         # Testes (quando implementado)

# Frontend
cd frontend
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run lint         # Linting

# Scripts do projeto
start-dev.bat        # Iniciar tudo (Windows)
stop-dev.bat         # Parar tudo
reset-dev.bat        # Reset completo
```

### **Estrutura de Desenvolvimento**

```bash
# Fluxo de desenvolvimento típico
1. git pull origin main
2. @codebase # Analisar estado atual
3. Implementar seguindo padrões
4. Testar funcionamento
5. Limpar código experimental
6. Atualizar documentação
7. git add . && git commit -m "feat: descrição"
8. git push origin branch
```

---

## 🚨 **REGRAS CRÍTICAS**

### **NUNCA FAZER**

❌ **Criar código sem usar @codebase primeiro**
❌ **Assumir estrutura sem verificar @routes/@schemas**
❌ **Deixar console.log de debug no código final**
❌ **Ignorar padrões de middleware existentes**
❌ **Criar validações sem usar Zod**
❌ **Não documentar mudanças importantes**

### **SEMPRE FAZER**

✅ **Usar comandos de descoberta (@codebase, @routes, etc.)**
✅ **Seguir padrões de controller/route/schema descobertos**
✅ **Adicionar logs estratégicos apropriados**
✅ **Limpar código experimental após correções**
✅ **Atualizar documentação em docs/ quando relevante**
✅ **Testar funcionamento antes de finalizar**

---

**Este guia reflete os padrões REAIS implementados no Personal Expense Hub.**  
**Siga rigorosamente para manter a consistência e qualidade do código.** 