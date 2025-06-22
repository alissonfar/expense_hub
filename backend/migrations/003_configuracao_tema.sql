-- =============================================
-- MIGRATION 003 - CONFIGURAÇÃO DE TEMA
-- Personal Expense Hub - Sistema de Configurações
-- =============================================

-- Inserir configuração padrão de tema
INSERT INTO configuracoes_sistema (chave, valor, descricao, criado_em, atualizado_em) VALUES
('theme_interface', 'light', 'Tema da interface do sistema (light, dark, auto)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (chave) DO NOTHING;

-- Comentários descritivos
COMMENT ON TABLE configuracoes_sistema IS 'Configurações personalizáveis do sistema';

-- Verificação dos dados
DO $$
DECLARE
    rec RECORD;
BEGIN
    RAISE NOTICE '=== MIGRATION 003 - CONFIGURAÇÃO DE TEMA ===';
    RAISE NOTICE 'Configuração de tema adicionada com sucesso';
    RAISE NOTICE 'Total de configurações: %', (SELECT COUNT(*) FROM configuracoes_sistema);
    RAISE NOTICE 'Configurações existentes:';
    
    -- Listar todas as configurações
    FOR rec IN SELECT chave, valor, descricao FROM configuracoes_sistema ORDER BY chave
    LOOP
        RAISE NOTICE '  - %: % (%)', rec.chave, rec.valor, rec.descricao;
    END LOOP;
    
    RAISE NOTICE '================================================';
END $$; 