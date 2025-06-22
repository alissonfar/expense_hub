-- =============================================
-- PERSONAL EXPENSE HUB - POSTGRESQL SCHEMA COMPLETO
-- Sistema de Gestão de Gastos Pessoais com Pagamentos Compostos
-- Versão: 4.0 - Schema Inicial Completo e Atualizado
-- =============================================

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 1. TABELA DE PESSOAS/USUÁRIOS
-- =============================================

CREATE TABLE pessoas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    telefone VARCHAR(20),
    senha_hash VARCHAR(255) NOT NULL,
    eh_proprietario BOOLEAN DEFAULT FALSE,
    ativo BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    data_cadastro TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT email_valido CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$'),
    CONSTRAINT nome_nao_vazio CHECK (LENGTH(TRIM(nome)) > 0)
);

-- Índices para pessoas
CREATE INDEX idx_pessoas_email ON pessoas(email);
CREATE INDEX idx_pessoas_ativo ON pessoas(ativo);

-- =============================================
-- 2. TABELA DE TAGS
-- =============================================

CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    cor VARCHAR(7) DEFAULT '#6B7280',
    icone VARCHAR(10),
    ativo BOOLEAN DEFAULT TRUE,
    
    -- Auditoria
    criado_por INT NOT NULL REFERENCES pessoas(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT cor_hex_valida CHECK (cor ~* '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT nome_tag_nao_vazio CHECK (LENGTH(TRIM(nome)) > 0)
);

-- Índices para tags
CREATE INDEX idx_tags_nome ON tags(nome);
CREATE INDEX idx_tags_ativo ON tags(ativo);

-- =============================================
-- 3. TABELA PRINCIPAL DE TRANSAÇÕES
-- =============================================

CREATE TABLE transacoes (
    id SERIAL PRIMARY KEY,
    
    -- Identificação e tipo
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('GASTO', 'RECEITA')),
    proprietario_id INT NOT NULL REFERENCES pessoas(id),
    
    -- Informações básicas
    descricao VARCHAR(200) NOT NULL,
    local VARCHAR(150),
    valor_total DECIMAL(10,2) NOT NULL CHECK (valor_total > 0),
    
    -- Datas
    data_transacao DATE NOT NULL,
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Parcelamento
    eh_parcelado BOOLEAN DEFAULT FALSE,
    parcela_atual INTEGER DEFAULT 1 CHECK (parcela_atual >= 1),
    total_parcelas INTEGER DEFAULT 1 CHECK (total_parcelas >= 1),
    valor_parcela DECIMAL(10,2) NOT NULL,
    grupo_parcela UUID DEFAULT gen_random_uuid(),
    
    -- Metadata
    observacoes TEXT,
    confirmado BOOLEAN DEFAULT TRUE,
    
    -- Status calculado
    status_pagamento VARCHAR(15) DEFAULT 'PENDENTE' CHECK (
        status_pagamento IN ('PENDENTE', 'PAGO_PARCIAL', 'PAGO_TOTAL')
    ),
    
    -- Auditoria
    criado_por INT NOT NULL REFERENCES pessoas(id),
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT parcelas_validas CHECK (
        (eh_parcelado = FALSE AND parcela_atual = 1 AND total_parcelas = 1 AND valor_parcela = valor_total) OR
        (eh_parcelado = TRUE AND parcela_atual <= total_parcelas AND total_parcelas > 1 AND valor_parcela > 0)
    ),
    CONSTRAINT descricao_nao_vazia CHECK (LENGTH(TRIM(descricao)) > 0),
    CONSTRAINT data_valida CHECK (
        data_transacao BETWEEN (CURRENT_DATE - INTERVAL '5 years')::date 
                            AND (CURRENT_DATE + INTERVAL '3 years')::date
    )
);

-- Índices para transações
CREATE INDEX idx_transacoes_tipo ON transacoes(tipo);
CREATE INDEX idx_transacoes_proprietario ON transacoes(proprietario_id);
CREATE INDEX idx_transacoes_data ON transacoes(data_transacao);
CREATE INDEX idx_transacoes_grupo_parcela ON transacoes(grupo_parcela);
CREATE INDEX idx_transacoes_status ON transacoes(status_pagamento);

-- =============================================
-- 4. TABELA DE PARTICIPANTES (DIVISÃO POR VALOR FIXO)
-- =============================================

