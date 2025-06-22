-- =============================================
-- DADOS DE TESTE SIMPLES - PERSONAL EXPENSE HUB
-- =============================================

-- 1. INSERIR PESSOAS (PROPRIETARIO E PARTICIPANTES)
INSERT INTO pessoas (nome, email, senha_hash, eh_proprietario, telefone) VALUES
('Joao Silva', 'joao@example.com', '$2b$10$dummy_hash_1', TRUE, '(11) 99999-9999'),
('Maria Santos', 'maria@example.com', '$2b$10$dummy_hash_2', FALSE, '(11) 88888-8888'),
('Pedro Costa', 'pedro@example.com', '$2b$10$dummy_hash_3', FALSE, '(11) 77777-7777')
ON CONFLICT (email) DO NOTHING;

-- 2. INSERIR TAGS (usando IDs corretos das pessoas)
INSERT INTO tags (nome, cor, icone, criado_por) VALUES
('Casa', '#3B82F6', 'casa', 4),
('Alimentacao', '#10B981', 'comida', 4),
('Transporte', '#F59E0B', 'carro', 4);

-- 3. GASTO SIMPLES (Supermercado - R$ 150,00)
INSERT INTO transacoes (
    tipo, proprietario_id, descricao, local, valor_total, data_transacao,
    eh_parcelado, valor_parcela, criado_por
) VALUES (
    'GASTO', 4, 'Compras do mes', 'Supermercado', 150.00, '2024-01-15',
    FALSE, 150.00, 4
);

-- Participantes do gasto (usando IDs corretos)
INSERT INTO transacao_participantes (transacao_id, pessoa_id, valor_devido, eh_proprietario) VALUES
(CURRVAL('transacoes_id_seq'), 4, 50.00, TRUE),  -- Joao (proprietario)
(CURRVAL('transacoes_id_seq'), 5, 50.00, FALSE), -- Maria  
(CURRVAL('transacoes_id_seq'), 6, 50.00, FALSE); -- Pedro

-- Tags do gasto
INSERT INTO transacao_tags (transacao_id, tag_id) VALUES
(CURRVAL('transacoes_id_seq'), 1), -- Casa
(CURRVAL('transacoes_id_seq'), 2); -- Alimentacao

-- 4. RECEITA SIMPLES (R$ 1000,00)
INSERT INTO transacoes (
    tipo, proprietario_id, descricao, valor_total, data_transacao,
    eh_parcelado, valor_parcela, criado_por
) VALUES (
    'RECEITA', 4, 'Freelance', 1000.00, '2024-01-20',
    FALSE, 1000.00, 4
);

-- 5. PAGAMENTO PARCIAL - Maria paga metade
INSERT INTO pagamentos (transacao_id, pessoa_id, valor_pago, data_pagamento, forma_pagamento, registrado_por) VALUES
((SELECT id FROM transacoes WHERE descricao = 'Compras do mes'), 5, 25.00, '2024-01-16', 'PIX', 4);

-- Comentarios
COMMENT ON TABLE pessoas IS 'Usuarios do sistema';
COMMENT ON TABLE transacoes IS 'Transacoes principais';

-- Estatisticas
DO $$
BEGIN
    RAISE NOTICE '=== DADOS INSERIDOS COM SUCESSO ===';
    RAISE NOTICE 'Pessoas: %', (SELECT COUNT(*) FROM pessoas);
    RAISE NOTICE 'Tags: %', (SELECT COUNT(*) FROM tags);
    RAISE NOTICE 'Transacoes: %', (SELECT COUNT(*) FROM transacoes);
    RAISE NOTICE 'Participacoes: %', (SELECT COUNT(*) FROM transacao_participantes);
    RAISE NOTICE 'Pagamentos: %', (SELECT COUNT(*) FROM pagamentos);
    RAISE NOTICE '====================================';
END $$; 