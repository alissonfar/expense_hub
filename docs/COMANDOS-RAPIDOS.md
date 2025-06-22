# ⚡ COMANDOS RÁPIDOS - PERSONAL EXPENSE HUB

> **Status:** FASE 3.9 CONCLUÍDA - Backend 100% Finalizado com Sistema de Configurações  
> **Última atualização:** 22/01/2025

## 🚀 **COMANDOS DIÁRIOS**

### **Iniciar o Projeto**
```bash
# 1. Ir para o backend
cd backend

# 2. Instalar dependências (primeira vez)
npm install

# 3. Gerar cliente Prisma
npx prisma generate

# 4. Iniciar servidor de desenvolvimento
npm run dev
# → Servidor rodando em http://localhost:3001
```

### **Verificar Status**
```bash
# Health check do servidor
curl http://localhost:3001/health

# Listar todos os endpoints implementados
curl http://localhost:3001/api/auth/info
curl http://localhost:3001/api/pessoas/info
curl http://localhost:3001/api/tags/info
curl http://localhost:3001/api/transacoes/info
curl http://localhost:3001/api/pagamentos/info
curl http://localhost:3001/api/relatorios/info
curl http://localhost:3001/api/configuracoes/info
```

---

## 🧪 **COMANDOS DE TESTE**

### **Testar Autenticação**
```bash
# 1. Registrar usuário
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"João Silva","email":"joao@teste.com","senha":"MinhaSenh@123"}'

# 2. Fazer login (copiar o token da resposta)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@teste.com","senha":"MinhaSenh@123"}'

# 3. Testar rota protegida (usar token do passo 2)
curl -X GET http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### **Testar CRUD de Pessoas**
```bash
# Listar pessoas (usar token)
curl -X GET http://localhost:3001/api/pessoas \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Criar pessoa (apenas proprietário)
curl -X POST http://localhost:3001/api/pessoas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"nome":"Maria Santos","email":"maria@teste.com"}'
```

### **Testar CRUD de Tags**
```bash
# Listar tags
curl -X GET http://localhost:3001/api/tags \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# Criar tag
curl -X POST http://localhost:3001/api/tags \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"nome":"Alimentação","cor":"#FF6B35"}'
```

### **Testar CRUD de Transações (Gastos)**
```bash
# Criar gasto simples
curl -X POST http://localhost:3001/api/transacoes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "descricao":"Jantar em restaurante",
    "valor_total":120.00,
    "data_transacao":"2025-01-20",
    "local":"Restaurante ABC",
    "participantes":[
      {"pessoa_id":1,"valor_pessoa":60.00},
      {"pessoa_id":2,"valor_pessoa":60.00}
    ]
  }'

# Criar gasto parcelado (3 parcelas)
curl -X POST http://localhost:3001/api/transacoes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "descricao":"Compra no cartão",
    "valor_total":300.00,
    "data_transacao":"2025-01-20",
    "eh_parcelado":true,
    "total_parcelas":3,
    "participantes":[
      {"pessoa_id":1,"valor_pessoa":150.00},
      {"pessoa_id":2,"valor_pessoa":150.00}
    ]
  }'

# Listar transações
curl -X GET http://localhost:3001/api/transacoes \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### **Testar CRUD de Receitas**
```bash
# Criar receita
curl -X POST http://localhost:3001/api/transacoes/receita \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "descricao":"Salário Janeiro",
    "local":"Empresa XYZ",
    "valor_recebido":5000.00,
    "data_transacao":"2025-01-05",
    "observacoes":"Salário mensal",
    "tags":[1,2]
  }'

# Editar receita
curl -X PUT http://localhost:3001/api/transacoes/receita/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "descricao":"Salário Janeiro (Atualizado)",
    "valor_recebido":5200.00,
    "observacoes":"Salário + bônus"
  }'

# Testar validação de valor negativo (deve falhar)
curl -X POST http://localhost:3001/api/transacoes/receita \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "descricao":"Teste erro",
    "valor_recebido":-100.00,
    "data_transacao":"2025-01-20"
  }'
```

