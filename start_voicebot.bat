@echo off
title Voicebot Starter

echo Starte lokalen llama.cpp Server...
start "Llama Server" cmd /k "cd /d C:\llama.cpp && llama-server.exe -m "C:\Users\Yazan\Desktop\Bachlor_Latex\bachelor_voicebot\models\Llama-3.2-3B-Instruct-Q4_K_L.gguf" -c 2048 --host 127.0.0.1 --port 8080"

timeout /t 8 /nobreak

echo Starte Flask Backend...
start "Voicebot Backend" cmd /k "cd /d C:\Users\Yazan\Desktop\Bachlor_Latex\bachelor_voicebot && .venv311\Scripts\activate && python app.py"

timeout /t 4 /nobreak

echo Starte React Frontend...
start "Voicebot Frontend" cmd /k "cd /d C:\Users\Yazan\Desktop\Bachlor_Latex\bachelor_voicebot\frontend && npm run dev"

timeout /t 3 /nobreak

echo Voicebot wurde gestartet.
echo Öffne Browser...
start msedge http://localhost:5173

pause