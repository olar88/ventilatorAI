"""
Patient Simulator - Implements respiratory mechanics physics.

Uses the Equation of Motion for the respiratory system:
Pressure(t) = (Volume(t) / Compliance) + (Flow(t) * Resistance) + PEEP
"""
import numpy as np
import time
from typing import Tuple
from models import VentilatorSettings, VitalData


class PatientSimulator:
    """
    Simulates a patient with ARDS connected to a mechanical ventilator.
    
    Physics Model:
    - Flow is generated using sinusoidal pattern (inspiration) and exponential decay (expiration)
    - Volume is the integral of flow over time
    - Pressure is calculated from the equation of motion
    - I:E ratio is 1:2 (inspiration time = 1/3 of breath cycle)
    """
    
    def __init__(self, settings: VentilatorSettings):
        self.settings = settings
        self.time_step = 1.0 / 30.0  # 30Hz sampling rate
        self.current_time = 0.0
        self.current_volume = 0.0
        
        # Calculate breath cycle timing
        self.breath_period = 60.0 / settings.respiratory_rate  # seconds per breath
        self.inspiration_time = self.breath_period / 3.0  # I:E = 1:2
        self.expiration_time = self.breath_period * 2.0 / 3.0
        
        # Tidal volume tracking for averaging
        self.tidal_volumes = []  # Store recent tidal volumes
        self.max_breath_history = 5  # Average over last 5 breaths
        self.peak_volume_this_breath = 0.0  # Track peak volume in current breath
        
        # Plateau pressure measurement
        self.measure_plateau = False
        self.plateau_pressure_value = None
        self.plateau_hold_time = 0.0
        self.plateau_hold_duration = 0.5  # 0.5 second hold
        
    def update_settings(self, settings: VentilatorSettings) -> None:
        """Update ventilator settings dynamically."""
        self.settings = settings
        self.breath_period = 60.0 / settings.respiratory_rate
        self.inspiration_time = self.breath_period / 3.0
        self.expiration_time = self.breath_period * 2.0 / 3.0
    
    def start_plateau_measurement(self) -> None:
        """Start plateau pressure measurement on next inspiratory pause."""
        self.measure_plateau = True
        self.plateau_pressure_value = None
        self.plateau_hold_time = 0.0
        
    def _get_phase(self) -> str:
        """Determine current breathing phase."""
        cycle_time = self.current_time % self.breath_period
        return "inspiration" if cycle_time < self.inspiration_time else "expiration"
    
    def _calculate_flow(self) -> float:
        """
        Calculate instantaneous flow rate (L/min).
        
        Inspiration: Sinusoidal pattern
        Expiration: Exponential decay
        
        During plateau pressure measurement, flow is held at zero.
        """
        cycle_time = self.current_time % self.breath_period
        phase = self._get_phase()
        
        # Plateau pressure measurement: hold flow at zero during inspiratory pause
        if self.measure_plateau and phase == "inspiration":
            inspiration_progress = cycle_time / self.inspiration_time
            # Start holding at 90% of inspiration time
            if inspiration_progress > 0.9:
                self.plateau_hold_time += self.time_step
                if self.plateau_hold_time >= self.plateau_hold_duration:
                    self.measure_plateau = False
                    self.plateau_hold_time = 0.0
                return 0.0  # Zero flow during plateau hold
        
        if phase == "inspiration":
            # Sinusoidal flow during inspiration
            # Peak flow = (Tidal Volume / Inspiration Time) * π/2
            peak_flow = (self.settings.tidal_volume / 1000.0) / self.inspiration_time * (np.pi / 2)
            peak_flow_lpm = peak_flow * 60.0  # Convert L/s to L/min
            
            # Sine wave from 0 to π
            angle = (cycle_time / self.inspiration_time) * np.pi
            flow = peak_flow_lpm * np.sin(angle)
        else:
            # Exponential decay during expiration
            exp_time = cycle_time - self.inspiration_time
            tau = self.expiration_time / 3.0  # Time constant
            
            # Peak expiratory flow (negative for exhalation)
            peak_exp_flow = -(self.settings.tidal_volume / 1000.0) / tau * 60.0
            flow = peak_exp_flow * np.exp(-exp_time / tau)
        
        # Add realistic noise (±2% of current flow)
        noise = np.random.normal(0, abs(flow) * 0.02)
        return flow + noise
    
    def _calculate_volume(self, flow: float) -> float:
        """
        Calculate current volume by integrating flow.
        Volume resets at the start of each breath cycle.
        Records peak volume (tidal volume) for each breath.
        """
        cycle_time = self.current_time % self.breath_period
        
        if cycle_time < self.time_step:
            # Start of new breath cycle - record previous breath's peak tidal volume
            if self.peak_volume_this_breath > 50:  # Only record if valid breath
                self.tidal_volumes.append(self.peak_volume_this_breath)
                if len(self.tidal_volumes) > self.max_breath_history:
                    self.tidal_volumes.pop(0)
            self.current_volume = 0.0
            self.peak_volume_this_breath = 0.0  # Reset peak tracker
        else:
            # Integrate flow (convert L/min to mL/s)
            flow_ml_per_sec = (flow * 1000.0) / 60.0
            self.current_volume += flow_ml_per_sec * self.time_step
        
        # Clamp volume to realistic range
        self.current_volume = max(0.0, min(self.current_volume, self.settings.tidal_volume * 1.2))
        
        # Track peak volume for this breath
        if self.current_volume > self.peak_volume_this_breath:
            self.peak_volume_this_breath = self.current_volume
        
        return self.current_volume
    
    def _calculate_pressure(self, volume: float, flow: float) -> float:
        """
        Calculate airway pressure using the equation of motion.
        
        Pressure = (Volume / Compliance) + (Flow * Resistance) + PEEP
        
        Args:
            volume: Current volume (mL)
            flow: Current flow (L/min)
        
        Returns:
            Airway pressure (cmH2O)
        """
        # Convert flow from L/min to L/s for resistance calculation
        flow_l_per_sec = flow / 60.0
        
        # Equation of motion
        elastic_pressure = volume / self.settings.compliance
        resistive_pressure = flow_l_per_sec * self.settings.resistance
        pressure = elastic_pressure + resistive_pressure + self.settings.peep
        
        # Add slight noise (±0.5 cmH2O)
        noise = np.random.normal(0, 0.5)
        pressure += noise
        
        # Clamp to realistic range
        return max(0.0, min(pressure, 50.0))
    
    def _calculate_spo2(self) -> float:
        """
        Simulate SpO₂ based on FiO₂ and compliance.
        
        ARDS patients typically show SpO₂ ~85-92% depending on severity.
        Higher FiO₂ and compliance improve oxygenation.
        """
        # Base SpO₂ for ARDS patient
        base = 82 + (self.settings.fio2 * 10)  # ~88 for fio2=0.6
        # Slight oscillation with breathing cycle
        oscillation = np.sin(self.current_time * 0.5) * 1.5
        noise = np.random.normal(0, 0.3)
        spo2 = base + oscillation + noise
        return round(max(70.0, min(100.0, spo2)), 1)

    def _calculate_heart_rate(self) -> int:
        """
        Simulate heart rate for ARDS patient.
        
        Tachycardia is common in ARDS, typically 100-130 bpm.
        """
        base = 108
        oscillation = np.sin(self.current_time * 0.3) * 8
        noise = np.random.normal(0, 2)
        hr = base + oscillation + noise
        return int(max(50, min(180, hr)))

    def step(self) -> VitalData:
        """
        Advance simulation by one time step and return vital data.
        
        Returns:
            VitalData packet with current timestamp, pressure, flow, volume, phase,
            spo2, heart_rate, avg_tidal_volume, and plateau_pressure (if measuring).
        """
        # Calculate waveforms
        flow = self._calculate_flow()
        volume = self._calculate_volume(flow)
        pressure = self._calculate_pressure(volume, flow)
        phase = self._get_phase()
        spo2 = self._calculate_spo2()
        heart_rate = self._calculate_heart_rate()
        
        # Calculate average tidal volume
        avg_tidal_volume = None
        if len(self.tidal_volumes) > 0:
            avg_tidal_volume = round(sum(self.tidal_volumes) / len(self.tidal_volumes), 1)
        
        # Capture plateau pressure during measurement
        plateau_pressure = None
        if self.measure_plateau and abs(flow) < 1.0 and phase == "inspiration":
            # Flow near zero during inspiration = plateau pressure
            self.plateau_pressure_value = pressure
            plateau_pressure = round(pressure, 2)
        elif self.plateau_pressure_value is not None:
            # Continue showing last measured value for a few seconds
            plateau_pressure = round(self.plateau_pressure_value, 2)
        
        # Create data packet
        data = VitalData(
            timestamp=time.time(),
            pressure=round(pressure, 2),
            flow=round(flow, 2),
            volume=round(volume, 2),
            phase=phase,
            spo2=spo2,
            heart_rate=heart_rate,
            avg_tidal_volume=avg_tidal_volume,
            plateau_pressure=plateau_pressure
        )
        
        # Advance time
        self.current_time += self.time_step
        
        return data
    
    def get_breath_cycle_data(self) -> list[VitalData]:
        """
        Generate one complete breath cycle for testing/verification.
        
        Returns:
            List of VitalData for one complete breath
        """
        self.current_time = 0.0
        self.current_volume = 0.0
        
        num_samples = int(self.breath_period / self.time_step)
        breath_data = []
        
        for _ in range(num_samples):
            breath_data.append(self.step())
        
        return breath_data


