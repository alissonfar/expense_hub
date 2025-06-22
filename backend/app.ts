import express, { ErrorRequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';

// Import dos tipos personalizados
import './types';

// Import das rotas
import authRoutes from './routes/auth';
import pessoaRoutes from './routes/pessoa';
import tagRoutes from './routes/tag';
import transacaoRoutes from './routes/transacao';
import pagamentoRoutes from './routes/pagamento';
import relatorioRoutes from './routes/relatorio';
import configuracaoRoutes from './routes/configuracao';

// Inicializar Prisma
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3001;

// =============================================
// 3.1.1 - MIDDLEWARES BÁSICOS E AVANÇADOS
// =============================================

// Compressão de responses
app.use(compression());

// Segurança
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Para desenvolvimento
  contentSecurityPolicy: false     // Para desenvolvimento
}));

// =============================================
// 3.1.2 - CORS E SEGURANÇA
// =============================================

// CORS configurado
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'http://localhost:3000']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Muitas requisições desta origem',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', limiter);

// Parser de JSON com limite
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));

// Parser de URL encoded
app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// =============================================
// 3.1.4 - MIDDLEWARE DE VALIDAÇÃO
// =============================================

// Middleware de log de requisições
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Middleware de conexão com banco
app.use(async (req, res, next) => {
  try {
    // Verificar se banco está conectado
    await prisma.$queryRaw`SELECT 1`;
    req.prisma = prisma;
    next();
  } catch (error) {
    console.error('❌ Erro de conexão com banco:', error);
    res.status(503).json({
      error: 'Serviço indisponível',
      message: 'Problema de conexão com banco de dados'
    });
  }
});

// =============================================
// ROTAS DE SISTEMA
// =============================================

// Rota principal
app.get('/', (req, res) => {
  res.json({
    message: '💰 Personal Expense Hub API',
    status: 'Fase 3.1 - Estrutura Base Configurada',
    version: '1.0.0',
    features: [
      '✅ Express + TypeScript',
      '✅ Prisma ORM',
      '✅ CORS configurado',
      '✅ Rate limiting',
      '✅ Segurança (Helmet)',
      '✅ Validação de requests',
      '✅ Tratamento de erros',
      '✅ Sistema completo de relatórios'
    ],
    endpoints: {
      health: '/health',
      api: '/api'
    }
  });
});

// Health check avançado
app.get('/health', async (req, res) => {
  try {
    // Testar conexão com banco
    await prisma.$queryRaw`SELECT 1 as status`;
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'Connected',
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
      error: 'Database connection failed'
    });
  }
});

// =============================================
// 3.2 - SISTEMA DE AUTENTICAÇÃO IMPLEMENTADO
// =============================================

// Usar rotas de autenticação
app.use('/api/auth', authRoutes);

// =============================================
// 3.3 - CRUD DE PESSOAS IMPLEMENTADO
// =============================================

// Usar rotas de pessoas
app.use('/api/pessoas', pessoaRoutes);

// =============================================
// 3.4 - CRUD DE TAGS IMPLEMENTADO
// =============================================

// Usar rotas de tags
app.use('/api/tags', tagRoutes);

// =============================================
// 3.5 - CRUD DE TRANSAÇÕES (GASTOS) IMPLEMENTADO
// =============================================

// Usar rotas de transações
app.use('/api/transacoes', transacaoRoutes);

// =============================================
// 3.7 - SISTEMA DE PAGAMENTOS COMPOSTOS IMPLEMENTADO
// =============================================

// Usar rotas de pagamentos
app.use('/api/pagamentos', pagamentoRoutes);

// =============================================
// 3.8 - SISTEMA DE RELATÓRIOS IMPLEMENTADO
// =============================================

// Usar rotas de relatórios
app.use('/api/relatorios', relatorioRoutes);

// =============================================
// 3.9 - SISTEMA DE CONFIGURAÇÕES IMPLEMENTADO
// =============================================

// Usar rotas de configurações
app.use('/api/configuracoes', configuracaoRoutes);

// =============================================
// 3.1.3 - SISTEMA DE ROTAS MODULAR
// =============================================

