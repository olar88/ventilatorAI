# VentAI Railway 部署指南

Railway 完美支援 FastAPI 和 WebSocket，是部署 VentAI 後端的最佳選擇。

## 🚀 快速部署步驟

### 1️⃣ 註冊 Railway 帳號

1. 訪問 https://railway.app
2. 點擊 **Start a New Project**
3. 使用 **GitHub** 帳號登入

### 2️⃣ 建立新專案

1. 在 Railway Dashboard，點擊 **New Project**
2. 選擇 **Deploy from GitHub repo**
3. 授權 Railway 訪問你的 GitHub
4. 選擇 `olar88/ventilatorAI` 儲存庫
5. Railway 會自動檢測到專案

### 3️⃣ 配置後端服務

1. **選擇根目錄**
   - 點擊專案設定（Settings）
   - 在 **Root Directory** 設定為：`backend`
   - Railway 會自動檢測 `requirements.txt` 和 `main.py`

2. **新增環境變數**
   - 在專案中點擊 **Variables**
   - 新增以下變數：
   
   ```
   OPENAI_API_KEY=你的OpenAI_API_Key（可選，如不需要AI功能可跳過）
   FRONTEND_URL=將在前端部署後填寫
   ```

3. **自動部署**
   - Railway 會自動：
     - 安裝 `requirements.txt` 中的相依套件
     - 檢測 `Procfile` 或 `railway.json`
     - 執行 `python main.py`
   - 等待 2-3 分鐘完成部署

### 4️⃣ 獲取後端 URL

部署成功後：

1. 在 Railway 專案中查看 **Deployments**
2. 找到你的服務 URL，例如：
   ```
   https://ventai-backend-production.up.railway.app
   ```
3. **記下這個 URL！** 前端需要它

### 5️⃣ 測試後端

在瀏覽器或終端測試後端是否正常：

```bash
curl https://你的railway域名/health
```

預期返回：
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

### 6️⃣ 更新前端配置

前端仍然在 Vercel，需要更新環境變數連接到 Railway 後端：

1. 訪問 Vercel Dashboard：https://vercel.com/dashboard
2. 選擇你的前端專案（ventai-frontend 或 venti-frontend）
3. 進入 **Settings** → **Environment Variables**
4. 更新或新增：

   ```
   NEXT_PUBLIC_API_URL=https://你的railway域名
   NEXT_PUBLIC_WS_URL=wss://你的railway域名
   ```

5. 儲存後，重新部署前端：
   ```bash
   cd frontend
   vercel --prod
   ```

### 7️⃣ 更新後端 CORS

回到 Railway Dashboard：

1. 選擇後端專案
2. 點擊 **Variables**
3. 更新 `FRONTEND_URL`：
   ```
   FRONTEND_URL=https://你的vercel前端域名
   ```
4. 儲存後 Railway 會自動重新部署

---

## ✅ 部署檢查清單

- [ ] Railway 帳號已建立
- [ ] 後端專案已從 GitHub 部署
- [ ] Root Directory 設定為 `backend`
- [ ] 環境變數已配置
- [ ] 後端 Health Check 測試通過
- [ ] 前端 Vercel 環境變數已更新
- [ ] 後端 CORS 已配置前端域名
- [ ] 前端重新部署完成
- [ ] 前端網站可以連接後端
- [ ] WebSocket 即時資料正常顯示

---

## 🎯 優勢：Railway vs Vercel

| 特性 | Railway | Vercel |
|------|---------|--------|
| WebSocket 支援 | ✅ 完全支援 | ❌ 不支援 |
| ASGI/FastAPI | ✅ 原生支援 | ⚠️ 需要轉接器 |
| 持久連線 | ✅ 支援 | ❌ Serverless 限制 |
| 冷啟動 | ✅ 快速 | ⚠️ 較慢 |
| 價格 | 免費 $5/月額度 | 免費但功能受限 |

---

## 🔧 Railway 自動部署

連接 GitHub 後，每次 push 到 `main` 分支，Railway 會自動部署！

```bash
# 修改程式碼後
git add .
git commit -m "更新功能"
git push

# Railway 自動檢測並部署 🎉
```

---

## 🐛 常見問題

### ❌ 部署失敗：找不到 Python

**解決方案：** 確保 `runtime.txt` 存在：
```
python-3.11
```

### ❌ 連接埠錯誤

**解決方案：** Railway 自動提供 `PORT` 環境變數，`main.py` 已正確配置：
```python
port = int(os.getenv("PORT", 8000))
```

### ❌ WebSocket 連線失敗

**解決方案：** 
1. 檢查 Railway URL 是否正確（應該是 `wss://` 開頭）
2. 確認前端的 `NEXT_PUBLIC_WS_URL` 正確設定
3. 檢查 Railway 服務是否正在執行

### ❌ CORS 錯誤

**解決方案：**
1. 在 Railway 新增 `FRONTEND_URL` 環境變數
2. 確保格式正確：`https://your-domain.vercel.app`（無結尾 `/`）
3. 重新部署後端

---

## 📊 監控和日誌

### 查看即時日誌

1. Railway Dashboard → 你的專案
2. 點擊 **Deployments**
3. 選擇最新部署
4. 查看 **Logs** 標籤

### 監控資源使用

- Railway Dashboard → **Metrics**
- 查看 CPU、記憶體、網路使用情況

---

## 💰 Railway 定價

- **免費額度：** $5/月
- **Hobby Plan：** $5/月（約 500 小時執行時間）
- **Pro Plan：** $20/月起

對於開發和展示專案，免費額度完全夠用！

---

## 🎉 部署完成！

你的 VentAI 應用現在：
- ✅ 後端執行在 Railway（支援 WebSocket）
- ✅ 前端執行在 Vercel（快速 CDN）
- ✅ 完整的即時資料流
- ✅ 自動 CI/CD 部署

訪問你的前端 URL 開始使用！

---

## 📚 相關文件

- [Railway 官方文件](https://docs.railway.app/)
- [Railway Python 部署指南](https://docs.railway.app/languages/python)
- [FastAPI 部署最佳實踐](https://fastapi.tiangolo.com/deployment/)

---

## 需要幫助？

如遇到問題：
1. 檢查 Railway 部署日誌
2. 確認環境變數設定正確
3. 測試 Health Check 端點
4. 檢查前端瀏覽器 Console

祝部署順利！🚀