### **Testar Sistema de Relatórios Avançados** ✅ **← NOVO!**
```bash
# 1. Testar relatório de saldos
curl -X GET http://localhost:3001/api/relatorios/saldos \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# 2. Testar dashboard com gráficos
curl -X GET "http://localhost:3001/api/relatorios/dashboard?periodo=30_dias&incluir_graficos=true" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# 3. Testar relatório de pendências
curl -X GET "http://localhost:3001/api/relatorios/pendencias?incluir_detalhes=true&ordenar_por=valor&ordem=desc" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# 4. Testar relatório completo de transações
curl -X GET "http://localhost:3001/api/relatorios/transacoes?data_inicio=2024-01-01&data_fim=2025-12-31&tipo=GASTO&incluir_participantes=true&incluir_tags=true" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# 5. Testar análise por categorias
curl -X GET "http://localhost:3001/api/relatorios/categorias?data_inicio=2024-01-01&data_fim=2025-12-31&incluir_sem_categoria=true&ordenar_por=valor&limite=10" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# 6. Testar filtros avançados
curl -X GET "http://localhost:3001/api/relatorios/transacoes?data_inicio=2025-01-01&data_fim=2025-03-31&tipo=GASTO&pessoa_ids=5,17&confirmado=true&valor_min=50&valor_max=500&ordenar_por=valor&ordem=desc&limite=20" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### **Testar Sistema de Pagamentos Compostos**
```bash
# 1. Listar pagamentos
curl -X GET http://localhost:3001/api/pagamentos \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# 2. Criar pagamento individual (com excedente)
curl -X POST http://localhost:3001/api/pagamentos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "transacao_id": 32,
    "valor_pago": 20.00,
    "observacoes": "Pagamento com excedente de R$ 10"
  }'

# 3. Criar pagamento composto (múltiplas transações)
curl -X POST http://localhost:3001/api/pagamentos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "valor_total": 100.00,
    "transacoes": [
      {"transacao_id": 30, "valor_aplicado": 50.00},
      {"transacao_id": 31, "valor_aplicado": 30.00},
      {"transacao_id": 32, "valor_aplicado": 20.00}
    ],
    "observacoes": "Pagamento de fim de mês"
  }'

# 4. Buscar detalhes de um pagamento
curl -X GET http://localhost:3001/api/pagamentos/1 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# 5. Buscar configurações de excedente
curl -X GET http://localhost:3001/api/pagamentos/configuracoes/excedente \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# 6. Atualizar configurações de excedente (apenas proprietário)
curl -X PUT http://localhost:3001/api/pagamentos/configuracoes/excedente \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "processar_excedente": true,
    "valor_minimo_excedente": 5.00,
    "criar_receita_automatica": true,
    "descricao_padrao_receita": "Excedente de pagamento automático"
  }'

# 7. Atualizar um pagamento
curl -X PUT http://localhost:3001/api/pagamentos/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "observacoes": "Observação atualizada"
  }'

# 8. Excluir um pagamento
curl -X DELETE http://localhost:3001/api/pagamentos/1 \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# 9. Testar validação de participação (deve falhar se não participar)
curl -X POST http://localhost:3001/api/pagamentos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "transacao_id": 999,
    "valor_pago": 50.00
  }'

