"""Detailed test to debug volume calculation"""
import sys
sys.path.append('.')

from simulator import PatientSimulator
from models import VentilatorSettings

settings = VentilatorSettings(
    fio2=0.6,
    peep=12.0,
    tidal_volume=400.0,
    respiratory_rate=16,
    compliance=40.0,
    resistance=15.0
)

simulator = PatientSimulator(settings)

print("Detailed volume tracking for one breath cycle...")
print(f"Breath period: {simulator.breath_period:.3f} seconds")
print(f"Time step: {simulator.time_step:.4f} seconds\n")

# Track one complete breath cycle
steps_per_breath = int(simulator.breath_period / simulator.time_step)
print(f"Steps per breath: {steps_per_breath}\n")

for i in range(steps_per_breath + 10):
    data = simulator.step()
    
    if i % 10 == 0:  # 每10步打印一次
        cycle_time = simulator.current_time % simulator.breath_period
        print(f"Step {i:3d}: t={simulator.current_time:6.3f}s, cycle_t={cycle_time:6.3f}s, "
              f"flow={data.flow:7.2f} L/min, volume={data.volume:7.2f} mL, "
              f"phase={data.phase}, current_vol={simulator.current_volume:7.2f} mL")
