import dotenv from 'dotenv';

// Carregar variáveis de ambiente para testes
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

// Configurações globais para testes
process.env.NODE_ENV = 'test'; 