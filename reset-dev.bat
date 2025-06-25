@echo off
title Personal Expense Hub - Reset Completo
color 0E

echo.
echo =========================================
echo   PERSONAL EXPENSE HUB - RESET
echo =========================================
echo.
echo ATENCAO: Este script ira:
echo - Parar todos os processos Node.js
echo - Remover node_modules do backend e frontend
echo - Limpar caches do npm
echo - Reinstalar todas as dependencias
echo.
echo Isso pode demorar alguns minutos...
echo.
set /p confirm="Deseja continuar? (S/N): "
if /i not "%confirm%"=="S" (
    echo Operacao cancelada.
    pause
    exit /b 0
)

echo.
echo [1/8] Parando processos...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.cmd >nul 2>&1

echo [2/8] Limpando portas...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo [3/8] Removendo node_modules do backend...
if exist "backend\node_modules" (
    rmdir /s /q "backend\node_modules"
)

echo [4/8] Removendo node_modules do frontend...
if exist "frontend\node_modules" (
    rmdir /s /q "frontend\node_modules"
)

echo [5/8] Limpando cache do npm...
npm cache clean --force >nul 2>&1

echo [6/8] Reinstalando dependencias do backend...
cd backend
npm install
if errorlevel 1 (
    echo ERRO: Falha ao instalar dependencias do backend!
    pause
    exit /b 1
)

echo [7/8] Reinstalando dependencias do frontend...
cd ..\frontend
npm install
if errorlevel 1 (
    echo ERRO: Falha ao instalar dependencias do frontend!
    pause
    exit /b 1
)

cd ..

echo [8/8] Limpando caches do Next.js...
if exist "frontend\.next" (
    rmdir /s /q "frontend\.next"
)

echo.
echo =========================================
echo   RESET COMPLETO FINALIZADO!
echo =========================================
echo.
echo ✓ Processos finalizados
echo ✓ node_modules removidos e reinstalados
echo ✓ Caches limpos
echo ✓ Ambiente resetado
echo.
echo Agora voce pode executar: start-dev.bat
echo.
pause 