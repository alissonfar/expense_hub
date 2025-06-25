@echo off
title Personal Expense Hub - Iniciador
color 0A

echo.
echo =========================================
echo   PERSONAL EXPENSE HUB - INICIADOR
echo =========================================
echo.
echo Iniciando aplicacao em modo desenvolvimento...
echo.

REM Verificar se estamos no diretorio correto
if not exist "backend" (
    echo ERRO: Pasta 'backend' nao encontrada!
    echo Certifique-se de executar este script na pasta raiz do projeto.
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ERRO: Pasta 'frontend' nao encontrada!
    echo Certifique-se de executar este script na pasta raiz do projeto.
    pause
    exit /b 1
)

echo [1/4] Verificando dependencias do backend...
cd backend
if not exist "node_modules" (
    echo Instalando dependencias do backend...
    npm install
    if errorlevel 1 (
        echo ERRO: Falha ao instalar dependencias do backend!
        pause
        exit /b 1
    )
)

echo [2/4] Verificando dependencias do frontend...
cd ..\frontend
if not exist "node_modules" (
    echo Instalando dependencias do frontend...
    npm install
    if errorlevel 1 (
        echo ERRO: Falha ao instalar dependencias do frontend!
        pause
        exit /b 1
    )
)

cd ..

echo [3/4] Iniciando BACKEND (Porta 3001)...
start "Backend - Personal Expense Hub" cmd /k "cd backend && echo BACKEND INICIANDO... && npm run dev"

echo [4/4] Aguardando 3 segundos e iniciando FRONTEND (Porta 3000)...
timeout /t 3 /nobreak >nul

start "Frontend - Personal Expense Hub" cmd /k "cd frontend && echo FRONTEND INICIANDO... && npm run dev"

echo.
echo =========================================
echo   APLICACAO INICIADA COM SUCESSO!
echo =========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Duas janelas foram abertas:
echo - Janela do Backend (API)
echo - Janela do Frontend (Interface)
echo.
echo Para PARAR a aplicacao:
echo - Pressione Ctrl+C em cada janela
echo - Ou feche as janelas diretamente
echo.
echo Pressione qualquer tecla para abrir o navegador...
pause >nul

REM Abrir o navegador automaticamente
start http://localhost:3000

echo.
echo Aplicacao rodando! Verifique as janelas abertas.
echo.
pause 