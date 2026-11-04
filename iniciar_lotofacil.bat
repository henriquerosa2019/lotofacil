@echo off
title Lotofacil AI - Servidor Local
echo ========================================================
echo        INICIANDO O APLICATIVO LOTOFACIL AI
echo ========================================================
echo.
cd /d "%~dp0"
echo Abrindo em http://localhost:3000 ...
start http://localhost:3000
npm run dev
pause
