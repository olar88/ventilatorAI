# VentAI V1.1.0

**Ventilator Parameter Adjustment Assistant**

A medical ventilator simulation system with real-time waveform visualization and AI-powered clinical recommendations. Built for educational and demonstration purposes.

![VentAI Dashboard](file:///Users/odette18/.gemini/antigravity/brain/90bf618b-d4af-4f3e-8045-bcc16d79cc92/ventai_dashboard_top_1770619624828.png)

## 🎯 Features

- **Physics-Based Simulation**: Implements respiratory equation of motion for medically accurate waveforms
- **Real-time Visualization**: 30Hz WebSocket streaming with three synchronized waveforms (Pressure, Flow, Volume)
- **Medical Dark Mode**: High-contrast interface optimized for clinical displays
- **Interactive Controls**: Adjust ventilator parameters and patient characteristics in real-time
- **AI Consultation**: ARDSnet protocol-based clinical recommendations
- **ARDS Modeling**: Simulates Acute Respiratory Distress Syndrome pathophysiology

## 🏗️ Architecture

### Backend (Python + FastAPI)
- **Physics Engine**: NumPy-based respiratory mechanics simulation
- **WebSocket Server**: 30Hz real-time data streaming
- **REST API**: Settings management and AI consultation
- **AI Service**: OpenAI integration with intelligent mock fallback

### Frontend (Next.js + TypeScript)
- **Real-time Charts**: Recharts with performance optimizations
- **WebSocket Client**: Auto-reconnect with rolling buffer management
- **Medical UI**: Tailwind CSS with custom medical theme
- **State Management**: Zustand for lightweight state handling

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Add OpenAI API key
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start server
python main.py
```

Backend runs on `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3001`

### 3. Access Application

Open your browser to `http://localhost:3001`

You should see:
- ✅ Green "Connected" indicator
- ✅ Three real-time waveform charts
- ✅ Live vital signs updating at 30Hz
- ✅ Interactive control panel on the left

## 📊 Physics Model

The simulator uses the **Equation of Motion** for respiratory mechanics:

```
Pressure(t) = (Volume(t) / Compliance) + (Flow(t) * Resistance) + PEEP
```

**Waveform Generation:**
- **Flow**: Sinusoidal inspiration + exponential decay expiration
- **Volume**: Integral of flow over time
- **Pressure**: Calculated from equation of motion
- **I:E Ratio**: 1:2 (inspiration:expiration)

**ARDS Patient Parameters:**
- Compliance: 40 mL/cmH₂O (reduced from normal 50-100)
- Resistance: 15 cmH₂O/L/s (increased from normal 5-10)

## 🧪 Testing

### Verify Physics Engine

```bash
cd backend
source venv/bin/activate
python simulator.py
```

This will output one complete breath cycle with verification metrics.

### Check Backend Health

```bash
curl http://localhost:8000/health
```

Expected response:
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

## 📁 Project Structure

```
VentAI_1/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── simulator.py         # Physics engine
│   ├── models.py            # Data models
│   ├── ai_service.py        # AI consultation
│   └── requirements.txt     # Python dependencies
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Main dashboard
│   │   └── globals.css      # Medical Dark Mode
│   ├── components/
│   │   ├── WaveformMonitor.tsx
│   │   ├── ControlPanel.tsx
│   │   └── AIConsultModal.tsx
│   └── hooks/
│       └── useVentilatorSocket.ts
│
└── README.md                # This file
```

## 🎨 Design System

**Medical Dark Mode Palette:**
- Background: `#0a0a0a` (Near Black)
- Primary: `#10b981` (Neon Green - Flow)
- Warning: `#fbbf24` (Yellow - Pressure)
- Info: `#3b82f6` (Blue - Volume)
- Danger: `#ef4444` (Red - Alarms)

**Typography:**
- Sans: Inter
- Mono: Roboto Mono

## 🤖 AI Consultation

The AI service provides clinical recommendations based on Arterial Blood Gas (ABG) values:

1. Click "AI Consultation" button
2. Enter ABG values (pH, PaCO₂, PaO₂)
3. Get ARDSnet protocol-based recommendations

**Modes:**
- **OpenAI**: Uses GPT-4 for advanced analysis (requires API key)
- **Mock**: Rule-based recommendations (automatic fallback)

## ⚠️ Important Notes

> **Educational Use Only**: This is a simulation system for demonstration and educational purposes. It should NOT be used for actual clinical decision-making or patient care.

> **ARDS Simulation**: The default settings simulate a patient with Acute Respiratory Distress Syndrome. Adjust compliance and resistance to model different conditions.

## 📚 Documentation

- [Backend README](backend/README.md) - API documentation and physics details
- [Frontend README](frontend/README.md) - Component architecture and design system
- [Implementation Plan](file:///Users/odette18/.gemini/antigravity/brain/90bf618b-d4af-4f3e-8045-bcc16d79cc92/implementation_plan.md) - Technical specifications
- [Walkthrough](file:///Users/odette18/.gemini/antigravity/brain/90bf618b-d4af-4f3e-8045-bcc16d79cc92/walkthrough.md) - Verification and testing results

## 🛠️ Technology Stack

**Backend:**
- FastAPI 0.109.0
- NumPy 1.26.3
- Pydantic 2.5.3
- OpenAI 1.10.0

**Frontend:**
- Next.js 16.1.6
- React 19.2.3
- TypeScript 5
- Tailwind CSS 4
- Recharts 2.15.0
- Lucide React 0.468.0

## 📝 License

Educational and demonstration use only.

## 🙏 Acknowledgments

Based on ARDSnet low tidal volume ventilation protocol and lung-protective ventilation strategies.

---

**Version**: 1.1.0  
**Status**: ✅ Fully Functional  
**Last Updated**: 2026-02-09
