"""Test script to verify simulator avg_tidal_volume calculation"""
import sys
sys.path.append('.')

from simulator import PatientSimulator
from models import VentilatorSettings

# Initialize simulator with default settings
settings = VentilatorSettings(
    fio2=0.6,
    peep=12.0,
    tidal_volume=400.0,
    respiratory_rate=16,
    compliance=40.0,
    resistance=15.0
)

simulator = PatientSimulator(settings)

print("Testing simulator for avg_tidal_volume calculation...")
print(f"Breath period: {simulator.breath_period:.2f} seconds")
print(f"Inspiration time: {simulator.inspiration_time:.2f} seconds")
print()

# Run for 15 seconds (should complete ~4 breath cycles at RR=16)
test_duration = 15.0  # seconds
num_steps = int(test_duration / simulator.time_step)

print(f"Running simulation for {test_duration} seconds ({num_steps} steps)...")
print()

for i in range(num_steps):
    data = simulator.step()
    
    # Print每个呼吸周期的开始
    cycle_time = simulator.current_time % simulator.breath_period
    if cycle_time < simulator.time_step * 2:  # 在周期开始附近
        print(f"\n[Time {simulator.current_time:.2f}s] New breath cycle started")
        print(f"  Tidal volumes history: {simulator.tidal_volumes}")
        print(f"  avg_tidal_volume: {data.avg_tidal_volume}")

print("\n" + "="*60)
print("Final state:")
print(f"  Total breaths recorded: {len(simulator.tidal_volumes)}")
print(f"  Tidal volumes: {simulator.tidal_volumes}")
print(f"  Final avg_tidal_volume: {data.avg_tidal_volume}")