CREATE TABLE transacao_participantes (
    id SERIAL PRIMARY KEY,
    transacao_id INT NOT NULL REFERENCES transacoes(id) ON DELETE CASCADE,
    pessoa_id INT NOT NULL REFERENCES pessoas(id),
    
    -- Valores para GASTOS (apenas valor fixo)
    valor_devido DECIMAL(10,2) DEFAULT 0 CHECK (valor_devido >= 0),
    
    -- Valores para RECEITAS (apenas proprietário)
    valor_recebido DECIMAL(10,2) DEFAULT 0 CHECK (valor_recebido >= 0),
    
    -- Status e controle
    eh_proprietario BOOLEAN DEFAULT FALSE,
    valor_pago DECIMAL(10,2) DEFAULT 0 CHECK (valor_pago >= 0),
    
    -- Auditoria
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT participante_transacao_unico UNIQUE(transacao_id, pessoa_id),
    CONSTRAINT valor_pago_valido CHECK (valor_pago <= valor_devido),
    CONSTRAINT receita_so_proprietario CHECK (
        valor_recebido = 0 OR eh_proprietario = TRUE
    ),
    CONSTRAINT valores_mutuamente_exclusivos CHECK (
        (valor_devido > 0 AND valor_recebido = 0) OR
        (valor_devido = 0 AND valor_recebido >= 0)
    )
);

-- Índices para participantes
CREATE INDEX idx_participantes_transacao ON transacao_participantes(transacao_id);
CREATE INDEX idx_participantes_pessoa ON transacao_participantes(pessoa_id);
CREATE INDEX idx_participantes_proprietario ON transacao_participantes(eh_proprietario);

-- =============================================
-- 5. TABELA DE TAGS POR TRANSAÇÃO
-- =============================================

CREATE TABLE transacao_tags (
    transacao_id INT NOT NULL REFERENCES transacoes(id) ON DELETE CASCADE,
    tag_id INT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    
    -- Constraints
    PRIMARY KEY (transacao_id, tag_id)
);

-- Índices para transacao_tags
CREATE INDEX idx_transacao_tags_transacao ON transacao_tags(transacao_id);
CREATE INDEX idx_transacao_tags_tag ON transacao_tags(tag_id);

-- =============================================
-- 6. SISTEMA DE PAGAMENTOS COMPOSTOS
-- =============================================

-- Tabela principal de pagamentos (sem referência direta a transação)
CREATE TABLE pagamentos (
    id SERIAL PRIMARY KEY,
    
    -- Identificação
    pessoa_id INT NOT NULL REFERENCES pessoas(id),
    
    -- Valores
    valor_total DECIMAL(10,2) NOT NULL CHECK (valor_total > 0),
    valor_excedente DECIMAL(10,2) DEFAULT 0 CHECK (valor_excedente >= 0),
    
    -- Datas
    data_pagamento DATE NOT NULL,
    
    -- Informações do pagamento
    forma_pagamento VARCHAR(15) DEFAULT 'PIX' CHECK (
        forma_pagamento IN ('PIX', 'DINHEIRO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO', 'OUTROS')
    ),
    observacoes TEXT,
    
    -- Controle de excedente
    processar_excedente BOOLEAN DEFAULT TRUE,
    receita_excedente_id INT REFERENCES transacoes(id),
    
    -- Auditoria
    registrado_por INT NOT NULL REFERENCES pessoas(id),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT data_pagamento_valida CHECK (
        data_pagamento BETWEEN (CURRENT_DATE - INTERVAL '5 years')::date 
                            AND (CURRENT_DATE + INTERVAL '1 year')::date
    )
);

-- Tabela de detalhamento (quais transações foram pagas)
CREATE TABLE pagamento_transacoes (
    id SERIAL PRIMARY KEY,
    
    -- Referências
    pagamento_id INT NOT NULL REFERENCES pagamentos(id) ON DELETE CASCADE,
    transacao_id INT NOT NULL REFERENCES transacoes(id) ON DELETE CASCADE,
    
    -- Valor aplicado nesta transação específica
    valor_aplicado DECIMAL(10,2) NOT NULL CHECK (valor_aplicado > 0),
    
    -- Auditoria
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    UNIQUE(pagamento_id, transacao_id)
);

-- =============================================
-- 7. TABELA DE CONFIGURAÇÕES DO SISTEMA
-- =============================================

