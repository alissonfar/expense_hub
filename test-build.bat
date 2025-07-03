@echo off
echo ========================================
echo  TESTANDO BUILD DO FRONTEND
echo ========================================
echo.

cd frontend

echo [1/3] Verificando TypeScript...
npx tsc --noEmit --pretty

echo.
echo [2/3] Verificando ESLint...
npx eslint . --ext .ts,.tsx --max-warnings 0

echo.
echo [3/3] Testando build...
npm run build

echo.
echo ========================================
echo ✅ TESTE CONCLUÍDO!
echo ========================================
pause 