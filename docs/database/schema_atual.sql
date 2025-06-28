-- =============================================================================
-- !! ATENÇÃO: ARQUIVO DE REFERÊNCIA, NÃO EXECUTAR MANUALMENTE !!
-- =============================================================================
--
-- Este arquivo é um snapshot do schema atual do banco de dados, gerado
-- a partir da migração oficial do Prisma.
--
-- PROPÓSITO:
-- 1. Documentação: Para consulta rápida da estrutura das tabelas e índices.
-- 2. Referência: Para entender o estado do banco de dados gerenciado pelo Prisma.
--
-- NÃO FAÇA:
-- - NÃO execute este script diretamente no banco de dados.
-- - NÃO faça alterações manuais neste arquivo para aplicar mudanças.
--
-- PARA ALTERAR O BANCO DE DADOS:
-- 1. Modifique o arquivo `backend/prisma/schema.prisma`.
-- 2. Execute `npx prisma migrate dev --name <nome_da_migracao>` para gerar uma
--    nova migração.
--
-- O Prisma é a ÚNICA fonte da verdade para a estrutura do banco de dados.
--
-- Data do Snapshot: 2024-07-29
-- Migração de Origem: 20250628005915_multi_tenant_initial_schema
--
-- =============================================================================

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR', 'VISUALIZADOR');

-- CreateEnum
CREATE TYPE "DataAccessPolicy" AS ENUM ('GLOBAL', 'INDIVIDUAL');

-- CreateTable
CREATE TABLE "Hub" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "codigoAcesso" VARCHAR(20),

    CONSTRAINT "Hub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembroHub" (
    "hubId" INTEGER NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'COLABORADOR',
    "dataAccessPolicy" "DataAccessPolicy",
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembroHub_pkey" PRIMARY KEY ("hubId","pessoaId")
);

