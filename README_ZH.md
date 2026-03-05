# VentAI V1.1.0

**呼吸機參數調整助手**

一個醫療呼吸機模擬系統，具有即時波形視覺化和AI驅動的臨床建議功能。專為教育和演示目的而設計。

![VentAI儀表板](file:///Users/odette18/.gemini/antigravity/brain/90bf618b-d4af-4f3e-8045-bcc16d79cc92/ventai_dashboard_top_1770619624828.png)

## 🎯 功能特色

- **基於物理學的模擬**：實作呼吸運動方程式，產生醫學精準的波形
- **即時視覺化**：30Hz WebSocket串流，三個同步波形（壓力、流量、容積）
- **醫療暗色模式**：針對臨床顯示器優化的高對比介面
- **交互式控制**：即時調整呼吸機參數和患者特性
- **AI諮詢**：基於ARDSnet協議的臨床建議
- **ARDS建模**：模擬急性呼吸窘迫症候群的病理生理學

## 🏗️ 系統架構

### 後端（Python + FastAPI）
- **物理引擎**：基於NumPy的呼吸力學模擬
- **WebSocket伺服器**：30Hz即時資料串流
- **REST API**：設定管理和AI諮詢
- **AI服務**：OpenAI整合與智能模擬備援

### 前端（Next.js + TypeScript）
- **即時圖表**：效能優化的Recharts
- **WebSocket客戶端**：自動重連與滾動緩衝區管理
- **醫療介面**：使用自定義醫療主題的Tailwind CSS
- **狀態管理**：輕量級Zustand狀態處理

## 🚀 快速開始

### 環境需求
- Python 3.10+
- Node.js 18+
- npm 或 yarn

### 1. 後端設置

```bash
cd backend

# 創建虛擬環境
python3 -m venv venv
source venv/bin/activate  # Windows系統：venv\Scripts\activate

# 安裝依賴項
pip install -r requirements.txt

# （可選）新增OpenAI API金鑰
cp .env.example .env
# 編輯.env檔案並新增您的OPENAI_API_KEY

# 啟動伺服器
python main.py
```

後端運行在 `http://localhost:8000`

### 2. 前端設置

```bash
cd frontend

# 安裝依賴項
npm install

# 啟動開發伺服器
npm run dev
```

前端運行在 `http://localhost:3001`

### 3. 存取應用程式

在瀏覽器中開啟 `http://localhost:3001`

您將看到：
- ✅ 綠色的「已連線」指示器
- ✅ 三個即時波形圖表
- ✅ 30Hz更新的生命徵象
- ✅ 左側交互式控制面板

## 🌐 部署到 Vercel

### 快速部署

使用自動部署腳本：

```bash
./deploy-vercel.sh
```

### 手動部署

詳細步驟請參考：**[VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)**

部署指南包含：
- ✅ 前後端分離部署到 Vercel
- ✅ 環境變數設定
- ✅ CORS 配置
- ✅ WebSocket 連接設定
- ✅ 常見問題排解

**注意：** Vercel Serverless Functions 不支援持久性 WebSocket 連接。如需完整 WebSocket 功能，建議部署後端到 Railway、Render 或 Fly.io。

## 📊 物理模型

模擬器使用**呼吸力學運動方程式**：

```
壓力(t) = (容積(t) / 順應性) + (流量(t) * 阻抗) + PEEP
```

**波形產生：**
- **流量**：正弦波吸氣 + 指數衰減呼氣
- **容積**：流量對時間的積分
- **壓力**：由運動方程式計算
- **吸呼比**：1:2（吸氣：呼氣）

**ARDS患者參數：**
- 順應性：40 mL/cmH₂O（低於正常值50-100）
- 阻抗：15 cmH₂O/L/s（高於正常值5-10）

## 🧪 測試

### 驗證物理引擎

```bash
cd backend
source venv/bin/activate
python simulator.py
```

這將輸出一個完整的呼吸週期和驗證指標。

### 檢查後端健康狀況

```bash
curl http://localhost:8000/health
```

預期回應：
```json
{
  "status": "healthy",
  "service": "VentAI Backend",
  "version": "1.1.0",
  "simulator_active": true,
  "ai_service": "mock",
  "active_connections": 1
}
```

## 📁 專案結構

```
VentAI_1/
├── backend/
│   ├── main.py              # FastAPI應用程式
│   ├── simulator.py         # 物理引擎
│   ├── models.py            # 資料模型
│   ├── ai_service.py        # AI諮詢
│   └── requirements.txt     # Python依賴項
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # 主要儀表板
│   │   └── globals.css      # 醫療暗色模式
│   ├── components/
│   │   ├── WaveformMonitor.tsx
│   │   ├── ControlPanel.tsx
│   │   └── AIConsultModal.tsx
│   └── hooks/
│       └── useVentilatorSocket.ts
│
└── README.md                # 此檔案
```

## 🎨 設計系統

**醫療暗色模式色彩：**
- 背景：`#0a0a0a`（近黑色）
- 主色：`#10b981`（霓虹綠 - 流量）
- 警告：`#fbbf24`（黃色 - 壓力）
- 資訊：`#3b82f6`（藍色 - 容積）
- 危險：`#ef4444`（紅色 - 警報）

**字體：**
- 無襯線：Inter
- 等寬：Roboto Mono

## 🤖 AI諮詢

AI服務根據動脈血氣分析（ABG）值提供臨床建議：

1. 點擊「AI諮詢」按鈕
2. 輸入ABG值（pH、PaCO₂、PaO₂）
3. 取得基於ARDSnet協議的建議

**模式：**
- **OpenAI**：使用GPT-4進行進階分析（需要API金鑰）
- **模擬**：基於規則的建議（自動備援）

## ⚠️ 重要提醒

> **僅供教育使用**：這是一個供演示和教育目的的模擬系統。不應用於實際的臨床決策或患者照護。

> **ARDS模擬**：預設設定模擬急性呼吸窘迫症候群患者。可調整順應性和阻抗來建模不同狀況。

## 📚 文件

- [後端README](backend/README.md) - API文件和物理詳細資訊
- [前端README](frontend/README.md) - 元件架構和設計系統
- [實作計畫](file:///Users/odette18/.gemini/antigravity/brain/90bf618b-d4af-4f3e-8045-bcc16d79cc92/implementation_plan.md) - 技術規格
- [操作說明](file:///Users/odette18/.gemini/antigravity/brain/90bf618b-d4af-4f3e-8045-bcc16d79cc92/walkthrough.md) - 驗證和測試結果

## 🛠️ 技術棧

**後端：**
- FastAPI 0.109.0
- NumPy 1.26.3
- Pydantic 2.5.3
- OpenAI 1.10.0

**前端：**
- Next.js 16.1.6
- React 19.2.3
- TypeScript 5
- Tailwind CSS 4
- Recharts 2.15.0
- Lucide React 0.468.0

## 📝 授權

僅供教育和演示使用。

## 🙏 致謝

基於ARDSnet低潮氣容積通氣協議和肺保護性通氣策略。

---

**版本**：1.1.0  
**狀態**：✅ 完全功能  
**最後更新**：2026-02-09