CREATE TABLE configuracoes_sistema (
    id SERIAL PRIMARY KEY,
    chave VARCHAR(50) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descricao TEXT,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Configurações padrão para excedentes
INSERT INTO configuracoes_sistema (chave, valor, descricao) VALUES
('auto_criar_receita_excedente', 'true', 'Criar receita automaticamente quando há excedente'),
('valor_minimo_excedente', '1.00', 'Valor mínimo de excedente para criar receita'),
('descricao_receita_excedente', 'Excedente de pagamento', 'Descrição padrão para receitas de excedente');

-- =============================================
-- 8. ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para pagamentos
CREATE INDEX idx_pagamentos_pessoa ON pagamentos(pessoa_id);
CREATE INDEX idx_pagamentos_data ON pagamentos(data_pagamento);
CREATE INDEX idx_pagamentos_forma ON pagamentos(forma_pagamento);
CREATE INDEX idx_pagamentos_excedente ON pagamentos(receita_excedente_id) WHERE receita_excedente_id IS NOT NULL;

-- Índices para pagamento_transacoes
CREATE INDEX idx_pagamento_transacoes_pagamento ON pagamento_transacoes(pagamento_id);
CREATE INDEX idx_pagamento_transacoes_transacao ON pagamento_transacoes(transacao_id);
CREATE INDEX idx_pagamento_transacoes_valor ON pagamento_transacoes(valor_aplicado);

-- Índices compostos para queries frequentes
CREATE INDEX idx_pagamentos_pessoa_data ON pagamentos(pessoa_id, data_pagamento);
CREATE INDEX idx_pagamento_transacoes_lookup ON pagamento_transacoes(transacao_id, pagamento_id);

-- =============================================
-- 9. TRIGGERS BÁSICOS DE TIMESTAMPS
-- =============================================

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION atualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.atualizado_em = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de timestamp
CREATE TRIGGER trigger_pessoas_timestamp
    BEFORE UPDATE ON pessoas
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_transacoes_timestamp
    BEFORE UPDATE ON transacoes
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_participantes_timestamp
    BEFORE UPDATE ON transacao_participantes
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

CREATE TRIGGER trigger_timestamp_pagamento
    BEFORE UPDATE ON pagamentos
    FOR EACH ROW EXECUTE FUNCTION atualizar_timestamp();

-- =============================================
-- 10. TRIGGERS DE VALIDAÇÃO PARA PAGAMENTOS (BEFORE)
-- =============================================

-- Trigger 1: Validar participação na transação
CREATE OR REPLACE FUNCTION validar_participacao_transacao()
RETURNS TRIGGER AS $$
DECLARE
    pessoa_pagamento INTEGER;
    participa BOOLEAN := FALSE;
BEGIN
    -- Buscar quem está fazendo o pagamento
    SELECT pessoa_id INTO pessoa_pagamento
    FROM pagamentos WHERE id = NEW.pagamento_id;
    
    IF pessoa_pagamento IS NULL THEN
        RAISE EXCEPTION 'Pagamento com ID % não encontrado', NEW.pagamento_id;
    END IF;
    
    -- Verificar se a pessoa participa da transação
    SELECT EXISTS(
        SELECT 1 FROM transacao_participantes
        WHERE transacao_id = NEW.transacao_id 
        AND pessoa_id = pessoa_pagamento
    ) INTO participa;
    
    IF NOT participa THEN
        RAISE EXCEPTION 'Pessoa não participa da transação ID %', NEW.transacao_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_participacao
    BEFORE INSERT OR UPDATE ON pagamento_transacoes
    FOR EACH ROW EXECUTE FUNCTION validar_participacao_transacao();

-- Trigger 2: Validar participação (permite excedentes)
CREATE OR REPLACE FUNCTION validar_valor_nao_excede_divida()
RETURNS TRIGGER AS $$
DECLARE
    pessoa_pagamento INTEGER;
    valor_devido DECIMAL(10,2);
    valor_ja_pago DECIMAL(10,2);
BEGIN
    -- Buscar pessoa do pagamento
    SELECT pessoa_id INTO pessoa_pagamento
    FROM pagamentos WHERE id = NEW.pagamento_id;
    
    -- Verificar se pessoa participa da transação (validação obrigatória)
    SELECT tp.valor_devido, tp.valor_pago
    INTO valor_devido, valor_ja_pago
    FROM transacao_participantes tp
    WHERE tp.transacao_id = NEW.transacao_id 
    AND tp.pessoa_id = pessoa_pagamento;
    
    IF valor_devido IS NULL THEN
        RAISE EXCEPTION 'Participação não encontrada para pessoa % na transação %', 
                       pessoa_pagamento, NEW.transacao_id;
    END IF;
    
    -- PERMITIR excedentes - não validar limite máximo
    -- O trigger processar_excedente_pagamento cuidará dos excedentes
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_valor_divida
    BEFORE INSERT OR UPDATE ON pagamento_transacoes
    FOR EACH ROW EXECUTE FUNCTION validar_valor_nao_excede_divida();

-- Trigger 3: Validar data do pagamento
CREATE OR REPLACE FUNCTION validar_data_pagamento_composto()
RETURNS TRIGGER AS $$
DECLARE
    data_pagamento_ref DATE;
    data_transacao_ref DATE;
BEGIN
    -- Buscar data do pagamento
    SELECT data_pagamento INTO data_pagamento_ref
    FROM pagamentos WHERE id = NEW.pagamento_id;
    
    -- Buscar data da transação
    SELECT data_transacao INTO data_transacao_ref
    FROM transacoes WHERE id = NEW.transacao_id;
    
    -- Validar se data do pagamento não é anterior à transação
    IF data_pagamento_ref < data_transacao_ref THEN
        RAISE EXCEPTION 'Data do pagamento (%) não pode ser anterior à data da transação (%) - Transação ID %', 
                       data_pagamento_ref, data_transacao_ref, NEW.transacao_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_data_pagamento_composto
    BEFORE INSERT OR UPDATE ON pagamento_transacoes
    FOR EACH ROW EXECUTE FUNCTION validar_data_pagamento_composto();

-- Trigger 4: Validar transação ativa
CREATE OR REPLACE FUNCTION validar_transacao_ativa()
RETURNS TRIGGER AS $$
DECLARE
    transacao_confirmada BOOLEAN;
BEGIN
    -- Verificar se transação existe e está confirmada
    SELECT confirmado INTO transacao_confirmada
    FROM transacoes WHERE id = NEW.transacao_id;
    
    IF transacao_confirmada IS NULL THEN
        RAISE EXCEPTION 'Transação ID % não encontrada', NEW.transacao_id;
    END IF;
    
    IF NOT transacao_confirmada THEN
        RAISE EXCEPTION 'Não é possível registrar pagamento para transação não confirmada (ID %)', NEW.transacao_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_transacao_ativa
    BEFORE INSERT OR UPDATE ON pagamento_transacoes
    FOR EACH ROW EXECUTE FUNCTION validar_transacao_ativa();

-- Trigger 5: Prevenir pagamentos duplicados
CREATE OR REPLACE FUNCTION prevenir_pagamento_duplicado()
RETURNS TRIGGER AS $$
DECLARE
    pagamento_existente INTEGER;
BEGIN
    -- Verificar se já existe pagamento idêntico nos últimos 5 minutos
    SELECT id INTO pagamento_existente
    FROM pagamentos p
    WHERE p.pessoa_id = NEW.pessoa_id
    AND p.valor_total = NEW.valor_total
    AND p.data_pagamento = NEW.data_pagamento
    AND p.forma_pagamento = NEW.forma_pagamento
    AND p.criado_em > (CURRENT_TIMESTAMP - INTERVAL '5 minutes')
    AND p.id != COALESCE(NEW.id, -1)
    LIMIT 1;
    
    IF pagamento_existente IS NOT NULL THEN
        RAISE EXCEPTION 'Pagamento duplicado detectado. Pagamento similar foi registrado nos últimos 5 minutos (ID %)', pagamento_existente;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevenir_duplicado
    BEFORE INSERT ON pagamentos
    FOR EACH ROW EXECUTE FUNCTION prevenir_pagamento_duplicado();

-- =============================================
-- 11. TRIGGERS DE INTEGRIDADE (AFTER)
-- =============================================

-- Trigger 6: Validar soma dos detalhes (permite excedentes)
CREATE OR REPLACE FUNCTION validar_pagamento_composto()
RETURNS TRIGGER AS $$
DECLARE
    valor_total_pagamento DECIMAL(10,2);
    soma_detalhes DECIMAL(10,2);
    count_detalhes INTEGER;
BEGIN
    -- Buscar valor total do pagamento
    SELECT valor_total INTO valor_total_pagamento
    FROM pagamentos WHERE id = NEW.pagamento_id;
    
    IF valor_total_pagamento IS NULL THEN
        RAISE EXCEPTION 'Pagamento com ID % não encontrado', NEW.pagamento_id;
    END IF;
    
    -- Calcular soma atual dos detalhes
    SELECT COALESCE(SUM(valor_aplicado), 0), COUNT(*)
    INTO soma_detalhes, count_detalhes
    FROM pagamento_transacoes 
    WHERE pagamento_id = NEW.pagamento_id;
    
    -- Validar se há pelo menos um detalhe
    IF count_detalhes = 0 THEN
        RAISE EXCEPTION 'Pagamento deve ter pelo menos uma transação associada';
    END IF;
    
    -- Validar se valor total é maior ou igual à soma aplicada (permite excedentes)
    IF valor_total_pagamento < soma_detalhes - 0.01 THEN
        RAISE EXCEPTION 'Valor total do pagamento (R$ %) não pode ser menor que a soma dos valores aplicados (R$ %)', 
                       valor_total_pagamento, soma_detalhes;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validar_pagamento_composto
    AFTER INSERT OR UPDATE ON pagamento_transacoes
    FOR EACH ROW EXECUTE FUNCTION validar_pagamento_composto();

-- Trigger 7: Atualizar status das transações
CREATE OR REPLACE FUNCTION atualizar_status_transacao_composta()
RETURNS TRIGGER AS $$
DECLARE
    transacao_id_ref INTEGER;
    pessoa_id_ref INTEGER;
    total_pago_pessoa DECIMAL(10,2);
    total_devido_transacao DECIMAL(10,2);
    total_pago_transacao DECIMAL(10,2);
BEGIN
    -- Determinar transação e pessoa afetadas
    IF TG_OP = 'DELETE' THEN
        transacao_id_ref := OLD.transacao_id;
        SELECT pessoa_id INTO pessoa_id_ref FROM pagamentos WHERE id = OLD.pagamento_id;
    ELSE
        transacao_id_ref := NEW.transacao_id;
        SELECT pessoa_id INTO pessoa_id_ref FROM pagamentos WHERE id = NEW.pagamento_id;
    END IF;
    
    -- Recalcular total pago por esta pessoa nesta transação
    SELECT COALESCE(SUM(pt.valor_aplicado), 0)
    INTO total_pago_pessoa
    FROM pagamento_transacoes pt
    JOIN pagamentos p ON p.id = pt.pagamento_id
    WHERE pt.transacao_id = transacao_id_ref 
    AND p.pessoa_id = pessoa_id_ref;
    
    -- Atualizar valor_pago do participante
    UPDATE transacao_participantes
    SET valor_pago = total_pago_pessoa
    WHERE transacao_id = transacao_id_ref 
    AND pessoa_id = pessoa_id_ref;
    
    -- Recalcular status geral da transação
    SELECT
        COALESCE(SUM(tp.valor_devido), 0),
        COALESCE(SUM(tp.valor_pago), 0)
    INTO total_devido_transacao, total_pago_transacao
    FROM transacao_participantes tp
    WHERE tp.transacao_id = transacao_id_ref;
    
    -- Atualizar status da transação
    UPDATE transacoes SET status_pagamento = CASE
        WHEN total_pago_transacao >= total_devido_transacao THEN 'PAGO_TOTAL'
        WHEN total_pago_transacao > 0 THEN 'PAGO_PARCIAL'
        ELSE 'PENDENTE'
    END
    WHERE id = transacao_id_ref;
    
    -- Retornar registro apropriado
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_atualizar_status_transacao_composta
    AFTER INSERT OR UPDATE OR DELETE ON pagamento_transacoes
    FOR EACH ROW EXECUTE FUNCTION atualizar_status_transacao_composta();

-- =============================================
-- 12. TRIGGER DE PROCESSAMENTO DE EXCEDENTE
-- =============================================

-- Trigger 8: Processar excedente automaticamente
CREATE OR REPLACE FUNCTION processar_excedente_pagamento()
RETURNS TRIGGER AS $$
DECLARE
    total_devido_pessoa DECIMAL(10,2) := 0;
    valor_excedente DECIMAL(10,2) := 0;
    valor_minimo_excedente DECIMAL(10,2);
    auto_criar_receita BOOLEAN;
    descricao_receita TEXT;
    receita_id INTEGER;
    pessoa_pagamento INTEGER;
    data_pagamento_ref DATE;
    forma_pagamento_ref VARCHAR(15);
    proprietario_id_ref INTEGER;
BEGIN
    -- Buscar configurações
    SELECT valor::DECIMAL INTO valor_minimo_excedente
    FROM configuracoes_sistema WHERE chave = 'valor_minimo_excedente';
    
    SELECT valor::BOOLEAN INTO auto_criar_receita
    FROM configuracoes_sistema WHERE chave = 'auto_criar_receita_excedente';
    
    SELECT valor INTO descricao_receita
    FROM configuracoes_sistema WHERE chave = 'descricao_receita_excedente';
    
    -- Buscar dados do pagamento
    SELECT pessoa_id, data_pagamento, forma_pagamento
    INTO pessoa_pagamento, data_pagamento_ref, forma_pagamento_ref
    FROM pagamentos WHERE id = NEW.pagamento_id;
    
    -- Buscar proprietário do sistema
    SELECT id INTO proprietario_id_ref
    FROM pessoas WHERE eh_proprietario = TRUE LIMIT 1;
    
    -- Calcular total devido por esta pessoa em todas as transações deste pagamento
    SELECT COALESCE(SUM(tp.valor_devido - tp.valor_pago), 0)
    INTO total_devido_pessoa
    FROM pagamento_transacoes pt
    JOIN transacao_participantes tp ON tp.transacao_id = pt.transacao_id 
        AND tp.pessoa_id = pessoa_pagamento
    WHERE pt.pagamento_id = NEW.pagamento_id;
    
    -- Calcular excedente
    SELECT valor_total - (
        SELECT COALESCE(SUM(valor_aplicado), 0) 
        FROM pagamento_transacoes 
        WHERE pagamento_id = NEW.pagamento_id
    ) INTO valor_excedente
    FROM pagamentos WHERE id = NEW.pagamento_id;
    
    -- Se há excedente significativo
    IF valor_excedente >= COALESCE(valor_minimo_excedente, 1.00) THEN
        -- Atualizar campo de excedente no pagamento
        UPDATE pagamentos 
        SET valor_excedente = valor_excedente
        WHERE id = NEW.pagamento_id;
        
        -- Se deve criar receita automaticamente
        IF COALESCE(auto_criar_receita, TRUE) AND 
           (SELECT processar_excedente FROM pagamentos WHERE id = NEW.pagamento_id) THEN
            
            -- Criar receita do excedente
            INSERT INTO transacoes (
                tipo, proprietario_id, descricao, local, valor_total, 
                data_transacao, valor_parcela, status_pagamento, 
                observacoes, criado_por
            ) VALUES (
                'RECEITA',
                proprietario_id_ref,
                COALESCE(descricao_receita, 'Excedente de pagamento') || ' - ' || (SELECT nome FROM pessoas WHERE id = pessoa_pagamento),
                'Pagamento ID #' || NEW.pagamento_id,
                valor_excedente,
                data_pagamento_ref,
                valor_excedente,
                'PAGO_TOTAL',
                'Receita gerada automaticamente do excedente de R$ ' || valor_excedente || ' do pagamento via ' || forma_pagamento_ref,
                pessoa_pagamento
            ) RETURNING id INTO receita_id;
            
            -- Vincular receita ao pagamento
            UPDATE pagamentos 
            SET receita_excedente_id = receita_id
            WHERE id = NEW.pagamento_id;
            
            RAISE NOTICE 'Receita automática criada: R$ % (Pagamento #%, Receita #%)', 
                        valor_excedente, NEW.pagamento_id, receita_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_processar_excedente
    AFTER INSERT ON pagamento_transacoes
    FOR EACH ROW EXECUTE FUNCTION processar_excedente_pagamento();

-- =============================================
-- 13. TRIGGERS DE LIMPEZA E MANUTENÇÃO
-- =============================================

-- Trigger 9: Limpeza automática de pagamentos órfãos
CREATE OR REPLACE FUNCTION limpar_pagamentos_orfaos()
RETURNS TRIGGER AS $$
DECLARE
    count_detalhes INTEGER;
BEGIN
    -- Contar quantos detalhes restam para este pagamento
    SELECT COUNT(*) INTO count_detalhes
    FROM pagamento_transacoes
    WHERE pagamento_id = OLD.pagamento_id;
    
    -- Se não há mais detalhes, excluir o pagamento principal
    IF count_detalhes = 0 THEN
        DELETE FROM pagamentos WHERE id = OLD.pagamento_id;
        RAISE NOTICE 'Pagamento % excluído automaticamente por ficar sem detalhes', OLD.pagamento_id;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_limpar_orfaos
    AFTER DELETE ON pagamento_transacoes
    FOR EACH ROW EXECUTE FUNCTION limpar_pagamentos_orfaos();

-- =============================================
-- 14. TRIGGERS PARA RECEITAS
-- =============================================

-- Trigger para garantir que proprietário sempre participa das receitas
CREATE OR REPLACE FUNCTION garantir_proprietario_receita()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.tipo = 'RECEITA' THEN
        INSERT INTO transacao_participantes (
            transacao_id, pessoa_id, eh_proprietario, valor_recebido
        ) VALUES (
            NEW.id, NEW.proprietario_id, TRUE, NEW.valor_total
        ) ON CONFLICT (transacao_id, pessoa_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_proprietario_receita
    AFTER INSERT ON transacoes
    FOR EACH ROW EXECUTE FUNCTION garantir_proprietario_receita();

-- =============================================
-- 15. FUNÇÕES AUXILIARES
-- =============================================

-- Função para calcular saldo de uma pessoa
CREATE OR REPLACE FUNCTION calcular_saldo_pessoa(pessoa_id_param INT)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    receitas DECIMAL(10,2) := 0;
    dividas DECIMAL(10,2) := 0;
BEGIN
    -- Receitas
    SELECT COALESCE(SUM(tp.valor_recebido), 0) INTO receitas
    FROM transacao_participantes tp
    WHERE tp.pessoa_id = pessoa_id_param;
    
    -- Dívidas pendentes
    SELECT COALESCE(SUM(tp.valor_devido - tp.valor_pago), 0) INTO dividas
    FROM transacao_participantes tp
    WHERE tp.pessoa_id = pessoa_id_param
    AND tp.valor_devido > tp.valor_pago;
    
    RETURN receitas - dividas;
END;
$$ LANGUAGE plpgsql;

-- Função para validar soma de valores vs valor total
CREATE OR REPLACE FUNCTION validar_divisao_valores(transacao_id_param INT)
RETURNS BOOLEAN AS $$
DECLARE
    valor_total_transacao DECIMAL(10,2);
    soma_valores_devidos DECIMAL(10,2);
BEGIN
    SELECT valor_total INTO valor_total_transacao
    FROM transacoes WHERE id = transacao_id_param;
    
    SELECT COALESCE(SUM(valor_devido), 0) INTO soma_valores_devidos
    FROM transacao_participantes
    WHERE transacao_id = transacao_id_param;
    
    RETURN ABS(valor_total_transacao - soma_valores_devidos) < 0.01;
END;
$$ LANGUAGE plpgsql;

-- Função para calcular total devido por pessoa em transações específicas
CREATE OR REPLACE FUNCTION calcular_total_devido_pessoa(pessoa_id_param INT, transacoes_ids INT[])
RETURNS DECIMAL(10,2) AS $$
DECLARE
    total_devido DECIMAL(10,2) := 0;
    total_ja_pago DECIMAL(10,2) := 0;
BEGIN
    -- Calcular total devido nas transações especificadas
    SELECT COALESCE(SUM(tp.valor_devido), 0)
    INTO total_devido
    FROM transacao_participantes tp
    WHERE tp.pessoa_id = pessoa_id_param
    AND tp.transacao_id = ANY(transacoes_ids);
    
    -- Calcular total já pago nas transações especificadas
    SELECT COALESCE(SUM(pt.valor_aplicado), 0)
    INTO total_ja_pago
    FROM pagamento_transacoes pt
    JOIN pagamentos p ON p.id = pt.pagamento_id
    WHERE p.pessoa_id = pessoa_id_param
    AND pt.transacao_id = ANY(transacoes_ids);
    
    RETURN total_devido - total_ja_pago;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 16. VIEWS PARA RELATÓRIOS
-- =============================================

CREATE VIEW view_transacoes_completas AS
SELECT
    t.id,
    t.tipo,
    t.descricao,
    t.local,
    t.valor_total,
    t.data_transacao,
    t.status_pagamento,
    t.eh_parcelado,
    t.parcela_atual,
    t.total_parcelas,
    t.valor_parcela,
    p.nome AS proprietario,
    COUNT(DISTINCT tp.pessoa_id) AS total_participantes,
    string_agg(DISTINCT tg.nome, ', ' ORDER BY tg.nome) AS tags,
    COALESCE(SUM(tp.valor_devido), 0) AS total_devido,
    COALESCE(SUM(tp.valor_pago), 0) AS total_pago,
    validar_divisao_valores(t.id) AS divisao_correta
FROM transacoes t
JOIN pessoas p ON p.id = t.proprietario_id
LEFT JOIN transacao_participantes tp ON tp.transacao_id = t.id
LEFT JOIN transacao_tags tt ON tt.transacao_id = t.id
LEFT JOIN tags tg ON tg.id = tt.tag_id
GROUP BY t.id, p.nome;

CREATE VIEW view_saldos_pessoas AS
SELECT
    p.id,
    p.nome,
    p.email,
    p.eh_proprietario,
    p.ativo,
    COALESCE(SUM(tp.valor_recebido), 0) AS total_receitas,
    COALESCE(SUM(tp.valor_devido), 0) AS total_devido,
    COALESCE(SUM(tp.valor_pago), 0) AS total_pago,
    COALESCE(SUM(tp.valor_devido - tp.valor_pago), 0) AS saldo_pendente,
    calcular_saldo_pessoa(p.id) AS saldo_final
FROM pessoas p
LEFT JOIN transacao_participantes tp ON tp.pessoa_id = p.id
WHERE p.ativo = TRUE
GROUP BY p.id, p.nome, p.email, p.eh_proprietario, p.ativo;

-- =============================================
-- 17. COMENTÁRIOS E DOCUMENTAÇÃO
-- =============================================

COMMENT ON TABLE pessoas IS 'Usuários: proprietário e participantes dos gastos';
COMMENT ON TABLE transacoes IS 'Transações: gastos (podem ser só dos amigos) e receitas (só do proprietário)';
COMMENT ON TABLE transacao_participantes IS 'Divisão por valores fixos entre pessoas';
COMMENT ON TABLE pagamentos IS 'Pagamentos compostos: um pagamento pode quitar múltiplas transações';
COMMENT ON TABLE pagamento_transacoes IS 'Detalhamento: quais transações foram pagas por cada pagamento';
COMMENT ON TABLE configuracoes_sistema IS 'Configurações globais do sistema';
COMMENT ON TABLE tags IS 'Categorização das transações';

COMMENT ON COLUMN transacao_participantes.valor_devido IS 'Valor fixo que a pessoa deve pagar';
COMMENT ON COLUMN transacao_participantes.valor_recebido IS 'Valor recebido (apenas para receitas do proprietário)';
COMMENT ON COLUMN transacoes.grupo_parcela IS 'UUID que agrupa parcelas da mesma compra (parcelas podem ter valores diferentes)';
COMMENT ON COLUMN transacoes.status_pagamento IS 'Status automático: PENDENTE|PAGO_PARCIAL|PAGO_TOTAL';
COMMENT ON COLUMN pagamentos.valor_excedente IS 'Valor pago além do devido, convertido em receita automaticamente';
COMMENT ON COLUMN pagamentos.receita_excedente_id IS 'ID da receita gerada automaticamente pelo excedente';
COMMENT ON COLUMN pagamentos.processar_excedente IS 'Se deve processar excedente automaticamente para este pagamento';

-- Comentários explicativos das constraints
COMMENT ON CONSTRAINT data_valida ON transacoes IS 
'Permite transações de até 5 anos atrás até 3 anos no futuro para suporte a parcelamento';

COMMENT ON CONSTRAINT data_pagamento_valida ON pagamentos IS 
'Permite pagamentos de até 5 anos atrás até 1 ano no futuro para agendamento de pagamentos';

COMMENT ON FUNCTION validar_valor_nao_excede_divida() IS 
'Valida participação mas permite excedentes para processamento automático';

-- =============================================
-- SCHEMA APLICADO COM SUCESSO!
-- Versão: 4.0 - Schema Inicial Completo com Sistema de Pagamentos Compostos
-- Inclui: Validações, Triggers, Processamento Automático de Excedentes
-- ============================================= 