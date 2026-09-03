@echo off
title HybridTracker - Servidor de demonstracao
cd /d "%~dp0"
echo.
echo ==========================================
echo   HYBRIDTRACKER - DEMONSTRACAO
echo ==========================================
echo.
echo Mantenha esta janela aberta durante a apresentacao.
echo O navegador sera aberto automaticamente.
echo.
start "" "http://localhost:5173/treino"
"C:\Program Files\nodejs\node.exe" "node_modules\vite\bin\vite.js" --configLoader runner --host 0.0.0.0
echo.
echo O servidor foi encerrado. Pressione qualquer tecla para fechar.
pause >nul
