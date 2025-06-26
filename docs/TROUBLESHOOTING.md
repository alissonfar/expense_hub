# 🔧 TROUBLESHOOTING - PERSONAL EXPENSE HUB

**Guia de soluções para problemas técnicos**  
**Baseado em problemas reais encontrados e resolvidos**  
**Última atualização:** Janeiro 2025

---

## 🐛 **PROBLEMAS RESOLVIDOS**

### **1. PROBLEMA: Valores Monetários Exibindo R$ 0,00**

#### **Sintomas:**
- Console: `[formatCurrency] Valor inválido recebido: 100`
- Interface mostrando R$ 0,00 em vez dos valores corretos
- Warnings repetidos no console durante renderização

#### **Causa Raiz:**
O Prisma ORM retorna campos `DECIMAL` do PostgreSQL como objetos `Decimal` em vez de números primitivos JavaScript.

#### **Solução Backend:**
```typescript
// ✅ Conversão automática em controllers
res.json({
  data: {
    ...transacao,
    valor_total: Number(transacao.valor_total), // Decimal → Number
    valor_parcela: Number(transacao.valor_parcela),
    transacao_participantes: transacao.transacao_participantes.map((p: any) => ({
      ...p,
      valor_devido: Number(p.valor_devido),
      valor_recebido: Number(p.valor_recebido),
      valor_pago: Number(p.valor_pago)
    }))
  }
});
```

#### **Solução Frontend:**
```typescript
// ✅ formatCurrency robusta
export function formatCurrency(value: number | string | any): string {
  let numericValue: number;
  
  if (typeof value === 'string') {
    numericValue = parseFloat(value);
  } else if (typeof value === 'number') {
    numericValue = value;
  } else if (value && typeof value === 'object' && 'toNumber' in value) {
    numericValue = value.toNumber(); // Para objetos Decimal
  } else {
    return 'R$ 0,00'
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(numericValue)
}
```

---

### **2. PROBLEMA: Erros TypeScript no Frontend**

#### **Correções Implementadas:**

##### **Null Safety:**
```typescript
// ❌ Antes (erro)
user.nome.toUpperCase()

// ✅ Depois (correto)
user?.nome?.toUpperCase() ?? 'Usuário'
```

##### **Tipos de Props:**
```typescript
// ❌ Antes (erro)
interface ComponentProps {
  data: any;
}

// ✅ Depois (correto)
interface ComponentProps {
  data: {
    id: number;
    nome: string;
    valor?: number;
  };
}
```

##### **Handlers de Eventos:**
```typescript
// ❌ Antes (erro)
const handleClick = (e) => { }

// ✅ Depois (correto)
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => { }
```

---

### **3. PROBLEMA: Imports Incorretos de Componentes**

#### **Sintomas:**
- Erro: `Module not found: Can't resolve AlertDialog`
- Componentes Shadcn/ui não encontrados

#### **Solução:**
```typescript
// ❌ Antes (incorreto)
import { AlertDialog } from '@/components/ui/alert-dialog'

// ✅ Depois (correto)
import { Dialog } from '@/components/ui/dialog'

// Mapeamento correto dos componentes:
AlertDialog → Dialog
AlertDialogContent → DialogContent
AlertDialogHeader → DialogHeader
AlertDialogTitle → DialogTitle
```

---

### **4. PROBLEMA: Cache Next.js Corrompido**

#### **Sintomas:**
- Páginas retornando 404 inexplicavelmente
- Componentes não carregando
- Erros de compilação intermitentes

#### **Solução Completa:**
```bash
# 1. Parar todos os processos
taskkill /f /im node.exe

# 2. Limpar cache Next.js
cd frontend
rm -rf .next
rm -rf node_modules/.cache

# 3. Reinstalar dependências
npm install

# 4. Reiniciar em modo limpo
npm run dev
```

---

### **5. PROBLEMA: Conflitos de Porta**

#### **Sintomas:**
- Erro: `Error: listen EADDRINUSE: address already in use :::3000`
- Aplicação não inicia

#### **Solução:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /f /pid <PID>

# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Ou usar portas alternativas
# Backend: PORT=3002 npm run dev
# Frontend: npm run dev -- -p 3001
```

---

### **6. PROBLEMA: Variáveis de Ambiente**

#### **Sintomas:**
- Erro de conexão com banco
- JWT secrets não definidos
- API_URL não encontrada

#### **Solução Backend (.env):**
```env
# PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/expense_hub_db"

# JWT
JWT_SECRET="seu_jwt_secret_super_seguro_aqui"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

#### **Solução Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 🗃️ **PROBLEMAS DE BANCO DE DADOS**

### **7. PROBLEMA: Erro de Conexão PostgreSQL**

#### **Sintomas:**
- `Error: connect ECONNREFUSED 127.0.0.1:5432`
- Prisma não consegue conectar

