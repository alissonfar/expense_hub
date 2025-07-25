import express, { ErrorRequestHandler, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import type { CorsOptions, CorsOptionsDelegate } from 'cors';

if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config({ path: '.env.development' });
} else if (process.env.NODE_ENV === 'production') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config({ path: '.env.production' });
} else {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
}

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
import godRoutes from './routes/god';
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

// Permitir múltiplos origins em produção (ex: FRONTEND_URL="https://expense-hub-three.vercel.app,http://localhost:3000")
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(o => o.trim()) : ['https://expense-hub-three.vercel.app'])
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

// ATENÇÃO: CORS aberto para qualquer origem. Entenda os riscos de segurança!
const corsOptions: CorsOptions = {
  origin: true, // Permite requisições de QUALQUER origem
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

// Rotas do Modo Deus (requerem autenticação mas não contexto de Hub)
app.use('/api/god', requireAuth, injectGlobalPrisma, godRoutes);

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
        console.log('==============================');
        console.log('💰 Personal Expense Hub - Backend');
        console.log('==============================');
        console.log(`Ambiente: ${process.env.NODE_ENV}`);
        console.log(`Porta: ${PORT}`);
        console.log(`Banco de dados: ${process.env.DATABASE_URL ? 'Conectado' : 'NÃO CONECTADO'}`);
        if (process.env.DATABASE_URL) {
          const host = process.env.DATABASE_URL.split('@')[1]?.split('/')[0] || 'Desconhecido';
          console.log(`Host do banco: ${host}`);
        }
        console.log('Status: ✅ Conexão com o banco de dados estabelecida.');
        console.log('Status: 🚀 Servidor rodando e pronto para receber requisições.');
        console.log('==============================');
    } catch (error) {
        console.error('❌ ERRO: Não foi possível conectar ao banco de dados ao iniciar o servidor.');
        console.error(error);
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