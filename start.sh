#!/bin/bash

# Kill any existing processes on ports 3000 and 8000
echo "Cleaning up ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:8000 | xargs kill -9 2>/dev/null

# Start Backend
echo "Starting Backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "Starting Frontend..."
cd frontend
npm install
npm run dev &
FRONTEND_PID=$!

# Handle exit
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

echo "VentAI is running!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"

wait
