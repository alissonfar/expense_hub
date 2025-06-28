@echo off
echo ==========================================
echo   TESTE DE CONEXÃO - EXPENSE HUB
echo ==========================================
echo.

echo 🔍 Testando conexão com o banco de dados...
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

REM Executar o script de teste
echo 🚀 Executando teste de conexão...
node scripts/test-connection.js

if %errorlevel% neq 0 (
    echo.
    echo ❌ Erro durante o teste!
    echo.
    echo 🔧 SOLUÇÕES POSSÍVEIS:
    echo    • Verifique se o PostgreSQL está rodando
    echo    • Confirme se a senha está correta
    echo    • Verifique se a porta 5432 está disponível
    echo    • Execute como administrador se necessário
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Teste concluído!
echo.
pause 