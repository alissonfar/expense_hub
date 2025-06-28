import { Prisma, PrismaClient } from '@prisma/client';
import { AuthContext, Role } from '../types';

// =============================================
// CONFIGURAÇÃO DO CLIENTE PRISMA ESTENDIDO
// =============================================

// Instância global do Prisma para operações que não dependem de contexto (como login)
export const prisma = new PrismaClient();

// Lista de modelos que são de propriedade de um tenant (Hub) e devem ser isolados.
const TENANT_MODELS: Prisma.ModelName[] = [
  'transacoes',
  'tags',
  'pagamentos'
  // Adicionar outros modelos de tenant aqui conforme necessário.
];

/**
 * Retorna uma nova instância do PrismaClient estendida com RLS (Row-Level Security) para multi-tenancy.
 * A segurança é baseada no AuthContext fornecido, que é derivado do JWT do usuário.
 * 
 * @param ctx O contexto de autenticação e autorização do usuário para a requisição atual.
 * @returns Uma instância do PrismaClient com filtros de segurança automáticos.
 */
export function getExtendedPrismaClient(ctx: AuthContext) {
  return new PrismaClient().$extends({
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
            role === Role.VISUALIZADOR ||
            (role === Role.COLABORADOR && dataAccessPolicy === 'INDIVIDUAL')
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
            case 'findFirst':
            case 'findMany':
            case 'count':
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
            
            case 'update':
            case 'updateMany':
            case 'delete':
            case 'deleteMany':
            case 'upsert':
              newArgs.where = { AND: [newArgs.where, hubSecurityClause] };
              if (operation === 'upsert') {
                newArgs.create = { ...newArgs.create, ...hubSecurityClause };
              }
              break;
          }

          return query(newArgs);
        },
      },
    },
  });
}