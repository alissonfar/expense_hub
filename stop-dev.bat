@echo off
title Personal Expense Hub - Parar Aplicacao
color 0C

echo.
echo =========================================
echo   PERSONAL EXPENSE HUB - PARAR
echo =========================================
echo.
echo Parando todos os processos Node.js...
echo.

REM Parar todos os processos node.exe
taskkill /f /im node.exe >nul 2>&1

REM Parar processos npm
taskkill /f /im npm.cmd >nul 2>&1

REM Limpar porta 3000 se estiver ocupada
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /f /pid %%a >nul 2>&1
)

REM Limpar porta 3001 se estiver ocupada
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo ✓ Processos Node.js finalizados
echo ✓ Portas 3000 e 3001 liberadas
echo.
echo Aplicacao parada com sucesso!
echo.
pause 