-- CreateTable
CREATE TABLE "pessoas" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "telefone" VARCHAR(20),
    "senha_hash" VARCHAR(255) NOT NULL,
    "ehAdministrador" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "data_cadastro" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "pessoas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacoes" (
    "id" SERIAL NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "tipo" VARCHAR(10) NOT NULL,
    "proprietario_id" INTEGER NOT NULL,
    "descricao" VARCHAR(200) NOT NULL,
    "local" VARCHAR(150),
    "valor_total" DECIMAL(10,2) NOT NULL,
    "data_transacao" DATE NOT NULL,
    "data_criacao" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eh_parcelado" BOOLEAN NOT NULL DEFAULT false,
    "parcela_atual" INTEGER NOT NULL DEFAULT 1,
    "total_parcelas" INTEGER NOT NULL DEFAULT 1,
    "valor_parcela" DECIMAL(10,2) NOT NULL,
    "grupo_parcela" UUID DEFAULT gen_random_uuid(),
    "observacoes" TEXT,
    "confirmado" BOOLEAN NOT NULL DEFAULT true,
    "status_pagamento" VARCHAR(15) NOT NULL DEFAULT 'PENDENTE',
    "criado_por" INTEGER NOT NULL,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL,
    "hubId" INTEGER NOT NULL,

    CONSTRAINT "transacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "cor" VARCHAR(7) DEFAULT '#6B7280',
    "icone" VARCHAR(10),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hubId" INTEGER NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" SERIAL NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "pessoa_id" INTEGER NOT NULL,
    "valor_total" DECIMAL(10,2) NOT NULL,
    "valor_excedente" DECIMAL(10,2) DEFAULT 0,
    "data_pagamento" DATE NOT NULL,
    "forma_pagamento" VARCHAR(15) DEFAULT 'PIX',
    "observacoes" TEXT,
    "processar_excedente" BOOLEAN DEFAULT true,
    "receita_excedente_id" INTEGER,
    "registrado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL,
    "hubId" INTEGER NOT NULL,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamento_transacoes" (
    "id" SERIAL NOT NULL,
    "pagamento_id" INTEGER NOT NULL,
    "transacao_id" INTEGER NOT NULL,
    "valor_aplicado" DECIMAL(10,2) NOT NULL,
    "criado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pagamento_transacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_sistema" (
    "id" SERIAL NOT NULL,
    "chave" VARCHAR(50) NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "criado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "configuracoes_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacao_participantes" (
    "id" SERIAL NOT NULL,
    "transacao_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,
    "valor_devido" DECIMAL(10,2) DEFAULT 0,
    "valor_recebido" DECIMAL(10,2) DEFAULT 0,
    "eh_proprietario" BOOLEAN DEFAULT false,
    "valor_pago" DECIMAL(10,2) DEFAULT 0,
    "criado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transacao_participantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacao_tags" (
    "transacao_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,

    CONSTRAINT "transacao_tags_pkey" PRIMARY KEY ("transacao_id","tag_id")
);

-- CreateTable
CREATE TABLE "pagamentos_backup" (
    "id" INTEGER,
    "transacao_id" INTEGER,
    "pessoa_id" INTEGER,
    "valor_pago" DECIMAL(10,2),
    "data_pagamento" DATE,
    "forma_pagamento" VARCHAR(15),
    "observacoes" TEXT,
    "registrado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6)
);

-- CreateIndex
CREATE UNIQUE INDEX "Hub_nome_key" ON "Hub"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Hub_codigoAcesso_key" ON "Hub"("codigoAcesso");

-- CreateIndex
CREATE INDEX "idx_hubs_ativo" ON "Hub"("ativo");

-- CreateIndex
CREATE INDEX "idx_hubs_codigo_acesso" ON "Hub"("codigoAcesso");

-- CreateIndex
CREATE INDEX "idx_membro_hub_hub" ON "MembroHub"("hubId");

-- CreateIndex
CREATE INDEX "idx_membro_hub_pessoa" ON "MembroHub"("pessoaId");

-- CreateIndex
CREATE INDEX "idx_membro_hub_ativo" ON "MembroHub"("ativo");

-- CreateIndex
CREATE INDEX "idx_membro_hub_role" ON "MembroHub"("role");

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_email_key" ON "pessoas"("email");

-- CreateIndex
CREATE INDEX "idx_pessoas_ativo" ON "pessoas"("ativo");

-- CreateIndex
CREATE INDEX "idx_pessoas_email" ON "pessoas"("email");

-- CreateIndex
CREATE INDEX "idx_pessoas_eh_administrador" ON "pessoas"("ehAdministrador");

-- CreateIndex
CREATE INDEX "idx_transacoes_ativo" ON "transacoes"("ativo");

-- CreateIndex
CREATE INDEX "idx_transacoes_hub" ON "transacoes"("hubId");

-- CreateIndex
CREATE INDEX "idx_transacoes_criado_por" ON "transacoes"("criado_por");

-- CreateIndex
CREATE INDEX "idx_transacoes_data" ON "transacoes"("data_transacao");

-- CreateIndex
CREATE INDEX "idx_transacoes_grupo_parcela" ON "transacoes"("grupo_parcela");

-- CreateIndex
CREATE INDEX "idx_transacoes_proprietario" ON "transacoes"("proprietario_id");

-- CreateIndex
CREATE INDEX "idx_transacoes_status" ON "transacoes"("status_pagamento");

-- CreateIndex
CREATE INDEX "idx_transacoes_tipo" ON "transacoes"("tipo");

-- CreateIndex
CREATE INDEX "idx_transacoes_hub_ativo" ON "transacoes"("hubId", "ativo");

-- CreateIndex
CREATE INDEX "idx_tags_ativo" ON "tags"("ativo");

-- CreateIndex
CREATE INDEX "idx_tags_hub" ON "tags"("hubId");

-- CreateIndex
CREATE INDEX "idx_tags_criado_por" ON "tags"("criado_por");

-- CreateIndex
CREATE INDEX "idx_tags_nome" ON "tags"("nome");

-- CreateIndex
CREATE INDEX "idx_tags_hub_ativo" ON "tags"("hubId", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "unique_tag_nome_per_hub" ON "tags"("hubId", "nome");

-- CreateIndex
CREATE INDEX "idx_pagamentos_ativo" ON "pagamentos"("ativo");

-- CreateIndex
CREATE INDEX "idx_pagamentos_hub" ON "pagamentos"("hubId");

-- CreateIndex
CREATE INDEX "idx_pagamentos_registrado_por" ON "pagamentos"("registrado_por");

-- CreateIndex
CREATE INDEX "idx_pagamentos_data" ON "pagamentos"("data_pagamento");

-- CreateIndex
CREATE INDEX "idx_pagamentos_pessoa" ON "pagamentos"("pessoa_id");

-- CreateIndex
CREATE INDEX "idx_pagamentos_forma" ON "pagamentos"("forma_pagamento");

-- CreateIndex
CREATE INDEX "idx_pagamentos_pessoa_data" ON "pagamentos"("pessoa_id", "data_pagamento");

-- CreateIndex
CREATE INDEX "idx_pagamentos_hub_ativo" ON "pagamentos"("hubId", "ativo");

-- CreateIndex
CREATE INDEX "idx_pagamento_transacoes_pagamento" ON "pagamento_transacoes"("pagamento_id");

-- CreateIndex
CREATE INDEX "idx_pagamento_transacoes_transacao" ON "pagamento_transacoes"("transacao_id");

-- CreateIndex
CREATE INDEX "idx_pagamento_transacoes_valor" ON "pagamento_transacoes"("valor_aplicado");

-- CreateIndex
CREATE INDEX "idx_pagamento_transacoes_lookup" ON "pagamento_transacoes"("transacao_id", "pagamento_id");

-- CreateIndex
CREATE UNIQUE INDEX "pagamento_transacoes_pagamento_id_transacao_id_key" ON "pagamento_transacoes"("pagamento_id", "transacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_sistema_chave_key" ON "configuracoes_sistema"("chave");

-- CreateIndex
CREATE INDEX "idx_participantes_pessoa" ON "transacao_participantes"("pessoa_id");

-- CreateIndex
CREATE INDEX "idx_participantes_proprietario" ON "transacao_participantes"("eh_proprietario");

-- CreateIndex
CREATE INDEX "idx_participantes_transacao" ON "transacao_participantes"("transacao_id");

-- CreateIndex
CREATE UNIQUE INDEX "participante_transacao_unico" ON "transacao_participantes"("transacao_id", "pessoa_id");

-- CreateIndex
CREATE INDEX "idx_transacao_tags_tag" ON "transacao_tags"("tag_id");

-- CreateIndex
CREATE INDEX "idx_transacao_tags_transacao" ON "transacao_tags"("transacao_id");

-- AddForeignKey
ALTER TABLE "MembroHub" ADD CONSTRAINT "MembroHub_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "MembroHub" ADD CONSTRAINT "MembroHub_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "pessoas"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_proprietario_id_fkey" FOREIGN KEY ("proprietario_id") REFERENCES "pessoas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "Hub"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_receita_excedente_id_fkey" FOREIGN KEY ("receita_excedente_id") REFERENCES "transacoes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "pessoas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pagamento_transacoes" ADD CONSTRAINT "pagamento_transacoes_pagamento_id_fkey" FOREIGN KEY ("pagamento_id") REFERENCES "pagamentos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pagamento_transacoes" ADD CONSTRAINT "pagamento_transacoes_transacao_id_fkey" FOREIGN KEY ("transacao_id") REFERENCES "transacoes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transacao_participantes" ADD CONSTRAINT "transacao_participantes_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transacao_participantes" ADD CONSTRAINT "transacao_participantes_transacao_id_fkey" FOREIGN KEY ("transacao_id") REFERENCES "transacoes"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transacao_tags" ADD CONSTRAINT "transacao_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transacao_tags" ADD CONSTRAINT "transacao_tags_transacao_id_fkey" FOREIGN KEY ("transacao_id") REFERENCES "transacoes"("id") ON DELETE CASCADE ON UPDATE NO ACTION; 