#### **Soluções:**

##### **1. Verificar se PostgreSQL está rodando:**
```bash
# Windows
sc query postgresql

# Linux
sudo systemctl status postgresql

# Mac
brew services list | grep postgresql
```

##### **2. Verificar credenciais:**
```bash
# Testar conexão manual
psql -h localhost -p 5432 -U username -d expense_hub_db
```

##### **3. Criar banco se não existir:**
```bash
cd backend
npm run setup-db
```

---

### **8. PROBLEMA: Migrations Prisma**

#### **Sintomas:**
- Erro ao executar migrations
- Schema desatualizado

#### **Solução:**
```bash
cd backend

# Reset completo (CUIDADO: apaga dados)
npx prisma migrate reset

# Aplicar migrations pendentes
npx prisma migrate deploy

# Gerar client atualizado
npx prisma generate
```

---

## 🔐 **PROBLEMAS DE AUTENTICAÇÃO**

### **9. PROBLEMA: Token JWT Expirado**

#### **Sintomas:**
- Status 401 em requisições autenticadas
- Logout automático inesperado

#### **Solução Frontend:**
```typescript
// Interceptor automático de renovação
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Limpar token expirado
      localStorage.removeItem('token');
      
      // Redirecionar para login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### **Solução Backend:**
```typescript
// Verificar configuração JWT
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET não definido');
}
```

---

### **10. PROBLEMA: Permissões de Proprietário**

#### **Sintomas:**
- Status 403 para operações de proprietário
- Usuário não reconhecido como proprietário

#### **Verificação:**
```sql
-- Verificar no banco
SELECT id, nome, email, eh_proprietario 
FROM pessoas 
WHERE eh_proprietario = true;

-- Definir proprietário manualmente se necessário
UPDATE pessoas 
SET eh_proprietario = true 
WHERE email = 'admin@teste.com';
```

---

## 📡 **PROBLEMAS DE API**

### **11. PROBLEMA: CORS Errors**

#### **Sintomas:**
- Erro de CORS no browser
- Requisições bloqueadas

#### **Solução Backend:**
```typescript
// app.ts - Configuração CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### **12. PROBLEMA: Rate Limiting**

#### **Sintomas:**
- Status 429 (Too Many Requests)
- Requisições sendo bloqueadas

#### **Solução:**
```typescript
// Configurar rate limiting apropriado
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Muitas requisições, tente novamente em 15 minutos'
});
```

---

## 🎨 **PROBLEMAS DE FRONTEND**

### **13. PROBLEMA: Componentes Não Renderizam**

#### **Sintomas:**
- Página em branco
- Componentes não aparecem

#### **Debug:**
```typescript
// Adicionar logs de debug temporários
useEffect(() => {
  console.log('Component mounted:', { data, loading, error });
}, [data, loading, error]);

// Verificar estados
if (loading) return <div>Carregando...</div>;
if (error) return <div>Erro: {error}</div>;
if (!data) return <div>Sem dados</div>;
```

---

### **14. PROBLEMA: Estados de Loading Infinito**

#### **Sintomas:**
- Loading que nunca termina
- Interface travada

#### **Solução:**
```typescript
const [loading, setLoading] = useState(false);

const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const response = await api.get('/endpoint');
    setData(response.data);
  } catch (error) {
    setError(error.message);
  } finally {
    setLoading(false); // SEMPRE definir como false
  }
}, []);
```

---

## 🚀 **COMANDOS DE EMERGÊNCIA**

### **Reset Completo do Ambiente:**
```bash
# Execute reset-dev.bat ou:

# 1. Parar processos
taskkill /f /im node.exe

# 2. Limpar portas
netstat -ano | findstr :3000
netstat -ano | findstr :3001
# Matar PIDs encontrados

# 3. Limpar caches
cd backend && rm -rf node_modules && npm install
cd frontend && rm -rf .next node_modules && npm install

# 4. Reiniciar
start-dev.bat
```

### **Verificação de Status:**
```bash
# Backend
curl http://localhost:3001/api/auth/info

# Frontend  
curl http://localhost:3000

# Banco
psql -h localhost -p 5432 -U postgres -c "\l"
```

---

## 📞 **QUANDO PEDIR AJUDA**

Se os problemas persistirem após tentar as soluções acima:

1. **Verificar logs detalhados** no console do navegador e terminal
2. **Documentar sintomas** específicos e steps para reproduzir
3. **Verificar se seguiu** os padrões documentados em [DEVELOPMENT.md](./DEVELOPMENT.md)
4. **Consultar** [ARCHITECTURE.md](./ARCHITECTURE.md) para entender a estrutura

---

**Este guia contém soluções para problemas REAIS encontrados durante o desenvolvimento.**  
**Baseado em experiências práticas do Personal Expense Hub.**