// API principal com status atualizado
app.get('/api', (req, res) => {
  res.json({
    message: 'Personal Expense Hub API v1.0',
    status: '✅ Seção 3.8 - Sistema de Relatórios IMPLEMENTADO',
    currentPhase: '3.8 - Sistema de Relatórios',
    nextPhase: '4.0 - Frontend e Deploy',
    implementedRoutes: {
      auth: [
        '✅ POST /api/auth/register - Registro de usuário',
        '✅ POST /api/auth/login - Login',
        '✅ GET /api/auth/me - Perfil do usuário',
        '✅ PUT /api/auth/profile - Atualizar perfil',
        '✅ PUT /api/auth/change-password - Alterar senha',
        '✅ POST /api/auth/logout - Logout',
        '✅ GET /api/auth/info - Informações das rotas'
      ],
      pessoas: [
        '✅ GET /api/pessoas - Listar pessoas (com filtros)',
        '✅ POST /api/pessoas - Criar pessoa (proprietário)',
        '✅ GET /api/pessoas/:id - Detalhes da pessoa',
        '✅ PUT /api/pessoas/:id - Editar pessoa (proprietário)',
        '✅ DELETE /api/pessoas/:id - Desativar pessoa (proprietário)',
        '✅ GET /api/pessoas/info - Informações das rotas'
      ],
      tags: [
        '✅ GET /api/tags - Listar tags (com filtros)',
        '✅ POST /api/tags - Criar tag (autenticação obrigatória)',
        '✅ GET /api/tags/:id - Detalhes da tag com estatísticas',
        '✅ PUT /api/tags/:id - Editar tag (autenticação obrigatória)',
        '✅ DELETE /api/tags/:id - Desativar tag (autenticação obrigatória)',
        '✅ GET /api/tags/info - Informações das rotas'
      ],
      transacoes: [
        '✅ GET /api/transacoes - Listar gastos (com filtros e paginação)',
        '✅ POST /api/transacoes - Criar gasto (com parcelamento opcional)',
        '✅ GET /api/transacoes/:id - Detalhes da transação com estatísticas',
        '✅ PUT /api/transacoes/:id - Editar transação (autenticação obrigatória)',
        '✅ DELETE /api/transacoes/:id - Excluir transação (autenticação obrigatória)',
        '✅ GET /api/transacoes/info - Informações das rotas'
      ],
      pagamentos: [
        '✅ GET /api/pagamentos - Listar pagamentos (com filtros avançados)',
        '✅ POST /api/pagamentos - Criar pagamento individual/composto',
        '✅ GET /api/pagamentos/:id - Detalhes do pagamento',
        '✅ PUT /api/pagamentos/:id - Atualizar pagamento',
        '✅ DELETE /api/pagamentos/:id - Remover pagamento',
        '✅ GET /api/pagamentos/configuracoes/excedente - Buscar configurações',
        '✅ PUT /api/pagamentos/configuracoes/excedente - Atualizar configurações',
        '✅ GET /api/pagamentos/info - Informações das rotas de pagamento'
      ],
      relatorios: [
        '✅ GET /api/relatorios/dashboard - Dashboard com métricas principais',
        '✅ GET /api/relatorios/saldos - Relatório de saldos por pessoa',
        '✅ GET /api/relatorios/pendencias - Relatório de pendências e vencimentos',
        '✅ GET /api/relatorios/transacoes - Relatório completo de transações',
        '✅ GET /api/relatorios/categorias - Análise por categorias/tags',
        '✅ GET /api/relatorios/info - Informações das rotas de relatórios'
      ],
      configuracoes: [
        '✅ GET /api/configuracoes/interface - Buscar configurações de tema',
        '✅ PUT /api/configuracoes/interface - Atualizar configurações de tema (proprietário)',
        '⏳ GET /api/configuracoes/comportamento - Configurações de comportamento (futuro)',
        '⏳ GET /api/configuracoes/alertas - Configurações de alertas (futuro)',
        '⏳ GET /api/configuracoes/relatorios - Configurações de relatórios (futuro)',
        '✅ GET /api/configuracoes/info - Informações das rotas de configurações'
      ]
    },
    completedFeatures: {
      backend: [
        '✅ Sistema de autenticação JWT',
        '✅ CRUD de pessoas e tags',
        '✅ Sistema avançado de transações (gastos + receitas)',
        '✅ Parcelamento flexível com valores diferentes',
        '✅ Sistema de pagamentos compostos',
        '✅ Processamento automático de excedentes',
        '✅ Sistema completo de relatórios em tempo real'
      ]
    },
    plannedRoutes: {
      receitas: [
        '✅ POST /api/transacoes/receita - Criar receita (implementado)',
        '✅ PUT /api/transacoes/receita/:id - Atualizar receita (implementado)'
      ]
    },
    features: [
      '✅ JWT Authentication',
      '✅ Bcrypt Password Hashing',
      '✅ Zod Validation',
      '✅ Rate Limiting',
      '✅ Middleware Protection',
      '✅ Owner/User Authorization',
      '✅ Password Strength Validation',
      '✅ Automatic Owner Assignment (first user)'
    ]
  });
});

// Teste de conexão Prisma
app.get('/api/test-db', async (req, res) => {
  try {
    const pessoas = await prisma.pessoas.findMany({
      select: { id: true, nome: true, eh_proprietario: true }
    });
    
    const transacoes = await prisma.transacoes.count();
    const tags = await prisma.tags.count();
    
    res.json({
      message: '✅ Banco conectado e funcional',
      data: {
        pessoas: pessoas,
        contadores: {
          transacoes,
          tags
        }
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    res.status(500).json({
      error: 'Erro ao consultar banco',
      message: errorMessage
    });
  }
});

// =============================================
// 3.1.5 - TRATAMENTO DE ERROS AVANÇADO
// =============================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    message: `Rota ${req.method} ${req.originalUrl} não existe`,
    suggestion: 'Consulte GET /api para ver rotas disponíveis',
    timestamp: new Date().toISOString()
  });
});

// Error handler global
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const timestamp = new Date().toISOString();
  
  // Log do erro
  console.error(`${timestamp} - ERROR:`, {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  // Resposta baseada no tipo de erro
  if (err.name === 'ValidationError') {
    res.status(400).json({
      error: 'Erro de validação',
      message: err.message,
      timestamp
    });
    return;
  }

  if (err.name === 'PrismaClientValidationError') {
    res.status(400).json({
      error: 'Erro de dados',
      message: 'Dados inválidos fornecidos',
      timestamp
    });
    return;
  }

  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      error: 'Token inválido',
      message: 'Token de autenticação inválido',
      timestamp
    });
    return;
  }

  // Erro genérico
  res.status(err.status || 500).json({
    error: 'Erro interno do servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo deu errado',
    timestamp
  });
};

app.use(errorHandler);

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Encerrando servidor...');
  await prisma.$disconnect();
  console.log('✅ Prisma desconectado');
  process.exit(0);
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('🚀 ================================');
    console.log(`📡 Servidor: http://localhost:${PORT}`);
    console.log(`📊 Health: http://localhost:${PORT}/health`);
    console.log(`🧪 Test DB: http://localhost:${PORT}/api/test-db`);
    console.log(`🔄 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('🚀 ================================');
  });
}

export default app; 