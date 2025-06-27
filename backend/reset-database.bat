@echo off
echo ==========================================
echo   RESET DO BANCO DE DADOS - EXPENSE HUB
echo ==========================================
echo.

echo 🔄 Iniciando reset do banco de dados...
echo.

REM Verificar se o Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js não encontrado!
    echo 💡 Instale o Node.js em: https://nodejs.org/
    pause
    exit /b 1
)

REM Verificar se as dependências estão instaladas
if not exist "node_modules" (
    echo 📦 Instalando dependências...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ Erro ao instalar dependências!
        pause
        exit /b 1
    )
)

REM Executar o script de reset
echo 🚀 Executando script de reset...
node scripts/reset-database.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ Erro durante o reset!
    echo.
    echo 🔧 SOLUÇÕES POSSÍVEIS:
    echo    • Verifique se o PostgreSQL está rodando
    echo    • Confirme se a senha está correta
    echo    • Execute: npm run db:setup (se o banco não existir)
    echo    • Verifique as permissões do usuário postgres
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Reset concluído com sucesso!
echo.
echo 📋 PRÓXIMOS PASSOS:
echo    1. Execute: npm run db:generate
echo    2. Execute: npm run dev
echo    3. Acesse: http://localhost:3001/api/test-db
echo    4. Faça login com os dados de teste
echo.
pause 