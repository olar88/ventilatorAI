"use client";

import React from "react";
import { Activity, Heart, HeartPulse, Moon, SlidersHorizontal, ActivitySquare, Waves, Wind, AlertTriangle, Sun, Minus, Plus, Clock } from "lucide-react";
import { GlassPanel, GlassInner } from "@/components/ui/GlassPanel";
import { WaveformCanvas } from "@/components/monitor/WaveformCanvas";
import { AiConsultant } from "@/components/sidebar/AiConsultant";
import { useVentilatorSocket } from "@/hooks/useVentilatorSocket";
import { useThemeStore } from "@/store/useThemeStore";

interface AdjustableControlProps {
  label: string;
  value: string | number;
  unit: string;
  onDecrease: () => Promise<boolean> | void;
  onIncrease: () => Promise<boolean> | void;
}

const AdjustableControl = ({ label, value, unit, onDecrease, onIncrease }: AdjustableControlProps) => {
  const [updating, setUpdating] = React.useState(false);
  
  const handleDecrease = async () => {
    setUpdating(true);
    try {
      await onDecrease();
    } finally {
      setTimeout(() => setUpdating(false), 300);
    }
  };
  
  const handleIncrease = async () => {
    setUpdating(true);
    try {
      await onIncrease();
    } finally {
      setTimeout(() => setUpdating(false), 300);
    }
  };
  
  return (
    <div className={`glass-inner p-3 flex flex-col justify-center items-center transition-colors ${updating ? 'bg-primary/10' : 'hover:bg-white/5'}`}>
      <div className="text-xs text-muted mb-2">{label}</div>
      <div className="text-xl font-bold text-primary mb-2">
          {value}<span className="text-xs font-normal ml-0.5 opacity-70">{unit}</span>
      </div>
      <div className="flex gap-2">
          <button 
              onClick={handleDecrease}
              disabled={updating}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-primary hover:text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
              <Minus className="w-3 h-3" />
          </button>
          <button 
              onClick={handleIncrease}
              disabled={updating}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-primary hover:text-white flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
              <Plus className="w-3 h-3" />
          </button>
      </div>
    </div>
  );
};

