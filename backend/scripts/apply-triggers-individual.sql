-- =============================================
-- SCRIPT DE APLICAÇÃO DE TRIGGERS DE INTEGRIDADE
-- Personal Expense Hub - Multi-Tenant
-- EXECUTAR COMANDO POR COMANDO
-- =============================================

-- COMANDO 1: Criar função para validar tags da transação
CREATE OR REPLACE FUNCTION validar_tag_transacao_hub()
RETURNS TRIGGER AS $$
DECLARE
    hub_transacao INT;
    hub_tag INT;
BEGIN
    -- Buscar Hub da transação
    SELECT "hubId" INTO hub_transacao
    FROM "transacoes" WHERE "id" = NEW."transacao_id";
    
    -- Buscar Hub da tag
    SELECT "hubId" INTO hub_tag
    FROM "tags" WHERE "id" = NEW."tag_id";
    
    -- Validar se transação e tag são do mesmo Hub
    IF hub_transacao != hub_tag THEN
        RAISE EXCEPTION 'Transação (Hub %) e tag (Hub %) devem ser do mesmo Hub', hub_transacao, hub_tag;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- COMANDO 2: Aplicar trigger na tabela transacao_tags
DROP TRIGGER IF EXISTS trigger_validar_tag_transacao_hub ON "transacao_tags";
CREATE TRIGGER trigger_validar_tag_transacao_hub
    BEFORE INSERT OR UPDATE ON "transacao_tags"
    FOR EACH ROW EXECUTE FUNCTION validar_tag_transacao_hub();

-- COMANDO 3: Criar função para validar pagamento e transação
CREATE OR REPLACE FUNCTION validar_pagamento_transacao_hub()
RETURNS TRIGGER AS $$
DECLARE
    hub_pagamento INT;
    hub_transacao INT;
BEGIN
    -- Buscar Hub do pagamento
    SELECT "hubId" INTO hub_pagamento
    FROM "pagamentos" WHERE "id" = NEW."pagamento_id";
    
    -- Buscar Hub da transação
    SELECT "hubId" INTO hub_transacao
    FROM "transacoes" WHERE "id" = NEW."transacao_id";
    
    -- Validar se pagamento e transação são do mesmo Hub
    IF hub_pagamento != hub_transacao THEN
        RAISE EXCEPTION 'Pagamento (Hub %) e transação (Hub %) devem ser do mesmo Hub', hub_pagamento, hub_transacao;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- COMANDO 4: Aplicar trigger na tabela pagamento_transacoes
DROP TRIGGER IF EXISTS trigger_validar_pagamento_transacao_hub ON "pagamento_transacoes";
CREATE TRIGGER trigger_validar_pagamento_transacao_hub
    BEFORE INSERT OR UPDATE ON "pagamento_transacoes"
    FOR EACH ROW EXECUTE FUNCTION validar_pagamento_transacao_hub();

-- COMANDO 5: Criar função para validar participante
CREATE OR REPLACE FUNCTION validar_participante_hub()
RETURNS TRIGGER AS $$
DECLARE
    hub_transacao INT;
BEGIN
    -- Buscar Hub da transação
    SELECT "hubId" INTO hub_transacao
    FROM "transacoes" WHERE "id" = NEW."transacao_id";
    
    IF hub_transacao IS NULL THEN
        RAISE EXCEPTION 'Transação ID % não encontrada', NEW."transacao_id";
    END IF;
    
    -- Validar se participante pertence ao Hub
    IF NOT EXISTS(
        SELECT 1 FROM "membros_hub"
        WHERE "pessoaId" = NEW."pessoa_id" 
        AND "hubId" = hub_transacao
        AND "ativo" = TRUE
    ) THEN
        RAISE EXCEPTION 'Participante (ID %) não pertence ao Hub % da transação', NEW."pessoa_id", hub_transacao;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- COMANDO 6: Aplicar trigger na tabela transacao_participantes
DROP TRIGGER IF EXISTS trigger_validar_participante_hub ON "transacao_participantes";
CREATE TRIGGER trigger_validar_participante_hub
    BEFORE INSERT OR UPDATE ON "transacao_participantes"
    FOR EACH ROW EXECUTE FUNCTION validar_participante_hub();

-- COMANDO 7: Verificar se os triggers foram criados
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name IN (
    'trigger_validar_tag_transacao_hub',
    'trigger_validar_pagamento_transacao_hub',
    'trigger_validar_participante_hub'
)
ORDER BY trigger_name; 