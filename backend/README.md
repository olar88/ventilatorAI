# VentAI Backend

Medical ventilator simulation engine with real-time waveform generation and AI consultation.

## Features

- **Physics-Based Simulation**: Implements respiratory equation of motion
- **30Hz WebSocket Streaming**: Real-time vital signs data
- **AI Consultation**: ARDSnet protocol-based recommendations
- **REST API**: Settings management endpoints

## Installation

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

## Configuration

Create a `.env` file (optional):

```bash
cp .env.example .env
# Add your OpenAI API key if you want AI consultation
# OPENAI_API_KEY=your_key_here
```

## Running the Server

```bash
# Activate virtual environment
source venv/bin/activate

# Run the server
python main.py
```

Server will start on `http://localhost:8000`

## Testing Physics Engine

```bash
# Test the simulator standalone
python simulator.py
```

This will output one complete breath cycle with physics verification.

## API Endpoints

- `GET /health` - System health check
- `GET /api/settings` - Get current ventilator settings
- `POST /api/settings` - Update ventilator settings
- `POST /api/consult` - Get AI clinical consultation
- `WS /ws/vitals` - WebSocket for real-time data (30Hz)

## Physics Model

The simulator uses the **Equation of Motion** for respiratory mechanics:

```
Pressure(t) = (Volume(t) / Compliance) + (Flow(t) * Resistance) + PEEP
```

- **Flow**: Sinusoidal inspiration + exponential decay expiration
- **Volume**: Integral of flow over time
- **I:E Ratio**: 1:2 (inspiration:expiration)
- **ARDS Parameters**: Reduced compliance (40 mL/cmH₂O), increased resistance (15 cmH₂O/L/s)
