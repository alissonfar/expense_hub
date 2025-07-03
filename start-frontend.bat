@echo off
echo ========================================
echo  INICIANDO FRONTEND - EXPENSE HUB
echo ========================================
echo.

cd frontend

echo Verificando se node_modules existe...
if not exist node_modules (
    echo ❌ node_modules não encontrado!
    echo Execute install-frontend.bat primeiro
    pause
    exit
)

echo ✅ Iniciando servidor de desenvolvimento...
echo.
echo 🚀 Aplicação disponível em: http://localhost:3000
echo.
echo Para parar o servidor, use Ctrl+C
echo.

npm run dev 