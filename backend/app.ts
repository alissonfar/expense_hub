import express, { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
}

console.log('DATABASE_URL no Render:', process.env.DATABASE_URL);
console.log('Length:', process.env.DATABASE_URL?.length);
console.log('Starts with postgresql:', process.env.DATABASE_URL?.startsWith('postgresql://'));
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Todas as env vars:', Object.keys(process.env).filter(key => key.includes('DATABASE')));

// Import dos tipos personalizados e middlewares
import './types';
import { requireAuth } from './middleware/auth';
import { injectPrismaClient } from './middleware/prisma';

// Import das rotas
import authRoutes from './routes/auth';
import pessoaRoutes from './routes/pessoa';
import tagRoutes from './routes/tag';
import transacaoRoutes from './routes/transacao';
import pagamentoRoutes from './routes/pagamento';
import relatorioRoutes from './routes/relatorio';
import configuracaoRoutes from './routes/configuracao';
// Futuras rotas de Hub
import hubRoutes from './routes/hub';
import { createHub } from './controllers/hubController';

// Inicializa um PrismaClient global APENAS para operações não autenticadas (login, health check).
const prismaGlobal = new PrismaClient();


const app = express();
const PORT = process.env.PORT || 3001;

// =============================================
// MIDDLEWARES GLOBAIS
// =============================================

app.use(compression());
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false
}));

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'http://localhost:3000']
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'),
  message: { error: 'Muitas requisições desta origem' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === 'development'
});
app.use('/api', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para injetar o PrismaClient global em rotas públicas
const injectGlobalPrisma = (req: Request, res: Response, next: NextFunction) => {
  req.prisma = prismaGlobal;
  next();
};

// =============================================
// ROTAS PÚBLICAS (NÃO REQUEREM AUTENTICAÇÃO COM CONTEXTO DE HUB)
// =============================================

app.get('/', (req, res) => {
  res.json({ message: '💰 Personal Expense Hub API - Multi-Tenant', version: '2.0.0' });
});

// Health check usa o cliente global
app.get('/health', injectGlobalPrisma, async (req, res) => {
  try {
    await req.prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'OK', database: 'Connected', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'ERROR', database: 'Disconnected' });
  }
});

// Rotas de autenticação são públicas e usam o cliente global
app.use('/api/auth', injectGlobalPrisma, authRoutes);

// Rota pública para criação de hub (onboarding)
app.post('/api/hubs', createHub);

// =============================================
// ROTAS PRIVADAS (REQUEREM AUTENTICAÇÃO E CONTEXTO DE HUB)
// =============================================

// Este é o ponto central da segurança:
// 1. `requireAuth` valida o JWT e anexa o `AuthContext` ao `req.auth`.
// 2. `injectPrismaClient` usa o `req.auth` para criar um cliente Prisma com RLS e o anexa ao `req.prisma`.
const protectedApi = express.Router();
protectedApi.use(requireAuth, injectPrismaClient);

// Todas as rotas de negócio agora usam o router protegido
protectedApi.use('/pessoas', pessoaRoutes);
protectedApi.use('/tags', tagRoutes);
protectedApi.use('/transacoes', transacaoRoutes);
protectedApi.use('/pagamentos', pagamentoRoutes);
protectedApi.use('/relatorios', relatorioRoutes);
protectedApi.use('/configuracoes', configuracaoRoutes);
// protectedApi.use('/hubs', hubRoutes); // Remover ou comentar para não sobrescrever a rota pública

app.use('/api', protectedApi);

// =============================================
// TRATAMENTO DE ERROS
// =============================================
const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
    console.error("❌ Erro não tratado:", {
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        errorName: err.name,
        errorMessage: err.message,
        stack: err.stack,
    });

    if (res.headersSent) {
        return next(err);
    }

    res.status(500).json({
        error: "ErroInternoServidor",
        message: "Ocorreu um erro inesperado no servidor. A equipe de desenvolvimento foi notificada.",
    });
};
app.use(errorHandler);


// =============================================
// INICIALIZAÇÃO DO SERVIDOR
// =============================================

const server = app.listen(PORT, async () => {
    try {
        await prismaGlobal.$connect();
        console.log(`✅ Conexão com o banco de dados estabelecida.`);
        console.log(`🚀 Servidor rodando na porta ${PORT}`);
    } catch (error) {
        console.error('❌ Não foi possível conectar ao banco de dados ao iniciar o servidor.', error);
        process.exit(1);
    }
});

// Graceful Shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM recebido. Encerrando o servidor...');
    server.close(() => {
        console.log('Servidor encerrado.');
        prismaGlobal.$disconnect();
    });
});

export default app; 