# 10. Listar com filtros
curl -X GET "http://localhost:3001/api/pagamentos?data_inicio=2025-01-01&data_fim=2025-01-31&limite=10" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### **Testar Sistema de Configurações Escalável** ✅ **← NOVO!**
```bash
# 1. Verificar configurações atuais de tema
curl -X GET http://localhost:3001/api/configuracoes/interface \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# 2. Alterar tema para dark (apenas proprietário)
curl -X PUT http://localhost:3001/api/configuracoes/interface \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"theme_interface": "dark"}'

# 3. Alterar tema para auto (detecção automática)
curl -X PUT http://localhost:3001/api/configuracoes/interface \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"theme_interface": "auto"}'

# 4. Voltar para tema light
curl -X PUT http://localhost:3001/api/configuracoes/interface \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"theme_interface": "light"}'

# 5. Testar validação (deve falhar)
curl -X PUT http://localhost:3001/api/configuracoes/interface \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"theme_interface": "purple"}'

# 6. Testar acesso sem permissão (deve falhar se não for proprietário)
curl -X PUT http://localhost:3001/api/configuracoes/interface \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_DE_PARTICIPANTE" \
  -d '{"theme_interface": "dark"}'

# 7. Verificar endpoints de configurações futuras (devem retornar 501)
curl -X GET http://localhost:3001/api/configuracoes/comportamento \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

curl -X GET http://localhost:3001/api/configuracoes/alertas \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

curl -X GET http://localhost:3001/api/configuracoes/relatorios \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

---

## 🗄️ **COMANDOS DE BANCO**

### **PostgreSQL**
```bash
# Conectar ao banco (substitua as credenciais)
psql -U usuario -d personal_expense_hub -h localhost

# Dentro do psql:
\dt                    # Listar tabelas
\d transacoes         # Descrever tabela
SELECT * FROM pessoas WHERE ativo = true;
SELECT * FROM transacoes ORDER BY created_at DESC LIMIT 5;

# Verificar receitas criadas
SELECT t.*, tp.valor_pessoa 
FROM transacoes t 
JOIN transacao_participantes tp ON t.id = tp.transacao_id 
WHERE t.tipo = 'RECEITA' 
ORDER BY t.created_at DESC;

# Verificar pagamentos compostos
SELECT 
  p.id,
  p.valor_total,
  p.valor_excedente,
  p.data_pagamento,
  pe.nome as pagador,
  COUNT(pt.transacao_id) as total_transacoes
FROM pagamentos p
JOIN pessoas pe ON p.pessoa_id = pe.id
LEFT JOIN pagamento_transacoes pt ON p.id = pt.pagamento_id
GROUP BY p.id, p.valor_total, p.valor_excedente, p.data_pagamento, pe.nome
ORDER BY p.created_at DESC;

# Verificar excedentes processados
SELECT 
  p.id as pagamento_id,
  p.valor_excedente,
  p.receita_excedente_id,
  t.descricao as receita_criada
FROM pagamentos p
LEFT JOIN transacoes t ON p.receita_excedente_id = t.id
WHERE p.valor_excedente > 0
ORDER BY p.created_at DESC;

# Verificar configurações do sistema  
SELECT * FROM configuracoes_sistema ORDER BY chave;

# Verificar configurações específicas
SELECT * FROM configuracoes_sistema WHERE chave LIKE 'excedente_%';
SELECT * FROM configuracoes_sistema WHERE chave = 'theme_interface';
```

### **Prisma**
```bash
cd backend

# Gerar cliente após mudanças no schema
npx prisma generate

# Ver dados no Prisma Studio (interface visual)
npx prisma studio
# → Abre em http://localhost:5555
```

---

## 🔧 **COMANDOS DE DESENVOLVIMENTO**

### **TypeScript**
```bash
cd backend

# Verificar tipos
npx tsc --noEmit

# Build do projeto
npm run build

# Executar versão compilada
npm start
```

### **Testes e Validação**
```bash
# Executar scripts de teste
node scripts/test-prisma.js
node scripts/test-advanced.js

# Verificar estrutura do banco
node scripts/test-structure.js
```

### **Logs e Debug**
```bash
# Ver logs do servidor em tempo real
tail -f logs/app.log

