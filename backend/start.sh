#!/bin/bash
# Railway 啟動腳本

# 從環境變數獲取 PORT，預設為 8000
PORT=${PORT:-8000}

echo "================================"
echo "Starting VentAI Backend"
echo "Port: $PORT"
echo "================================"

# 啟動 uvicorn
exec uvicorn main:app --host 0.0.0.0 --port $PORT --log-level info