# Test the simulator if run directly
if __name__ == "__main__":
    print("=" * 60)
    print("VentAI Patient Simulator - Physics Verification")
    print("=" * 60)
    
    # Create default settings for ARDS patient
    settings = VentilatorSettings(
        fio2=0.6,
        peep=12.0,
        tidal_volume=400.0,
        respiratory_rate=16,
        compliance=40.0,  # Reduced compliance (ARDS)
        resistance=15.0   # Increased resistance (ARDS)
    )
    
    print(f"\nPatient Settings:")
    print(f"  Compliance: {settings.compliance} mL/cmH2O (ARDS: reduced)")
    print(f"  Resistance: {settings.resistance} cmH2O/L/s (ARDS: increased)")
    print(f"  PEEP: {settings.peep} cmH2O")
    print(f"  Tidal Volume: {settings.tidal_volume} mL")
    print(f"  Respiratory Rate: {settings.respiratory_rate} bpm")
    print(f"  FiO2: {settings.fio2 * 100}%")
    
    # Create simulator
    simulator = PatientSimulator(settings)
    
    print(f"\nGenerating one breath cycle...")
    print(f"  Breath period: {simulator.breath_period:.2f} seconds")
    print(f"  Inspiration time: {simulator.inspiration_time:.2f} seconds")
    print(f"  Expiration time: {simulator.expiration_time:.2f} seconds")
    print(f"  I:E Ratio: 1:2")
    
    # Generate one breath
    breath_data = simulator.get_breath_cycle_data()
    
    print(f"\nSample Data Points (showing every 5th sample):")
    print(f"{'Time (s)':<10} {'Phase':<12} {'Flow (L/min)':<15} {'Volume (mL)':<15} {'Pressure (cmH2O)':<15}")
    print("-" * 70)
    
    for i, data in enumerate(breath_data):
        if i % 5 == 0:  # Show every 5th sample
            time_in_cycle = i * simulator.time_step
            print(f"{time_in_cycle:<10.2f} {data.phase:<12} {data.flow:<15.2f} {data.volume:<15.2f} {data.pressure:<15.2f}")
    
    # Calculate statistics
    pressures = [d.pressure for d in breath_data]
    volumes = [d.volume for d in breath_data]
    flows = [d.flow for d in breath_data]
    
    print(f"\nPhysics Verification:")
    print(f"  Peak Inspiratory Pressure: {max(pressures):.2f} cmH2O")
    print(f"  PEEP (baseline): {min(pressures):.2f} cmH2O (target: {settings.peep})")
    print(f"  Peak Volume: {max(volumes):.2f} mL (target: {settings.tidal_volume})")
    print(f"  Peak Inspiratory Flow: {max(flows):.2f} L/min")
    print(f"  Peak Expiratory Flow: {min(flows):.2f} L/min")
    
    print("\n" + "=" * 60)
    print("✓ Physics engine verification complete!")
    print("=" * 60)
