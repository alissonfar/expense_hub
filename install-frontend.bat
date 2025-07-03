@echo off
echo ========================================
echo  INSTALANDO FRONTEND - EXPENSE HUB
echo ========================================
echo.

cd frontend

echo [1/4] Limpando cache do npm...
npm cache clean --force

echo [2/4] Removendo node_modules antigos...
if exist node_modules (
    rmdir /s /q node_modules
)

echo [3/4] Removendo package-lock.json antigo...
if exist package-lock.json (
    del package-lock.json
)

echo [4/4] Instalando dependências...
npm install

echo.
echo ========================================
echo ✅ INSTALAÇÃO CONCLUÍDA!
echo ========================================
echo.
echo Para iniciar o projeto, use:
echo   npm run dev
echo.
echo Ou execute start-frontend.bat
echo.
pause 