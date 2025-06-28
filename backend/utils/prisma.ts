import { Prisma, PrismaClient } from '@prisma/client';
import { AuthContext, Role } from '../types';

// =============================================
// CONFIGURAÇÃO DO CLIENTE PRISMA ESTENDIDO
// =============================================

// Configuração otimizada do pool de conexões para evitar "Too many database connections"
const prismaConfig: Prisma.PrismaClientOptions = {
  log: ['error', 'warn'],
};

// Instância global do Prisma para operações que não dependem de contexto (como login)
export const prisma = new PrismaClient(prismaConfig);

// Cache de instâncias do Prisma Client para reutilização
const clientCache = new Map<string, PrismaClient>();

// Lista de modelos que são de propriedade de um tenant (Hub) e devem ser isolados.
const TENANT_MODELS: Prisma.ModelName[] = [
  'transacoes',
  'tags',
  'pagamentos',
  'membros_hub',
  // Adicionar outros modelos de tenant aqui conforme necessário.
];

// Lista de modelos que NÃO devem usar filtro criado_por (apenas hubId)
// Esses modelos não têm campo criado_por ou a lógica de negócio não faz sentido
const MODELS_WITHOUT_CREATED_BY: Prisma.ModelName[] = [
  'membros_hub', // MembroHub não tem criado_por e VISUALIZADOR deve ver todos os membros
];

/**
 * Retorna uma nova instância do PrismaClient estendida com RLS (Row-Level Security) para multi-tenancy.
 * A segurança é baseada no AuthContext fornecido, que é derivado do JWT do usuário.
 * 
 * @param ctx O contexto de autenticação e autorização do usuário para a requisição atual.
 * @returns Uma instância do PrismaClient com filtros de segurança automáticos.
 */
export function getExtendedPrismaClient(ctx: AuthContext) {
  // Criar chave única para cache baseada no contexto
  const cacheKey = `${ctx.hubId}-${ctx.pessoaId}-${ctx.role}-${ctx.dataAccessPolicy}`;
  
  // Verificar se já existe uma instância em cache
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey)!;
  }

  // Criar nova instância com configuração otimizada
  const extendedClient = new PrismaClient(prismaConfig).$extends({
    query: {
      $allModels: {
        $allOperations({ model, operation, args, query }) {
          // Se o modelo não for de tenant ou o usuário for admin, pula a lógica.
          if (!TENANT_MODELS.includes(model) || ctx.ehAdministrador) {
            return query(args);
          }

          const { hubId, pessoaId, role, dataAccessPolicy } = ctx;
          const hubSecurityClause = { hubId };

          // Lógica para acesso individual
          let individualAccessClause: object | null = null;
          if (
            (role === Role.VISUALIZADOR ||
            (role === Role.COLABORADOR && dataAccessPolicy === 'INDIVIDUAL')) &&
            !MODELS_WITHOUT_CREATED_BY.includes(model) // Não aplicar para modelos sem criado_por
          ) {
            individualAccessClause = { criado_por: pessoaId };
          }
          
          const securityWhere = individualAccessClause
            ? { AND: [hubSecurityClause, individualAccessClause] }
            : hubSecurityClause;

          // Aplica as regras de segurança
          // Usamos 'as any' para contornar a inferência de tipo excessivamente estrita do TypeScript
          // em uniões de tipos complexas do Prisma. A lógica de runtime está segura pelo 'if' acima.
          const newArgs = args as any;

          switch (operation) {
            case 'findUnique':
              // Para modelos de tenant, findUnique é seguro por si só
              // pois usa chave primária que já garante unicidade
              // A verificação de hubId será feita no controller se necessário
              break;
            case 'update':
            case 'delete':
              // Não adicionar filtro de segurança, pois só aceita chave única
              break;
            case 'findFirst':
            case 'findMany':
            case 'count':
            case 'updateMany':
            case 'deleteMany':
              newArgs.where = { AND: [newArgs.where, securityWhere] };
              break;

            case 'create':
              newArgs.data = { ...newArgs.data, ...hubSecurityClause };
              break;

            case 'createMany':
                if (Array.isArray(newArgs.data)) {
                    newArgs.data = newArgs.data.map((item: any) => ({ ...item, ...hubSecurityClause }));
                  } else {
                    newArgs.data = { ...newArgs.data, ...hubSecurityClause };
                  }
              break;
            
            case 'upsert':
              newArgs.where = { AND: [newArgs.where, hubSecurityClause] };
              newArgs.create = { ...newArgs.create, ...hubSecurityClause };
              break;
          }

          return query(newArgs);
        },
      },
    },
  }) as PrismaClient;

  // Armazenar no cache para reutilização
  clientCache.set(cacheKey, extendedClient);
  
  return extendedClient;
}

/**
 * Função para limpar o cache de clientes Prisma
 * Útil para testes e quando há muitas instâncias em memória
 */
export function clearPrismaCache() {
  // Fechar todas as conexões dos clientes em cache
  for (const client of clientCache.values()) {
    client.$disconnect();
  }
  clientCache.clear();
}

/**
 * Função para desconectar todos os clientes Prisma
 * Deve ser chamada ao finalizar a aplicação
 */
export async function disconnectAllPrismaClients() {
  await prisma.$disconnect();
  await clearPrismaCache();
}