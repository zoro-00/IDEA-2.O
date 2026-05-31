#!/usr/bin/env bash
# run_demo.sh - Bootstraps the FCCI Demo

echo "====================================================="
echo " FCCI TGNN POC Demo — Cinematic Startup Script"
echo "====================================================="

# 1. Start the Python Backend
echo "[1/2] Starting Demo Server (FastAPI + PyTorch)..."
cd backend
source .venv/Scripts/activate
python demo_server.py &
BACKEND_PID=$!

# 2. Start the Frontend
echo "[2/2] Starting Frontend (Vite + React)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "====================================================="
echo "✅ Demo is running!"
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo "====================================================="
echo "Press Ctrl+C to stop both servers."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
