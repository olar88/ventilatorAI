"""
FastAPI Main Application - VentAI Backend
Provides REST API and WebSocket endpoints for ventilator simulation.
"""
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from typing import List
import time
import os

from models import VentilatorSettings, ABGValues, AIConsultResponse
from simulator import PatientSimulator
from ai_service import AIConsultService


# Global state
simulator: PatientSimulator = None
ai_service: AIConsultService = None
active_connections: List[WebSocket] = []


def ensure_initialized():
    """
    Ensure simulator and AI service are initialized.
    This is needed for serverless environments where lifespan may not work.
    """
    global simulator, ai_service
    
    if simulator is None or ai_service is None:
        # Initialize with default ARDS settings
        default_settings = VentilatorSettings(
            fio2=0.6,
            peep=12.0,
            tidal_volume=400.0,
            respiratory_rate=16,
            compliance=40.0,  # Reduced for ARDS
            resistance=15.0   # Increased for ARDS
        )
        
        simulator = PatientSimulator(default_settings)
        ai_service = AIConsultService()
        
        print("(+) VentAI Backend initialized (serverless)")
        print(f"  Simulator: RR={default_settings.respiratory_rate} bpm, PEEP={default_settings.peep} cmH2O")
        print(f"  AI Service: {'OpenAI' if ai_service.client else 'Mock Mode'}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize services on startup (for non-serverless environments)."""
    ensure_initialized()
    yield
    print("Shutting down VentAI Backend")


app = FastAPI(
    title="VentAI Backend",
    description="Ventilator simulation and AI consultation API",
    version="1.1.0",
    lifespan=lifespan
)

# CORS middleware for frontend
# Allow localhost for development and Vercel domains for production
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
]

# Add production frontend URL from environment variable
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)
    # Also allow the URL without trailing slash
    if frontend_url.endswith("/"):
        allowed_origins.append(frontend_url.rstrip("/"))
    else:
        allowed_origins.append(frontend_url + "/")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    """System health check endpoint."""
    ensure_initialized()
    return {
        "status": "healthy",
        "service": "VentAI Backend",
        "version": "1.1.0",
        "simulator_active": simulator is not None,
        "ai_service": "openai" if ai_service and ai_service.client else "mock",
        "active_connections": len(active_connections)
    }


@app.get("/api/settings")
async def get_settings():
    """Get current ventilator settings."""
    ensure_initialized()
    if not simulator:
        raise HTTPException(status_code=500, detail="Simulator not initialized")
    
    return simulator.settings


@app.post("/api/settings")
async def update_settings(settings: VentilatorSettings):
    """
    Update ventilator settings.
    
    The simulator will immediately use the new parameters for waveform generation.
    """
    ensure_initialized()
    if not simulator:
        raise HTTPException(status_code=500, detail="Simulator not initialized")
    
    simulator.update_settings(settings)
    
    return {
        "status": "success",
        "message": "Ventilator settings updated",
        "settings": settings
    }


@app.post("/api/plateau")
async def measure_plateau_pressure():
    """
    Trigger plateau pressure measurement.
    
    The simulator will perform an inspiratory pause on the next breath
    to measure plateau pressure (pressure with zero flow).
    """
    ensure_initialized()
    if not simulator:
        raise HTTPException(status_code=500, detail="Simulator not initialized")
    
    simulator.start_plateau_measurement()
    
    return {
        "status": "success",
        "message": "Plateau pressure measurement started"
    }


@app.post("/api/consult", response_model=AIConsultResponse)
async def get_ai_consultation(abg: ABGValues):
    """
    Get AI-powered clinical consultation based on ABG values.
    
    Analyzes arterial blood gas values and provides recommendations
    based on ARDSnet protocol and lung-protective ventilation strategies.
    """
    ensure_initialized()
    if not ai_service:
        raise HTTPException(status_code=500, detail="AI service not initialized")
    
    consultation = await ai_service.get_consultation(abg)
    return consultation


@app.websocket("/ws/vitals")
async def websocket_vitals(websocket: WebSocket):
    """
    WebSocket endpoint for real-time vital signs streaming.
    
    Broadcasts waveform data at 30Hz:
    - Pressure (cmH2O)
    - Flow (L/min)
    - Volume (mL)
    - Phase (inspiration/expiration)
    """
    ensure_initialized()
    await websocket.accept()
    active_connections.append(websocket)
    
    print(f"(+) WebSocket client connected (total: {len(active_connections)})")
    
    try:
        while True:
            # Generate next data point
            vital_data = simulator.step()
            
            # Send to client
            await websocket.send_json(vital_data.model_dump())
            
            # Wait for next cycle (30Hz = 33.33ms)
            await asyncio.sleep(1.0 / 30.0)
            
    except WebSocketDisconnect:
        active_connections.remove(websocket)
        print(f"(-) WebSocket client disconnected (remaining: {len(active_connections)})")
    except Exception as e:
        print(f"WebSocket error: {e}")
        if websocket in active_connections:
            active_connections.remove(websocket)


if __name__ == "__main__":
    import uvicorn
    
    # Get port from environment variable (Railway provides PORT)
    port = int(os.getenv("PORT", 8000))
    
    print("=" * 60)
    print("Starting VentAI Backend Server")
    print(f"Port: {port}")
    print("=" * 60)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
        log_level="info"
    )
