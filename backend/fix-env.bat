@echo off
echo ==========================================
echo   CORREÇÃO DO ARQUIVO .ENV - EXPENSE HUB
echo ==========================================
echo.

echo 🔧 Corrigindo arquivo .env...
echo.

REM Solicitar senha do PostgreSQL
set /p SENHA="🔑 Digite a senha do usuário postgres: "

REM Criar novo arquivo .env
echo # Personal Expense Hub - Backend Environment Variables > .env
echo. >> .env
echo # Database >> .env
echo DATABASE_URL="postgresql://postgres:%SENHA%@localhost:5432/personal_expense_hub" >> .env
echo. >> .env
echo # Authentication >> .env
echo JWT_SECRET="personal-expense-hub-super-secret-jwt-key-2024" >> .env
echo JWT_EXPIRES_IN="7d" >> .env
echo BCRYPT_ROUNDS=12 >> .env
echo. >> .env
echo # Server >> .env
echo PORT=3001 >> .env
echo NODE_ENV=development >> .env
echo. >> .env
echo # CORS >> .env
echo FRONTEND_URL="http://localhost:3000" >> .env
echo. >> .env
echo # Rate Limiting >> .env
echo RATE_LIMIT_WINDOW_MS=900000 >> .env
echo RATE_LIMIT_MAX_REQUESTS=100 >> .env
echo. >> .env
echo # Prisma >> .env
echo SHADOW_DATABASE_URL="postgresql://postgres:%SENHA%@localhost:5432/personal_expense_hub_shadow" >> .env

echo ✅ Arquivo .env corrigido com sucesso!
echo.
echo 📋 PRÓXIMOS PASSOS:
echo    1. Execute: test-connection.bat (para testar conexão)
echo    2. Execute: npm run db:reset (para resetar banco)
echo    3. Execute: npm run dev (para iniciar servidor)
echo.
pause 