# Debug específico (se configurado)
DEBUG=express:* npm run dev
```

---

## 📊 **COMANDOS DE MONITORAMENTO**

### **Performance**
```bash
# Verificar uso de memória
ps aux | grep node

# Monitorar conexões do banco
netstat -an | grep 5432

# Ver processos Node.js
pgrep -f node
```

### **Health Checks**
```bash
# Status completo do sistema
curl http://localhost:3001/health

# Verificar conectividade do banco
curl http://localhost:3001/api/auth/info | jq '.database_status'

# Testar endpoints principais
for endpoint in auth pessoas tags transacoes pagamentos relatorios; do
  echo "Testing $endpoint..."
  curl -s http://localhost:3001/api/$endpoint/info | jq '.status'
done
```

---

## 🚀 **COMANDOS DE DEPLOY**

### **Preparação**
```bash
# Build de produção
npm run build

# Testar build local
NODE_ENV=production npm start

# Verificar variáveis de ambiente
env | grep -E "(DATABASE_URL|JWT_SECRET|PORT)"
```

### **Railway/Render Deploy**
```bash
# Conectar ao Railway (se usando)
railway login
railway link
railway up

# Ou para Render, seguir processo via Git
git add .
git commit -m "Deploy: Sistema de pagamentos compostos implementado"
git push origin main
```

---

## 📋 **COMANDOS DE BACKUP**

### **Backup do Banco**
```bash
# Backup completo
pg_dump -U usuario -h localhost personal_expense_hub > backup_$(date +%Y%m%d).sql

# Backup apenas estrutura
pg_dump -U usuario -h localhost --schema-only personal_expense_hub > schema_backup.sql

# Backup apenas dados
pg_dump -U usuario -h localhost --data-only personal_expense_hub > data_backup.sql
```

### **Restaurar Backup**
```bash
# Restaurar backup completo
psql -U usuario -h localhost personal_expense_hub < backup_20250121.sql

# Aplicar apenas schema
psql -U usuario -h localhost personal_expense_hub < schema_backup.sql
```

---

## 🎯 **COMANDOS ESPECÍFICOS DO PROJETO**

### **Reset do Ambiente**
```bash
# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Regenerar Prisma
npx prisma generate

# Aplicar migrations (se necessário)
psql -U usuario -h localhost personal_expense_hub < migrations/001_initial_schema.sql
```

### **Verificação Completa**
```bash
# Script completo de verificação
echo "🔍 Verificando sistema..."
curl -s http://localhost:3001/health && echo "✅ Servidor OK"
curl -s http://localhost:3001/api/auth/info | jq '.endpoints | length' && echo "✅ Endpoints OK"
node scripts/test-prisma.js && echo "✅ Prisma OK"
echo "🎉 Sistema funcionando!"
```

---

## 📚 **COMANDOS DE DOCUMENTAÇÃO**

### **Gerar Documentação**
```bash
# Documentação das APIs (se usando ferramentas)
npx swagger-jsdoc -d swaggerDef.js routes/*.js

# Extrair esquemas Zod para documentação
node scripts/extract-schemas.js
```

### **Estatísticas do Projeto**
```bash
# Contar linhas de código
find . -name "*.ts" -not -path "./node_modules/*" | xargs wc -l

# Contar endpoints implementados
grep -r "router\." routes/ | wc -l

# Verificar coverage de testes (se configurado)
npm run test:coverage
```

---

## 🎊 **STATUS ATUAL**

**✅ 40 endpoints funcionando**  
**✅ Sistema de pagamentos compostos implementado**  
**✅ Sistema de relatórios avançados implementado**  
**✅ Processamento automático de excedentes**  
**✅ 10 triggers automáticos funcionando**  
**✅ Validações robustas em português**  
**✅ Performance otimizada (100% Prisma ORM)**  
**✅ Union types para máxima flexibilidade**  
**✅ TypeScript type-safe em todas as operações**  

**🚀 Backend completo! Pronto para partir para o frontend!**