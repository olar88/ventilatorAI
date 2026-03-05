# VentAI Vercel 部署指南

本文件說明如何將 VentAI 前後端分別部署到 Vercel，並確保 API 連接正常。

## 📋 目錄

- [前置準備](#前置準備)
- [後端部署 (Backend)](#後端部署-backend)
- [前端部署 (Frontend)](#前端部署-frontend)
- [環境變數設定](#環境變數設定)
- [測試連接](#測試連接)
- [常見問題](#常見問題)

---

## 前置準備

### 1. 安裝 Vercel CLI

```bash
npm install -g vercel
```

### 2. 登入 Vercel

```bash
vercel login
```

### 3. 確認 Git 版控

確保專案已經 push 到 GitHub/GitLab/Bitbucket：

```bash
# 初始化 Git（如果尚未初始化）
git init

# 添加所有檔案
git add .

# 提交變更
git commit -m "準備部署到 Vercel"

# 推送到遠端儲存庫
git remote add origin <your-git-repo-url>
git push -u origin main
```

---

## 後端部署 (Backend)

### 步驟 1: 準備後端配置

後端配置檔案已自動生成：
- `backend/vercel.json` - Vercel 配置
- `backend/api/index.py` - Serverless function 入口

### 步驟 2: 部署後端

```bash
# 進入後端目錄
cd backend

# 部署到 Vercel
vercel

# 根據提示選擇：
# - Set up and deploy "~/path/to/VentAI_1/backend"? [Y/n] → Y
# - Which scope do you want to deploy to? → 選擇你的帳號
# - Link to existing project? [y/N] → N
# - What's your project's name? → ventai-backend（或其他名稱）
# - In which directory is your code located? → ./（當前目錄）

# 部署到生產環境
vercel --prod
```

### 步驟 3: 記錄後端 URL

部署完成後，Vercel 會顯示你的後端 URL，例如：
```
https://ventai-backend.vercel.app
```

**重要：記下這個 URL，稍後前端會需要它！**

### 步驟 4: 設定後端環境變數

在 Vercel Dashboard 中設定環境變數：

1. 前往 https://vercel.com/dashboard
2. 選擇你的後端專案 `ventai-backend`
3. 進入 **Settings** → **Environment Variables**
4. 添加以下變數：

   ```
   OPENAI_API_KEY=your_actual_openai_api_key_here
   ```

   （如果不需要 AI 功能，可以跳過此步驟）

5. 重新部署以套用環境變數：

   ```bash
   vercel --prod
   ```

---

## 前端部署 (Frontend)

### 步驟 1: 設定前端環境變數

在本地創建 `.env.production` 檔案（用於生產環境）：

```bash
cd frontend
```

創建 `frontend/.env.production` 檔案：

```env
# 替換成你的後端 URL（從上一步獲得）
NEXT_PUBLIC_API_URL=https://ventai-backend.vercel.app
NEXT_PUBLIC_WS_URL=wss://ventai-backend.vercel.app
```

### 步驟 2: 更新後端 CORS 設定

前往 Vercel Dashboard → 後端專案 → **Settings** → **Environment Variables**，添加：

```
FRONTEND_URL=https://your-frontend-url.vercel.app
```

> **注意：** 此時還不知道前端 URL，可以先跳過，等前端部署完成後再回來設定。

### 步驟 3: 部署前端

```bash
# 確保在 frontend 目錄
cd frontend

# 部署到 Vercel
vercel

# 根據提示選擇：
# - Set up and deploy "~/path/to/VentAI_1/frontend"? [Y/n] → Y
# - Which scope do you want to deploy to? → 選擇你的帳號
# - Link to existing project? [y/N] → N
# - What's your project's name? → ventai-frontend（或其他名稱）
# - In which directory is your code located? → ./（當前目錄）

# 部署到生產環境
vercel --prod
```

### 步驟 4: 記錄前端 URL

部署完成後，你會得到前端 URL，例如：
```
https://ventai-frontend.vercel.app
```

### 步驟 5: 更新前端環境變數

在 Vercel Dashboard 中設定前端環境變數：

1. 前往 https://vercel.com/dashboard
2. 選擇你的前端專案 `ventai-frontend`
3. 進入 **Settings** → **Environment Variables**
4. 添加以下變數：

   ```
   NEXT_PUBLIC_API_URL=https://ventai-backend.vercel.app
   NEXT_PUBLIC_WS_URL=wss://ventai-backend.vercel.app
   ```

5. 重新部署：

   ```bash
   vercel --prod
   ```

### 步驟 6: 更新後端 CORS

回到後端專案，設定 `FRONTEND_URL` 環境變數：

1. 前往 Vercel Dashboard → 後端專案
2. **Settings** → **Environment Variables**
3. 添加：

   ```
   FRONTEND_URL=https://ventai-frontend.vercel.app
   ```

4. 重新部署後端：

   ```bash
   cd backend
   vercel --prod
   ```

---

## 環境變數設定

### 後端環境變數（`backend/`）

在 Vercel Dashboard 設定：

| 變數名稱 | 說明 | 必填 | 範例 |
|---------|------|------|------|
| `OPENAI_API_KEY` | OpenAI API 金鑰 | ❌ | `sk-...` |
| `FRONTEND_URL` | 前端網址（CORS） | ✅ | `https://ventai-frontend.vercel.app` |

### 前端環境變數（`frontend/`）

在 Vercel Dashboard 設定：

| 變數名稱 | 說明 | 必填 | 範例 |
|---------|------|------|------|
| `NEXT_PUBLIC_API_URL` | 後端 API 網址 | ✅ | `https://ventai-backend.vercel.app` |
| `NEXT_PUBLIC_WS_URL` | WebSocket 網址 | ✅ | `wss://ventai-backend.vercel.app` |

---

## 測試連接

### 1. 測試後端 Health Check

在瀏覽器或終端測試：

```bash
curl https://ventai-backend.vercel.app/health
```

預期回應：
```json
{
  "status": "healthy",
  "service": "VentAI Backend",
  "version": "1.1.0",
  "simulator_active": true,
  "ai_service": "mock",
  "active_connections": 0
}
```

### 2. 開啟前端網站

訪問你的前端 URL：
```
https://ventai-frontend.vercel.app
```

### 3. 檢查連接狀態

在前端 UI 頂部，應該看到：
- **綠色圓點** ✅ = 連接成功
- **紅色圓點** ❌ = 連接失敗

### 4. 檢查瀏覽器 Console

按 `F12` 打開開發者工具，檢查 Console：
- 沒有 CORS 錯誤
- WebSocket 連接成功
- 波形正常渲染

---

## 常見問題

### ❌ CORS 錯誤

**錯誤訊息：**
```
Access to fetch at 'https://ventai-backend.vercel.app/api/settings' from origin 'https://ventai-frontend.vercel.app' has been blocked by CORS policy
```

**解決方案：**
1. 確認後端的 `FRONTEND_URL` 環境變數正確設定
2. 確認格式正確（包含 `https://`，不含結尾 `/`）
3. 重新部署後端：`cd backend && vercel --prod`

### ❌ WebSocket 連接失敗

**錯誤訊息：**
```
WebSocket connection failed
```

**解決方案：**

> **重要限制：** Vercel 的 Serverless Functions 不支援持久性的 WebSocket 連接！

目前有兩個解決方案：

#### 選項 1：使用輪詢（Polling）代替 WebSocket

修改前端改用 HTTP 輪詢獲取數據（每秒請求一次）。

#### 選項 2：將後端部署到支援 WebSocket 的平台

推薦平台：
- **Railway** (https://railway.app) - 支援 WebSocket
- **Render** (https://render.com) - 支援 WebSocket
- **Fly.io** (https://fly.io) - 支援 WebSocket

**Railway 部署步驟：**

1. 註冊 Railway 帳號
2. 連接 GitHub 儲存庫
3. 選擇 `backend` 目錄
4. 設定環境變數
5. 部署完成後獲得支援 WebSocket 的 URL

然後更新前端的 `NEXT_PUBLIC_WS_URL` 為 Railway 提供的 URL。

### ❌ 環境變數未生效

**解決方案：**
1. 確認變數名稱正確（前端變數必須以 `NEXT_PUBLIC_` 開頭）
2. 在 Vercel Dashboard 檢查變數是否已儲存
3. 重新部署專案以套用變數

### ❌ 部署失敗

**常見原因：**
1. `package.json` 缺少依賴
2. `requirements.txt` 版本衝突
3. 建置命令錯誤

**解決方案：**
1. 檢查 Vercel 部署日誌
2. 本地測試 `npm run build`（前端）或 `pip install -r requirements.txt`（後端）
3. 修正錯誤後重新部署

---

## 自動部署設定

### 連接 Git Repository

在 Vercel Dashboard：

1. 進入專案 → **Settings** → **Git**
2. 連接你的 GitHub/GitLab 儲存庫
3. 設定自動部署：
   - **Production Branch:** `main` 或 `master`
   - **Preview Branches:** 所有分支

之後每次 push 到 `main`，Vercel 會自動部署！

---

## 本地開發設定

### 前端

```bash
cd frontend
cp .env.example .env.local

# 編輯 .env.local，使用本地後端
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_WS_URL=ws://localhost:8000

npm install
npm run dev
```

### 後端

```bash
cd backend
cp .env.example .env

# 編輯 .env，添加 OpenAI API Key（可選）

pip install -r requirements.txt
python main.py
```

---

## 部署清單

使用此清單確保所有步驟完成：

### 後端部署 ✅

- [ ] 創建 `backend/vercel.json`
- [ ] 創建 `backend/api/index.py`
- [ ] 部署後端：`cd backend && vercel --prod`
- [ ] 記錄後端 URL
- [ ] 在 Vercel 設定 `OPENAI_API_KEY`（可選）
- [ ] 在 Vercel 設定 `FRONTEND_URL`
- [ ] 測試 Health Check

### 前端部署 ✅

- [ ] 創建 `frontend/.env.production`
- [ ] 設定 `NEXT_PUBLIC_API_URL`
- [ ] 設定 `NEXT_PUBLIC_WS_URL`
- [ ] 部署前端：`cd frontend && vercel --prod`
- [ ] 記錄前端 URL
- [ ] 在 Vercel 設定環境變數
- [ ] 測試前端網站

### 最終檢查 ✅

- [ ] 前端顯示綠色連接狀態
- [ ] 波形正常渲染
- [ ] 設定按鈕可以調整參數
- [ ] 無 CORS 錯誤
- [ ] AI 諮詢功能正常（如果啟用）

---

## 相關資源

- [Vercel 官方文檔](https://vercel.com/docs)
- [Next.js 部署指南](https://nextjs.org/docs/deployment)
- [FastAPI 部署指南](https://fastapi.tiangolo.com/deployment/)
- [Vercel CLI 文檔](https://vercel.com/docs/cli)

---

## 需要協助？

如有問題，請檢查：
1. Vercel Dashboard 的部署日誌
2. 瀏覽器的開發者工具 Console
3. 環境變數是否正確設定

---

**部署完成！** 🎉

你的 VentAI 應用現在已經在線上運行了！