export default function Home() {
  const { theme, setTheme } = useThemeStore();
  const {
    isConnected,
    settings,
    patient,
    currentPip,
    currentFlow,
    avgVolume,
    plateauPressure,
    isMeasuringPlateau,
    pressureBufferRef,
    flowBufferRef,
    maxPoints,
    duration,
    currentIndexRef,
    startTimeRef,
    setDuration,
    sendSettingsUpdate,
    measurePlateauPressure,
  } = useVentilatorSocket();

  const handleAcceptRecommendation = async () => {
    // Implement accepting AI recommendation (e.g. increase PEEP)
    await sendSettingsUpdate({ peep: 14 });
  };

  return (
    <>
      {/* Navbar */}
      <header className="glass-panel m-4 px-6 py-4 flex justify-between items-center shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center backdrop-blur-md">
            <Activity className="text-primary w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Vent<span className="text-primary">AI</span>
            </h1>
            <p className="text-xs text-muted font-medium flex items-center gap-2">
              Smart Ventilator Hub{" "}
              <span className={`inline-block w-2 h-2 rounded-full ${isConnected ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"}`} />
            </p>
          </div>
        </div>

        {/* Patient Info */}
        <div className="hidden md:flex items-center gap-8 text-sm px-6 py-2 glass-inner">
          <div className="flex flex-col items-center">
            <span className="text-muted text-xs mb-0.5">病歷號</span>
            <span className="font-bold">#A883921</span>
          </div>
          <div className="w-px h-8 bg-border opacity-20"></div>
          <div className="flex flex-col items-center">
            <span className="text-muted text-xs mb-0.5">病患</span>
            <span className="font-bold">陳 X 明 (58Y)</span>
          </div>
          <div className="w-px h-8 bg-border opacity-20"></div>
          <div className="flex flex-col items-center">
            <span className="text-muted text-xs mb-0.5">診斷</span>
            <span className="font-bold text-primary">Severe ARDS</span>
          </div>
        </div>

        {/* Theme Switcher */}
        <div className="flex items-center gap-2 p-1 glass-inner rounded-full">
          <button
            onClick={() => setTheme("clinical-day")}
            className={`glass-button px-4 py-2 text-sm font-medium flex items-center ${
              theme === "clinical-day" ? "active shadow-lg" : ""
            }`}
          >
            <Sun className="w-4 h-4 mr-2" />
            明亮
          </button>
          <button
            onClick={() => setTheme("icu-night")}
            className={`glass-button px-4 py-2 text-sm font-medium flex items-center ${
              theme === "icu-night" ? "active shadow-lg" : ""
            }`}
          >
            <Moon className="w-4 h-4 mr-2" />
            深色
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden px-4 pb-4 gap-4 z-10 w-full h-full">
        {/* Left Column: Waveforms (Canvas) */}
        <section className="flex-1 flex flex-col gap-4">
          {/* Pressure Waveform */}
          <GlassPanel className="flex-1 flex flex-col relative overflow-hidden">
            <div className="px-6 py-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-wave1/10">
                  <Waves className="w-5 h-5 text-wave1" />
                </div>
                <h2 className="font-semibold text-sm tracking-wide">
                  壓力波形 (Paw){" "}
                  <span className="text-muted text-xs ml-1 font-normal">cmH2O</span>
                </h2>
              </div>
              <div className="flex gap-4 items-center">
                  <div className="text-3xl font-black text-wave1 drop-shadow-md">
                    {currentPip}
                  </div>
              </div>
            </div>
            {/* Gradient Mask for soft edges */}
            <div className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-bg/20 to-transparent pointer-events-none z-10"></div>
            
            <WaveformCanvas
              type="pressure"
              dataBufferRef={pressureBufferRef}
              maxPoints={maxPoints}
              duration={duration}
              currentIndexRef={currentIndexRef}
              startTimeRef={startTimeRef}
            />
          </GlassPanel>

          {/* Flow Waveform */}
          <GlassPanel className="flex-1 flex flex-col relative overflow-hidden">
            <div className="px-6 py-4 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-wave2/10">
                  <Wind className="w-5 h-5 text-wave2" />
                </div>
                <h2 className="font-semibold text-sm tracking-wide">
                  流量波形 (Flow){" "}
                  <span className="text-muted text-xs ml-1 font-normal">L/min</span>
                </h2>
              </div>
              <div className="text-3xl font-black text-wave2 drop-shadow-md">
                {currentFlow}
              </div>
            </div>
            
            <WaveformCanvas
              type="flow"
              dataBufferRef={flowBufferRef}
              maxPoints={maxPoints}
              duration={duration}
              currentIndexRef={currentIndexRef}
              startTimeRef={startTimeRef}
            />
          </GlassPanel>
        </section>

        {/* Right Column: Data & AI */}
        <aside className="w-112.5 h-[95vh]flex flex-col gap-4 overflow-y-auto pr-1 pb-1">
          {/* Vitals Grid */}
          <div className="grid grid-cols-2 gap-4">
            <GlassPanel highlight="danger" className="p-5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-10">
                <Activity className="w-24 h-24 text-danger" />
              </div>
              <span className="text-sm text-muted font-medium z-10">SpO2 (%)</span>
              <div className="flex items-end justify-between mt-4 z-10">
                <span className="text-5xl font-black text-danger drop-shadow-md">{patient.spo2}</span>
                <div className="bg-danger/20 p-2 rounded-full backdrop-blur-sm animate-pulse">
                  <AlertTriangle className="w-5 h-5 text-danger" />
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="p-5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-5">
                <Heart className="w-24 h-24 text-wave2" />
              </div>
              <span className="text-sm text-muted font-medium z-10">HR (bpm)</span>
              <div className="flex items-end justify-between mt-4 z-10">
                <span className="text-5xl font-bold drop-shadow-sm">{patient.hr}</span>
                <div className="bg-wave2/10 p-2 rounded-full backdrop-blur-sm">
                  <HeartPulse className="w-5 h-5 text-wave2" />
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="p-5 flex flex-col justify-between relative overflow-hidden col-span-2">
              <div className="absolute -right-4 -top-4 opacity-5">
                <Wind className="w-24 h-24 text-primary" />
              </div>
              <span className="text-sm text-muted font-medium z-10">平均潮氣容積 (Vt avg)</span>
              <div className="flex items-end justify-between mt-4 z-10">
                <span className="text-5xl font-bold drop-shadow-sm text-primary">
                  {avgVolume ? Math.round(avgVolume) : '--'}
                </span>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-muted mb-1">mL</span>
                  <div className="bg-primary/10 p-2 rounded-full backdrop-blur-sm">
                    <ActivitySquare className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </div>
            </GlassPanel>
          </div>

          {/* Ventilator Settings */}
          <GlassPanel className="flex flex-col p-5">
            <h2 className="font-semibold text-sm flex items-center gap-2 mb-4 justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10">
                    <SlidersHorizontal className="w-4 h-4 text-primary" />
                </div>
                呼吸器設定 (PCV)
              </div>
              
              {/* Duration Control */}
              <div className="flex items-center gap-2 bg-white/5 rounded-full p-1 border border-white/5">
                <Clock className="w-3 h-3 text-muted ml-2" />
                <div className="flex">
                    {[5, 10, 20, 30].map(sec => (
                        <button
                            key={sec}
                            onClick={() => setDuration(sec * 1000)}
                            className={`text-[10px] px-2 py-1 rounded-full transition-all ${
                                duration === sec * 1000 
                                ? 'bg-primary text-white font-bold shadow-md' 
                                : 'text-muted hover:text-white'
                            }`}
                        >
                            {sec}s
                        </button>
                    ))}
                </div>
              </div>
            </h2>

            <div className="grid grid-cols-3 gap-3 text-center mb-4">
              <AdjustableControl 
                label="FiO2" 
                value={(settings.fio2 * 100).toFixed(0)} 
                unit="%" 
                onDecrease={() => sendSettingsUpdate({ fio2: Math.max(0.21, settings.fio2 - 0.05) })}
                onIncrease={() => sendSettingsUpdate({ fio2: Math.min(1, settings.fio2 + 0.05) })}
              />
              <AdjustableControl 
                label="PEEP" 
                value={settings.peep} 
                unit="" 
                onDecrease={() => sendSettingsUpdate({ peep: Math.max(0, settings.peep - 1) })}
                onIncrease={() => sendSettingsUpdate({ peep: Math.min(30, settings.peep + 1) })}
              />
              <AdjustableControl 
                label="RR" 
                value={settings.rr} 
                unit="bpm" 
                onDecrease={() => sendSettingsUpdate({ rr: Math.max(5, settings.rr - 1) })}
                onIncrease={() => sendSettingsUpdate({ rr: Math.min(60, settings.rr + 1) })}
              />
            </div>
            
            <GlassInner className="px-4 py-3 flex justify-between items-center text-sm rounded-xl mb-4">
              <span className="text-muted flex items-center gap-2">
                <ActivitySquare className="w-4 h-4" /> Cdyn
              </span>
              <span className="font-mono font-bold text-base">
                {settings.cdyn} <span className="text-xs font-normal opacity-70">ml/cmH2O</span>
              </span>
            </GlassInner>

            {/* Plateau Pressure Measurement */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted font-medium">平台壓力 (Pplat)</span>
                <button
                  onClick={measurePlateauPressure}
                  disabled={isMeasuringPlateau}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isMeasuringPlateau
                      ? 'bg-wave1/20 text-wave1 cursor-wait animate-pulse'
                      : 'bg-wave1/10 hover:bg-wave1/20 text-wave1 hover:shadow-lg'
                  }`}
                >
                  {isMeasuringPlateau ? '測量中...' : '📊 測量 Pplat'}
                </button>
              </div>
              
              {plateauPressure !== null && (
                <GlassInner className="px-4 py-3 flex justify-between items-center text-sm rounded-xl bg-wave1/5">
                  <span className="text-muted">測量值</span>
                  <span className="font-mono font-bold text-xl text-wave1">
                    {plateauPressure.toFixed(1)} 
                    <span className="text-xs font-normal opacity-70 ml-1">cmH2O</span>
                  </span>
                </GlassInner>
              )}
              
              <div className="text-[10px] text-muted/70 leading-relaxed">
                * 平台壓力應維持 &lt; 30 cmH2O（ARDS 肺保護策略）
              </div>
            </div>
          </GlassPanel>

          {/* AI Agent Consultant Panel */}
          <AiConsultant 
            onAcceptRecommendation={handleAcceptRecommendation} 
            spo2={patient.spo2}
            cdyn={settings.cdyn}
          />
        </aside>
      </main>
    </>
  );
}
