#!/bin/bash

# VentAI 快速部署腳本
# 此腳本會依序部署後端和前端到 Vercel

echo "=========================================="
echo "   VentAI Vercel 部署腳本"
echo "=========================================="
echo ""

# 顏色設定
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查 Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  未安裝 Vercel CLI${NC}"
    echo "請先執行: npm install -g vercel"
    exit 1
fi

echo -e "${BLUE}📦 步驟 1: 部署後端${NC}"
echo "----------------------------"
cd backend

echo "正在部署後端到 Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 後端部署成功！${NC}"
    echo ""
    echo -e "${YELLOW}請記下後端 URL，例如: https://ventai-backend-xxx.vercel.app${NC}"
    echo ""
    read -p "按 Enter 繼續部署前端..."
else
    echo "❌ 後端部署失敗"
    exit 1
fi

cd ..

echo ""
echo -e "${BLUE}📦 步驟 2: 部署前端${NC}"
echo "----------------------------"
cd frontend

echo "正在部署前端到 Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 前端部署成功！${NC}"
    echo ""
    echo -e "${YELLOW}請記下前端 URL，例如: https://ventai-frontend-xxx.vercel.app${NC}"
else
    echo "❌ 前端部署失敗"
    exit 1
fi

cd ..

echo ""
echo "=========================================="
echo -e "${GREEN}🎉 部署完成！${NC}"
echo "=========================================="
echo ""
echo "接下來請完成以下步驟："
echo ""
echo "1. 前往 Vercel Dashboard 設定後端環境變數："
echo "   - FRONTEND_URL=<你的前端URL>"
echo "   - OPENAI_API_KEY=<你的OpenAI Key>（可選）"
echo ""
echo "2. 前往 Vercel Dashboard 設定前端環境變數："
echo "   - NEXT_PUBLIC_API_URL=<你的後端URL>"
echo "   - NEXT_PUBLIC_WS_URL=wss://<你的後端URL主機名>"
echo ""
echo "3. 在各自專案中重新部署以套用環境變數："
echo "   cd backend && vercel --prod"
echo "   cd frontend && vercel --prod"
echo ""
echo "詳細說明請參考: VERCEL_DEPLOYMENT.md"
echo ""
