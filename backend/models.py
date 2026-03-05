"""
Pydantic models for data validation and serialization.
"""
from pydantic import BaseModel, Field
from typing import Literal


class VentilatorSettings(BaseModel):
    """Ventilator parameter settings."""
    fio2: float = Field(default=0.6, ge=0.21, le=1.0, description="Fraction of inspired oxygen (21-100%)")
    peep: float = Field(default=10.0, ge=0.0, le=20.0, description="Positive End-Expiratory Pressure (cmH2O)")
    tidal_volume: float = Field(default=400.0, ge=200.0, le=800.0, description="Tidal volume (mL)")
    respiratory_rate: int = Field(default=16, ge=12, le=30, description="Respiratory rate (breaths per minute)")
    compliance: float = Field(default=50.0, ge=20.0, le=100.0, description="Lung compliance (mL/cmH2O)")
    resistance: float = Field(default=10.0, ge=5.0, le=30.0, description="Airway resistance (cmH2O/L/s)")


class VitalData(BaseModel):
    """Real-time vital signs data packet."""
    timestamp: float = Field(description="UNIX timestamp")
    pressure: float = Field(description="Airway pressure (cmH2O)")
    flow: float = Field(description="Flow rate (L/min)")
    volume: float = Field(description="Volume (mL)")
    phase: Literal["inspiration", "expiration"] = Field(description="Breathing phase")
    spo2: float = Field(default=95.0, description="Blood oxygen saturation (%)")
    heart_rate: int = Field(default=80, description="Heart rate (bpm)")
    avg_tidal_volume: float | None = Field(default=None, description="Average tidal volume over recent breaths (mL)")
    plateau_pressure: float | None = Field(default=None, description="Plateau pressure when measured (cmH2O)")


class ABGValues(BaseModel):
    """Arterial Blood Gas values for AI consultation."""
    ph: float = Field(ge=6.8, le=7.8, description="Blood pH")
    paco2: float = Field(ge=20.0, le=100.0, description="Partial pressure of CO2 (mmHg)")
    pao2: float = Field(ge=40.0, le=500.0, description="Partial pressure of O2 (mmHg)")
    fio2: float = Field(ge=0.21, le=1.0, description="Current FiO2 setting")
    peep: float = Field(ge=0.0, le=20.0, description="Current PEEP setting (cmH2O)")


class AIConsultResponse(BaseModel):
    """AI consultation response."""
    analysis: str = Field(description="Clinical analysis of ABG values")
    recommendations: list[str] = Field(description="List of recommended adjustments")
    rationale: str = Field(description="Medical rationale for recommendations")
