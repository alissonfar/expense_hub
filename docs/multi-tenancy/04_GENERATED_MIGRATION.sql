-- CreateEnum
CREATE TYPE "Role" AS ENUM ('PROPRIETARIO', 'ADMINISTRADOR', 'COLABORADOR', 'VISUALIZADOR');

-- CreateEnum
CREATE TYPE "DataAccessPolicy" AS ENUM ('GLOBAL', 'INDIVIDUAL');

-- CreateTable
CREATE TABLE "hubs" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "codigoAcesso" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membros_hub" (
    "hubId" INTEGER NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'COLABORADOR',
    "dataAccessPolicy" "DataAccessPolicy",
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membros_hub_pkey" PRIMARY KEY ("hubId","pessoaId")
);

-- CreateTable
CREATE TABLE "pessoas" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "telefone" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ehAdministrador" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "pessoas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacoes" (
    "id" SERIAL NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "descricao" VARCHAR(200) NOT NULL,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "dataTransacao" DATE NOT NULL,
    "tipo" VARCHAR(10) NOT NULL,
    "local" VARCHAR(150),
    "observacoes" TEXT,
    "confirmado" BOOLEAN NOT NULL DEFAULT true,
    "statusPagamento" VARCHAR(15) NOT NULL DEFAULT 'PENDENTE',
    "ehParcelado" BOOLEAN DEFAULT false,
    "parcelaAtual" INTEGER DEFAULT 1,
    "totalParcelas" INTEGER DEFAULT 1,
    "grupoParcela" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hubId" INTEGER NOT NULL,
    "criadoPorId" INTEGER NOT NULL,

    CONSTRAINT "transacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacao_participantes" (
    "id" SERIAL NOT NULL,
    "valorDevido" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "valorPago" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "transacaoId" INTEGER NOT NULL,
    "pessoaId" INTEGER NOT NULL,

    CONSTRAINT "transacao_participantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(50) NOT NULL,
    "cor" VARCHAR(7) DEFAULT '#6B7280',
    "icone" VARCHAR(10),
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hubId" INTEGER NOT NULL,
    "criadoPorId" INTEGER NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transacao_tags" (
    "transacaoId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transacao_tags_pkey" PRIMARY KEY ("transacaoId","tagId")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" SERIAL NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "valorTotal" DECIMAL(10,2) NOT NULL,
    "dataPagamento" DATE NOT NULL,
    "formaPagamento" VARCHAR(15) DEFAULT 'PIX',
    "observacoes" TEXT,
    "valorExcedente" DECIMAL(10,2) DEFAULT 0,
    "processarExcedente" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "hubId" INTEGER NOT NULL,
    "registradoPorId" INTEGER NOT NULL,
    "pessoaId" INTEGER NOT NULL,
    "receitaExcedenteId" INTEGER,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamento_transacoes" (
    "id" SERIAL NOT NULL,
    "valorAplicado" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pagamentoId" INTEGER NOT NULL,
    "transacaoId" INTEGER NOT NULL,

    CONSTRAINT "pagamento_transacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracoes_sistema" (
    "id" SERIAL NOT NULL,
    "chave" VARCHAR(50) NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracoes_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hubs_codigoAcesso_key" ON "hubs"("codigoAcesso");

-- CreateIndex
CREATE UNIQUE INDEX "pessoas_email_key" ON "pessoas"("email");

-- CreateIndex
CREATE INDEX "transacoes_hubId_idx" ON "transacoes"("hubId");

-- CreateIndex
CREATE UNIQUE INDEX "transacao_participantes_transacaoId_pessoaId_key" ON "transacao_participantes"("transacaoId", "pessoaId");

-- CreateIndex
CREATE INDEX "tags_hubId_idx" ON "tags"("hubId");

-- CreateIndex
CREATE UNIQUE INDEX "tags_hubId_nome_key" ON "tags"("hubId", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "pagamentos_receitaExcedenteId_key" ON "pagamentos"("receitaExcedenteId");

-- CreateIndex
CREATE INDEX "pagamentos_hubId_idx" ON "pagamentos"("hubId");

-- CreateIndex
CREATE UNIQUE INDEX "pagamento_transacoes_pagamentoId_transacaoId_key" ON "pagamento_transacoes"("pagamentoId", "transacaoId");

-- CreateIndex
CREATE UNIQUE INDEX "configuracoes_sistema_chave_key" ON "configuracoes_sistema"("chave");

-- AddForeignKey
ALTER TABLE "membros_hub" ADD CONSTRAINT "membros_hub_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_hub" ADD CONSTRAINT "membros_hub_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "pessoas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacoes" ADD CONSTRAINT "transacoes_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "pessoas"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacao_participantes" ADD CONSTRAINT "transacao_participantes_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "transacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacao_participantes" ADD CONSTRAINT "transacao_participantes_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "pessoas"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "pessoas"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacao_tags" ADD CONSTRAINT "transacao_tags_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "transacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transacao_tags" ADD CONSTRAINT "transacao_tags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_hubId_fkey" FOREIGN KEY ("hubId") REFERENCES "hubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_registradoPorId_fkey" FOREIGN KEY ("registradoPorId") REFERENCES "pessoas"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "pessoas"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_receitaExcedenteId_fkey" FOREIGN KEY ("receitaExcedenteId") REFERENCES "transacoes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento_transacoes" ADD CONSTRAINT "pagamento_transacoes_pagamentoId_fkey" FOREIGN KEY ("pagamentoId") REFERENCES "pagamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamento_transacoes" ADD CONSTRAINT "pagamento_transacoes_transacaoId_fkey" FOREIGN KEY ("transacaoId") REFERENCES "transacoes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================
-- EXTENSÕES E CONFIGURAÇÕES MULTI-TENANT
-- =============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- FUNÇÕES DE TIMESTAMP E AUDITORIA
-- =============================================

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de timestamp para todas as tabelas
CREATE TRIGGER trigger_pessoas_timestamp
    BEFORE UPDATE ON "pessoas"
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_transacoes_timestamp
    BEFORE UPDATE ON "transacoes"
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_participantes_timestamp
    BEFORE UPDATE ON "transacao_participantes"
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_tags_timestamp
    BEFORE UPDATE ON "tags"
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_pagamentos_timestamp
    BEFORE UPDATE ON "pagamentos"
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_pagamento_transacoes_timestamp
    BEFORE UPDATE ON "pagamento_transacoes"
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_configuracoes_timestamp
    BEFORE UPDATE ON "configuracoes_sistema"
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_membros_hub_timestamp
    BEFORE UPDATE ON "membros_hub"
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_transacao_tags_timestamp
    BEFORE UPDATE ON "transacao_tags"
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

-- =============================================
-- FUNÇÕES DE VALIDAÇÃO MULTI-TENANT
-- =============================================

-- Função para verificar se pessoa pertence ao Hub
CREATE OR REPLACE FUNCTION verificar_pessoa_hub(pessoa_id_param INT, hub_id_param INT)
RETURNS BOOLEAN AS $$
DECLARE
    pertence BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM "membros_hub"
        WHERE "pessoaId" = pessoa_id_param 
        AND "hubId" = hub_id_param
        AND "ativo" = TRUE
    ) INTO pertence;
    
    RETURN pertence;
END;
$$ LANGUAGE plpgsql;

-- Função para verificar permissão de papel no Hub
CREATE OR REPLACE FUNCTION verificar_papel_hub(pessoa_id_param INT, hub_id_param INT, papeis_permitidos TEXT[])
RETURNS BOOLEAN AS $$
DECLARE
    papel_pessoa TEXT;
BEGIN
    SELECT "role" INTO papel_pessoa
    FROM "membros_hub"
    WHERE "pessoaId" = pessoa_id_param 
    AND "hubId" = hub_id_param
    AND "ativo" = TRUE;
    
    RETURN papel_pessoa = ANY(papeis_permitidos);
END;
$$ LANGUAGE plpgsql;

-- Função para verificar se pessoa pode ver dados (política de acesso)
CREATE OR REPLACE FUNCTION verificar_acesso_dados(pessoa_id_param INT, hub_id_param INT, criado_por_id INT)
RETURNS BOOLEAN AS $$
DECLARE
    papel_pessoa TEXT;
    politica_acesso TEXT;
    eh_admin_sistema BOOLEAN := FALSE;
BEGIN
    -- Verificar se é administrador do sistema
    SELECT "ehAdministrador" INTO eh_admin_sistema
    FROM "pessoas" WHERE "id" = pessoa_id_param;
    
    IF eh_admin_sistema THEN
        RETURN TRUE;
    END IF;
    
    -- Buscar papel e política da pessoa no Hub
    SELECT "role", "dataAccessPolicy" INTO papel_pessoa, politica_acesso
    FROM "membros_hub"
    WHERE "pessoaId" = pessoa_id_param 
    AND "hubId" = hub_id_param
    AND "ativo" = TRUE;
    
    -- PROPRIETARIO e ADMINISTRADOR sempre podem ver tudo
    IF papel_pessoa IN ('PROPRIETARIO', 'ADMINISTRADOR') THEN
        RETURN TRUE;
    END IF;
    
    -- COLABORADOR com política GLOBAL pode ver tudo
    IF papel_pessoa = 'COLABORADOR' AND politica_acesso = 'GLOBAL' THEN
        RETURN TRUE;
    END IF;
    
    -- COLABORADOR com política INDIVIDUAL só vê o que criou
    IF papel_pessoa = 'COLABORADOR' AND politica_acesso = 'INDIVIDUAL' THEN
        RETURN pessoa_id_param = criado_por_id;
    END IF;
    
    -- VISUALIZADOR pode ver tudo (apenas leitura)
    IF papel_pessoa = 'VISUALIZADOR' THEN
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS DE VALIDAÇÃO MULTI-TENANT
-- =============================================

-- Trigger: Validar que criador pertence ao Hub (Transações)
CREATE OR REPLACE FUNCTION validar_criador_hub_transacao()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT verificar_pessoa_hub(NEW."criadoPorId", NEW."hubId") THEN
        RAISE EXCEPTION 'Criador (ID %) não pertence ao Hub %', NEW."criadoPorId", NEW."hubId";
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_criador_hub_transacao
    BEFORE INSERT OR UPDATE ON "transacoes"
    FOR EACH ROW EXECUTE FUNCTION validar_criador_hub_transacao();

-- Trigger: Validar que criador pertence ao Hub (Tags)
CREATE OR REPLACE FUNCTION validar_criador_hub_tag()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT verificar_pessoa_hub(NEW."criadoPorId", NEW."hubId") THEN
        RAISE EXCEPTION 'Criador (ID %) não pertence ao Hub %', NEW."criadoPorId", NEW."hubId";
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_criador_hub_tag
    BEFORE INSERT OR UPDATE ON "tags"
    FOR EACH ROW EXECUTE FUNCTION validar_criador_hub_tag();

-- Trigger: Validar participante pertence ao Hub
CREATE OR REPLACE FUNCTION validar_participante_hub()
RETURNS TRIGGER AS $$
DECLARE
    hub_transacao INT;
BEGIN
    -- Buscar Hub da transação
    SELECT "hubId" INTO hub_transacao
    FROM "transacoes" WHERE "id" = NEW."transacaoId";
    
    IF hub_transacao IS NULL THEN
        RAISE EXCEPTION 'Transação ID % não encontrada', NEW."transacaoId";
    END IF;
    
    -- Validar se participante pertence ao Hub
    IF NOT verificar_pessoa_hub(NEW."pessoaId", hub_transacao) THEN
        RAISE EXCEPTION 'Participante (ID %) não pertence ao Hub % da transação', NEW."pessoaId", hub_transacao;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_participante_hub
    BEFORE INSERT OR UPDATE ON "transacao_participantes"
    FOR EACH ROW EXECUTE FUNCTION validar_participante_hub();

-- Trigger: Validar pagador pertence ao Hub
CREATE OR REPLACE FUNCTION validar_pagador_hub()
RETURNS TRIGGER AS $$
BEGIN
    -- Validar pessoa que fez o pagamento
    IF NOT verificar_pessoa_hub(NEW."pessoaId", NEW."hubId") THEN
        RAISE EXCEPTION 'Pagador (ID %) não pertence ao Hub %', NEW."pessoaId", NEW."hubId";
    END IF;
    
    -- Validar pessoa que registrou o pagamento
    IF NOT verificar_pessoa_hub(NEW."registradoPorId", NEW."hubId") THEN
        RAISE EXCEPTION 'Registrador (ID %) não pertence ao Hub %', NEW."registradoPorId", NEW."hubId";
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_pagador_hub
    BEFORE INSERT OR UPDATE ON "pagamentos"
    FOR EACH ROW EXECUTE FUNCTION validar_pagador_hub();

-- Trigger: Validar pagamento composto no mesmo Hub
CREATE OR REPLACE FUNCTION validar_pagamento_transacao_hub()
RETURNS TRIGGER AS $$
DECLARE
    hub_pagamento INT;
    hub_transacao INT;
    pessoa_pagamento INT;
BEGIN
    -- Buscar Hub do pagamento e pessoa
    SELECT "hubId", "pessoaId" INTO hub_pagamento, pessoa_pagamento
    FROM "pagamentos" WHERE "id" = NEW."pagamentoId";
    
    -- Buscar Hub da transação
    SELECT "hubId" INTO hub_transacao
    FROM "transacoes" WHERE "id" = NEW."transacaoId";
    
    -- Validar se pagamento e transação são do mesmo Hub
    IF hub_pagamento != hub_transacao THEN
        RAISE EXCEPTION 'Pagamento (Hub %) e transação (Hub %) devem ser do mesmo Hub', hub_pagamento, hub_transacao;
    END IF;
    
    -- Validar se pessoa participa da transação
    IF NOT EXISTS(
        SELECT 1 FROM "transacao_participantes"
        WHERE "transacaoId" = NEW."transacaoId" 
        AND "pessoaId" = pessoa_pagamento
    ) THEN
        RAISE EXCEPTION 'Pessoa % não participa da transação %', pessoa_pagamento, NEW."transacaoId";
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_pagamento_transacao_hub
    BEFORE INSERT OR UPDATE ON "pagamento_transacoes"
    FOR EACH ROW EXECUTE FUNCTION validar_pagamento_transacao_hub();

-- Trigger: Validar tags da transação no mesmo Hub
CREATE OR REPLACE FUNCTION validar_tag_transacao_hub()
RETURNS TRIGGER AS $$
DECLARE
    hub_transacao INT;
    hub_tag INT;
BEGIN
    -- Buscar Hub da transação
    SELECT "hubId" INTO hub_transacao
    FROM "transacoes" WHERE "id" = NEW."transacaoId";
    
    -- Buscar Hub da tag
    SELECT "hubId" INTO hub_tag
    FROM "tags" WHERE "id" = NEW."tagId";
    
    -- Validar se transação e tag são do mesmo Hub
    IF hub_transacao != hub_tag THEN
        RAISE EXCEPTION 'Transação (Hub %) e tag (Hub %) devem ser do mesmo Hub', hub_transacao, hub_tag;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_tag_transacao_hub
    BEFORE INSERT OR UPDATE ON "transacao_tags"
    FOR EACH ROW EXECUTE FUNCTION validar_tag_transacao_hub();

-- =============================================
-- TRIGGERS DE INTEGRIDADE E STATUS
-- =============================================

-- Trigger: Atualizar status de pagamento das transações
CREATE OR REPLACE FUNCTION atualizar_status_transacao_multi_tenant()
RETURNS TRIGGER AS $$
DECLARE
    transacao_id_ref INT;
    pessoa_id_ref INT;
    total_pago_pessoa DECIMAL(10,2);
    total_devido_transacao DECIMAL(10,2);
    total_pago_transacao DECIMAL(10,2);
BEGIN
    -- Determinar transação e pessoa afetadas
    IF TG_OP = 'DELETE' THEN
        transacao_id_ref := OLD."transacaoId";
        SELECT "pessoaId" INTO pessoa_id_ref FROM "pagamentos" WHERE "id" = OLD."pagamentoId";
    ELSE
        transacao_id_ref := NEW."transacaoId";
        SELECT "pessoaId" INTO pessoa_id_ref FROM "pagamentos" WHERE "id" = NEW."pagamentoId";
    END IF;
    
    -- Recalcular total pago por esta pessoa nesta transação
    SELECT COALESCE(SUM(pt."valorAplicado"), 0)
    INTO total_pago_pessoa
    FROM "pagamento_transacoes" pt
    JOIN "pagamentos" p ON p."id" = pt."pagamentoId"
    WHERE pt."transacaoId" = transacao_id_ref 
    AND p."pessoaId" = pessoa_id_ref;
    
    -- Atualizar valor_pago do participante
    UPDATE "transacao_participantes"
    SET "valorPago" = total_pago_pessoa
    WHERE "transacaoId" = transacao_id_ref 
    AND "pessoaId" = pessoa_id_ref;
    
    -- Recalcular status geral da transação
    SELECT
        COALESCE(SUM(tp."valorDevido"), 0),
        COALESCE(SUM(tp."valorPago"), 0)
    INTO total_devido_transacao, total_pago_transacao
    FROM "transacao_participantes" tp
    WHERE tp."transacaoId" = transacao_id_ref;
    
    -- Atualizar status da transação
    UPDATE "transacoes" SET "statusPagamento" = CASE
        WHEN total_pago_transacao >= total_devido_transacao THEN 'PAGO_TOTAL'
        WHEN total_pago_transacao > 0 THEN 'PAGO_PARCIAL'
        ELSE 'PENDENTE'
    END
    WHERE "id" = transacao_id_ref;
    
    -- Retornar registro apropriado
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_status_transacao_multi_tenant
    AFTER INSERT OR UPDATE OR DELETE ON "pagamento_transacoes"
    FOR EACH ROW EXECUTE FUNCTION atualizar_status_transacao_multi_tenant();

-- Trigger: Processamento de excedente multi-tenant
CREATE OR REPLACE FUNCTION processar_excedente_multi_tenant()
RETURNS TRIGGER AS $$
DECLARE
    valor_excedente_calc DECIMAL(10,2) := 0;
    valor_minimo_config DECIMAL(10,2);
    auto_criar_receita BOOLEAN;
    descricao_receita TEXT;
    receita_id INT;
    pessoa_pagamento INT;
    hub_pagamento INT;
    data_pagamento_ref DATE;
    forma_pagamento_ref VARCHAR(15);
    processar_excedente_flag BOOLEAN;
BEGIN
    -- Buscar configurações
    SELECT "valor"::DECIMAL INTO valor_minimo_config
    FROM "configuracoes_sistema" WHERE "chave" = 'valor_minimo_excedente';
    
    SELECT "valor"::BOOLEAN INTO auto_criar_receita
    FROM "configuracoes_sistema" WHERE "chave" = 'auto_criar_receita_excedente';
    
    SELECT "valor" INTO descricao_receita
    FROM "configuracoes_sistema" WHERE "chave" = 'descricao_receita_excedente';
    
    -- Buscar dados do pagamento
    SELECT p."pessoaId", p."hubId", p."dataPagamento", p."formaPagamento", p."processarExcedente"
    INTO pessoa_pagamento, hub_pagamento, data_pagamento_ref, forma_pagamento_ref, processar_excedente_flag
    FROM "pagamentos" p WHERE p."id" = NEW."pagamentoId";
    
    -- Calcular excedente atual
    SELECT p."valorTotal" - (
        SELECT COALESCE(SUM(pt."valorAplicado"), 0) 
        FROM "pagamento_transacoes" pt
        WHERE pt."pagamentoId" = NEW."pagamentoId"
    ) INTO valor_excedente_calc
    FROM "pagamentos" p WHERE p."id" = NEW."pagamentoId";
    
    -- Se há excedente significativo
    IF valor_excedente_calc >= COALESCE(valor_minimo_config, 1.00) THEN
        -- Atualizar campo de excedente no pagamento
        UPDATE "pagamentos" 
        SET "valorExcedente" = valor_excedente_calc
        WHERE "id" = NEW."pagamentoId";
        
        -- Se deve criar receita automaticamente
        IF COALESCE(auto_criar_receita, TRUE) AND COALESCE(processar_excedente_flag, TRUE) THEN
            
            -- Criar receita do excedente
            INSERT INTO "transacoes" (
                "tipo", "descricao", "local", "valorTotal", 
                "dataTransacao", "statusPagamento", 
                "observacoes", "criadoPorId", "hubId"
            ) VALUES (
                'RECEITA',
                COALESCE(descricao_receita, 'Excedente de pagamento') || ' - ' || (SELECT "nome" FROM "pessoas" WHERE "id" = pessoa_pagamento),
                'Pagamento ID #' || NEW."pagamentoId",
                valor_excedente_calc,
                data_pagamento_ref,
                'PAGO_TOTAL',
                'Receita gerada automaticamente do excedente de R$ ' || valor_excedente_calc || ' do pagamento via ' || forma_pagamento_ref,
                pessoa_pagamento,
                hub_pagamento
            ) RETURNING "id" INTO receita_id;
            
            -- Vincular receita ao pagamento
            UPDATE "pagamentos" 
            SET "receitaExcedenteId" = receita_id
            WHERE "id" = NEW."pagamentoId";
            
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_processar_excedente_multi_tenant
    AFTER INSERT ON "pagamento_transacoes"
    FOR EACH ROW EXECUTE FUNCTION processar_excedente_multi_tenant();

-- =============================================
-- FUNÇÕES AUXILIARES MULTI-TENANT
-- =============================================

-- Função para calcular saldo de uma pessoa em um Hub específico
CREATE OR REPLACE FUNCTION calcular_saldo_pessoa_hub(pessoa_id_param INT, hub_id_param INT)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    receitas DECIMAL(10,2) := 0;
    dividas DECIMAL(10,2) := 0;
BEGIN
    -- Receitas (apenas transações do Hub)
    SELECT COALESCE(SUM(tp."valorDevido"), 0) INTO receitas
    FROM "transacao_participantes" tp
    JOIN "transacoes" t ON t."id" = tp."transacaoId"
    WHERE tp."pessoaId" = pessoa_id_param
    AND t."hubId" = hub_id_param
    AND t."tipo" = 'RECEITA';
    
    -- Dívidas pendentes (apenas transações do Hub)
    SELECT COALESCE(SUM(tp."valorDevido" - tp."valorPago"), 0) INTO dividas
    FROM "transacao_participantes" tp
    JOIN "transacoes" t ON t."id" = tp."transacaoId"
    WHERE tp."pessoaId" = pessoa_id_param
    AND t."hubId" = hub_id_param
    AND t."tipo" = 'GASTO'
    AND tp."valorDevido" > tp."valorPago";
    
    RETURN receitas - dividas;
END;
$$ LANGUAGE plpgsql;

-- Função para validar divisão de valores em um Hub
CREATE OR REPLACE FUNCTION validar_divisao_valores_hub(transacao_id_param INT)
RETURNS BOOLEAN AS $$
DECLARE
    valor_total_transacao DECIMAL(10,2);
    soma_valores_devidos DECIMAL(10,2);
    hub_transacao INT;
BEGIN
    -- Buscar dados da transação
    SELECT "valorTotal", "hubId" INTO valor_total_transacao, hub_transacao
    FROM "transacoes" WHERE "id" = transacao_id_param;
    
    -- Calcular soma dos valores devidos
    SELECT COALESCE(SUM("valorDevido"), 0) INTO soma_valores_devidos
    FROM "transacao_participantes"
    WHERE "transacaoId" = transacao_id_param;
    
    RETURN ABS(valor_total_transacao - soma_valores_devidos) < 0.01;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VIEWS MULTI-TENANT
-- =============================================

-- View: Transações completas com dados do Hub
CREATE VIEW view_transacoes_multi_tenant AS
SELECT
    t."id",
    t."hubId",
    h."nome" AS hub_nome,
    t."tipo",
    t."descricao",
    t."local",
    t."valorTotal",
    t."dataTransacao",
    t."statusPagamento",
    t."ehParcelado",
    t."parcelaAtual",
    t."totalParcelas",
    p."nome" AS criador_nome,
    COUNT(DISTINCT tp."pessoaId") AS total_participantes,
    string_agg(DISTINCT tg."nome", ', ' ORDER BY tg."nome") AS tags,
    COALESCE(SUM(tp."valorDevido"), 0) AS total_devido,
    COALESCE(SUM(tp."valorPago"), 0) AS total_pago,
    validar_divisao_valores_hub(t."id") AS divisao_correta
FROM "transacoes" t
JOIN "hubs" h ON h."id" = t."hubId"
JOIN "pessoas" p ON p."id" = t."criadoPorId"
LEFT JOIN "transacao_participantes" tp ON tp."transacaoId" = t."id"
LEFT JOIN "transacao_tags" tt ON tt."transacaoId" = t."id"
LEFT JOIN "tags" tg ON tg."id" = tt."tagId"
WHERE t."ativo" = TRUE
GROUP BY t."id", t."hubId", h."nome", t."tipo", t."descricao", t."local", 
         t."valorTotal", t."dataTransacao", t."statusPagamento", t."ehParcelado", 
         t."parcelaAtual", t."totalParcelas", p."nome";

-- View: Saldos por pessoa e Hub
CREATE VIEW view_saldos_multi_tenant AS
SELECT
    p."id" AS pessoa_id,
    p."nome" AS pessoa_nome,
    p."email",
    h."id" AS hub_id,
    h."nome" AS hub_nome,
    mh."role" AS papel_hub,
    mh."dataAccessPolicy" AS politica_acesso,
    COALESCE(receitas.total, 0) AS total_receitas,
    COALESCE(gastos.total_devido, 0) AS total_devido,
    COALESCE(gastos.total_pago, 0) AS total_pago,
    COALESCE(gastos.total_devido - gastos.total_pago, 0) AS saldo_pendente,
    calcular_saldo_pessoa_hub(p."id", h."id") AS saldo_final
FROM "pessoas" p
JOIN "membros_hub" mh ON mh."pessoaId" = p."id"
JOIN "hubs" h ON h."id" = mh."hubId"
LEFT JOIN (
    SELECT 
        tp."pessoaId",
        t."hubId",
        SUM(tp."valorDevido") AS total
    FROM "transacao_participantes" tp
    JOIN "transacoes" t ON t."id" = tp."transacaoId"
    WHERE t."tipo" = 'RECEITA' AND t."ativo" = TRUE
    GROUP BY tp."pessoaId", t."hubId"
) receitas ON receitas."pessoaId" = p."id" AND receitas."hubId" = h."id"
LEFT JOIN (
    SELECT 
        tp."pessoaId",
        t."hubId",
        SUM(tp."valorDevido") AS total_devido,
        SUM(tp."valorPago") AS total_pago
    FROM "transacao_participantes" tp
    JOIN "transacoes" t ON t."id" = tp."transacaoId"
    WHERE t."tipo" = 'GASTO' AND t."ativo" = TRUE
    GROUP BY tp."pessoaId", t."hubId"
) gastos ON gastos."pessoaId" = p."id" AND gastos."hubId" = h."id"
WHERE p."ativo" = TRUE AND mh."ativo" = TRUE AND h."ativo" = TRUE;

-- =============================================
-- CONFIGURAÇÕES PADRÃO MULTI-TENANT
-- =============================================

-- Configurações padrão para excedentes
INSERT INTO "configuracoes_sistema" ("chave", "valor", "descricao") VALUES
('auto_criar_receita_excedente', 'true', 'Criar receita automaticamente quando há excedente'),
('valor_minimo_excedente', '1.00', 'Valor mínimo de excedente para criar receita'),
('descricao_receita_excedente', 'Excedente de pagamento', 'Descrição padrão para receitas de excedente'),
('theme_interface', 'light', 'Tema padrão da interface (light/dark/auto)')
ON CONFLICT ("chave") DO NOTHING;

-- =============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO MULTI-TENANT
-- =============================================

COMMENT ON TABLE "hubs" IS 'Workspaces/tenants isolados do sistema multi-tenant';
COMMENT ON TABLE "membros_hub" IS 'Tabela de junção: pessoas e seus papéis em cada Hub';
COMMENT ON TABLE "pessoas" IS 'Usuários globais da plataforma, podem participar de múltiplos Hubs';
COMMENT ON TABLE "transacoes" IS 'Transações financeiras isoladas por Hub';
COMMENT ON TABLE "transacao_participantes" IS 'Participantes das transações dentro do contexto do Hub';
COMMENT ON TABLE "pagamentos" IS 'Pagamentos compostos isolados por Hub';
COMMENT ON TABLE "tags" IS 'Tags para categorização, isoladas por Hub';

COMMENT ON COLUMN "membros_hub"."role" IS 'Papel da pessoa no Hub: PROPRIETARIO, ADMINISTRADOR, COLABORADOR, VISUALIZADOR';
COMMENT ON COLUMN "membros_hub"."dataAccessPolicy" IS 'Política de acesso para COLABORADOR: GLOBAL ou INDIVIDUAL';
COMMENT ON COLUMN "pessoas"."ehAdministrador" IS 'Administrador do sistema com acesso a todos os Hubs';
COMMENT ON COLUMN "transacoes"."hubId" IS 'Chave de isolamento multi-tenant';
COMMENT ON COLUMN "pagamentos"."hubId" IS 'Chave de isolamento multi-tenant';
COMMENT ON COLUMN "tags"."hubId" IS 'Chave de isolamento multi-tenant';

-- =============================================
-- SCHEMA MULTI-TENANT COMPLETO APLICADO!
-- Versão: 1.0 - Multi-Tenant com Isolamento Completo
-- Inclui: Validações Hub, Triggers, Funções, Views, Configurações
-- ============================================= 