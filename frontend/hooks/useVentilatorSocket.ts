import { useEffect, useRef, useState, useCallback } from 'react';

export interface VitalsData {
  timestamp: number;
  pressure: number;
  flow: number;
  volume: number;
  phase: string;
  spo2?: number;
  heart_rate?: number;
  avg_tidal_volume?: number | null;
  plateau_pressure?: number | null;
}

export interface SettingsData {
  fio2: number;
  peep: number;
  rr: number;
  pip: number;
  cdyn: number;
}

export interface PatientState {
  spo2: number;
  hr: number;
}

interface SocketState {
  isConnected: boolean;
  settings: SettingsData;
  patient: PatientState;
  currentPip: number;
  currentFlow: number;
  avgVolume: number | null;
  plateauPressure: number | null;
  isMeasuringPlateau: boolean;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ? `${process.env.NEXT_PUBLIC_WS_URL}/ws/vitals` : 'ws://localhost:8000/ws/vitals';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const MAX_POINTS = 1000; // 增加解析度以支援長達 30 秒的波形
const DEFAULT_DURATION = 5000;

function getClearWindowPoints(durationMs: number) {
  const frameMs = 16.67;
  const pointsPerFrame = (MAX_POINTS * frameMs) / Math.max(1, durationMs);
  return Math.min(12, Math.max(2, Math.ceil(pointsPerFrame * 2)));
}

export function useVentilatorSocket() {
  const [socketState, setSocketState] = useState<SocketState>({
    isConnected: false,
    settings: { fio2: 0.6, peep: 12, rr: 20, pip: 28, cdyn: 25 },
    patient: { spo2: 95, hr: 80 },
    currentPip: 0,
    currentFlow: 0,
    avgVolume: null,
    plateauPressure: null,
    isMeasuringPlateau: false,
  });

  const [duration, setDuration] = useState(DEFAULT_DURATION);
  const durationRef = useRef(DEFAULT_DURATION);

  // 波形數據緩衝區 (使用 Ref 避免觸發 React 重新渲染)
  const pressureBuffer = useRef<(number | null)[]>(new Array(MAX_POINTS).fill(null));
  const flowBuffer = useRef<(number | null)[]>(new Array(MAX_POINTS).fill(null));
  const currentIndexRef = useRef<number>(0); // 當前寫入位置，供 Canvas 讀取

  const startTimeRef = useRef(0); // 統一的時間基準
  const lastUpdateRef = useRef(0);
  const lastStateUpdateRef = useRef(0);
  const lastPatientUpdateRef = useRef(0);
  const socketRef = useRef<WebSocket | null>(null);
  const lastIndexRef = useRef<number | null>(null);

  const changeDuration = useCallback((d: number) => {
    setDuration(d);
    durationRef.current = d;
    pressureBuffer.current.fill(null);
    flowBuffer.current.fill(null);
    lastIndexRef.current = null;
    currentIndexRef.current = 0;
    startTimeRef.current = performance.now(); // 重置時間基準
    lastUpdateRef.current = performance.now();
    lastStateUpdateRef.current = 0;
  }, []);

  // 備用數據生成器 (當後端斷線時使用)
  const generateMockWaveData = useCallback((t: number) => {
    // ... (保留現有的模擬邏輯)
    const cycle = 3000;
    const tInCycle = t % cycle;
    const iTime = 1000;

    let pressure, flow;

    if (tInCycle < iTime) {
        pressure = 5 + (28 - 5) * Math.min(1, tInCycle / 150);
        flow = 60 * Math.max(0, 1 - (tInCycle / iTime));
    } else {
        pressure = 5 + (28 - 5) * Math.max(0, 1 - ((tInCycle - iTime) / 150));
        flow = -60 * Math.exp(-(tInCycle - iTime) / 200);
    }
    
    pressure += (Math.sin(t / 50) * 0.3) + ((Math.random() - 0.5) * 0.2);
    flow += (Math.cos(t / 30) * 0.5) + ((Math.random() - 0.5) * 0.5);

    return { pressure, flow };
  }, []);

  // 獲取初始設定
  useEffect(() => {
    console.log('[Init] Fetching initial settings from:', `${API_URL}/api/settings`);
    fetch(`${API_URL}/api/settings`)
      .then(res => res.json())
      .then(data => {
        console.log('[Init] Received settings from backend:', data);
        setSocketState(prev => ({
          ...prev,
          settings: {
            fio2: data.fio2,
            peep: data.peep,
            rr: data.respiratory_rate,
            pip: prev.settings.pip, // 這些透過 WS 更新
            cdyn: prev.settings.cdyn
          }
        }));
        console.log('[Init] Settings state updated');
      })
      .catch(err => {
        console.error('[Init] Failed to fetch settings:', err);
      });
  }, []);

  useEffect(() => {
    // Initialize refs with current time
    const now = performance.now();
    lastUpdateRef.current = now;
    startTimeRef.current = now;
    let animationFrameId: number;

    // --- WebSocket 事件處理 (提取以降低巢狀深度) ---
    const handleOpen = () => {
      setSocketState(prev => ({ ...prev, isConnected: true }));
      lastIndexRef.current = null;
      currentIndexRef.current = 0;
      startTimeRef.current = performance.now(); // 重置時間基準
      pressureBuffer.current.fill(null);
      flowBuffer.current.fill(null);
    };

    const processWaveformData = (data: VitalsData) => {
      const now = performance.now();
      const currentDuration = durationRef.current;
      const elapsed = (now - startTimeRef.current) % currentDuration;
      const progress = elapsed / currentDuration;
      const currentIndex = Math.floor(progress * MAX_POINTS);

      // 線性插值以填補空隙
      const prevIndex = lastIndexRef.current;
      if (prevIndex !== null && prevIndex !== currentIndex) {
        let distance = currentIndex - prevIndex;
        if (distance < 0) distance += MAX_POINTS;
        if (distance < 50) {
          const prevP = pressureBuffer.current[prevIndex] ?? data.pressure;
          const prevF = flowBuffer.current[prevIndex] ?? data.flow;
          for (let step = 1; step <= distance; step++) {
            const idx = (prevIndex + step) % MAX_POINTS;
            const t = step / distance;
            pressureBuffer.current[idx] = prevP + (data.pressure - prevP) * t;
            flowBuffer.current[idx] = prevF + (data.flow - prevF) * t;
          }
        } else {
          pressureBuffer.current[currentIndex] = data.pressure;
          flowBuffer.current[currentIndex] = data.flow;
        }
      } else {
        pressureBuffer.current[currentIndex] = data.pressure;
        flowBuffer.current[currentIndex] = data.flow;
      }
      lastIndexRef.current = currentIndex;
      currentIndexRef.current = currentIndex; // 更新當前索引供 Canvas 讀取

      // 掃描線擦除效果
      const clearWindow = getClearWindowPoints(currentDuration);
      for (let i = 1; i <= clearWindow; i++) {
        const clearIdx = (currentIndex + i) % MAX_POINTS;
        pressureBuffer.current[clearIdx] = null;
        flowBuffer.current[clearIdx] = null;
      }

      // 節流 React 狀態更新 (~5Hz)
      if (now - lastStateUpdateRef.current > 200) {
        lastStateUpdateRef.current = now;
        const shouldUpdatePatient = now - lastPatientUpdateRef.current > 3000;
        if (shouldUpdatePatient) lastPatientUpdateRef.current = now;
        setSocketState(prev => ({
          ...prev,
          currentPip: Math.round(data.pressure),
          currentFlow: Math.round(Math.abs(data.flow)),
          avgVolume: data.avg_tidal_volume ?? prev.avgVolume,
          plateauPressure: data.plateau_pressure ?? prev.plateauPressure,
          patient: shouldUpdatePatient
            ? { spo2: data.spo2 ?? prev.patient.spo2, hr: data.heart_rate ?? prev.patient.hr }
            : prev.patient,
          settings: { ...prev.settings, pip: Math.max(prev.settings.pip, Math.round(data.pressure)) },
        }));
      }
    };

    const handleMessage = (event: MessageEvent) => {
      try {
        processWaveformData(JSON.parse(event.data as string) as VitalsData);
      } catch (e) {
        console.error("Error parsing websocket message", e);
      }
    };

    const handleClose = () => {
      setSocketState(prev => ({ ...prev, isConnected: false }));
    };

    const handleError = () => {
      setSocketState(prev => ({ ...prev, isConnected: false }));
    };

    // 建立 WebSocket 連線
    try {
      const ws = new WebSocket(WS_URL);
      socketRef.current = ws;
      ws.onopen = handleOpen;
      ws.onmessage = handleMessage;
      ws.onclose = handleClose;
      ws.onerror = handleError;
    } catch (err) {
      console.error("Could not initialize websocket", err);
    }

    // 備用模擬迴圈
    const fallbackLoop = () => {
        if (socketRef.current?.readyState !== WebSocket.OPEN) {
            const now = performance.now();
            if (now - lastUpdateRef.current > 33) { 
                const currentDuration = durationRef.current;
                const elapsed = (now - startTimeRef.current) % currentDuration;
                const progress = elapsed / currentDuration;
                const currentIndex = Math.floor(progress * MAX_POINTS);

                const { pressure, flow } = generateMockWaveData(now);

                // 添加插值邏輯（與 processWaveformData 一致）
                const prevIndex = lastIndexRef.current;
                if (prevIndex !== null && prevIndex !== currentIndex) {
                  let distance = currentIndex - prevIndex;
                  if (distance < 0) distance += MAX_POINTS;
                  if (distance < 50) {
                    const prevP = pressureBuffer.current[prevIndex] ?? pressure;
                    const prevF = flowBuffer.current[prevIndex] ?? flow;
                    for (let step = 1; step <= distance; step++) {
                      const idx = (prevIndex + step) % MAX_POINTS;
                      const t = step / distance;
                      pressureBuffer.current[idx] = prevP + (pressure - prevP) * t;
                      flowBuffer.current[idx] = prevF + (flow - prevF) * t;
                    }
                  } else {
                    pressureBuffer.current[currentIndex] = pressure;
                    flowBuffer.current[currentIndex] = flow;
                  }
                } else {
                  pressureBuffer.current[currentIndex] = pressure;
                  flowBuffer.current[currentIndex] = flow;
                }
                lastIndexRef.current = currentIndex;
                currentIndexRef.current = currentIndex; // 更新當前索引
                
                // 基本擦除器
                const clearWindow = getClearWindowPoints(currentDuration);
                for (let i = 1; i <= clearWindow; i++) {
                    const clearIdx = (currentIndex + i) % MAX_POINTS;
                    pressureBuffer.current[clearIdx] = null;
                    flowBuffer.current[clearIdx] = null;
                }

                if (now - lastStateUpdateRef.current > 200) {
                    lastStateUpdateRef.current = now;
                    setSocketState(prev => ({
                        ...prev,
                        currentPip: Math.round(pressure),
                        currentFlow: Math.round(Math.abs(flow)),
                    }));
                }

                lastUpdateRef.current = now;
            }
        }
        animationFrameId = requestAnimationFrame(fallbackLoop);
    };

    animationFrameId = requestAnimationFrame(fallbackLoop);

    return () => {
      socketRef.current?.close();
      cancelAnimationFrame(animationFrameId);
    };
  }, [generateMockWaveData]);

  // API 設定更新
  const sendSettingsUpdate = async (newSettings: Partial<SettingsData>) => {
    try {
      console.log('[Settings Update] Attempting to update:', newSettings);
      console.log('[Settings Update] Current settings:', socketState.settings);
      
      const completeSettings = {
        fio2: newSettings.fio2 ?? socketState.settings.fio2,
        peep: newSettings.peep ?? socketState.settings.peep,
        respiratory_rate: newSettings.rr ?? socketState.settings.rr,
        tidal_volume: 400,
        compliance: 40,
        resistance: 15,
      };

      console.log('[Settings Update] Sending to backend:', completeSettings);

      const res = await fetch(`${API_URL}/api/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(completeSettings),
      });

      if (res.ok) {
        const responseData = await res.json();
        console.log('[Settings Update] Backend response:', responseData);
        
        setSocketState(prev => ({
          ...prev,
          settings: { 
            ...prev.settings, 
            ...newSettings 
          },
        }));
        console.log('[Settings Update] State updated successfully');
        return true;
      } else {
        console.error('[Settings Update] Failed with status:', res.status);
        const errorText = await res.text();
        console.error('[Settings Update] Error response:', errorText);
        return false;
      }
    } catch (err) {
      console.error("[Settings Update] Request failed:", err);
      return false;
    }
  };

  // 觸發平台壓力測量
  const measurePlateauPressure = async () => {
    try {
      setSocketState(prev => ({ ...prev, isMeasuringPlateau: true }));
      
      const res = await fetch(`${API_URL}/api/plateau`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        // 測量會在下一次呼吸時自動進行，3秒後重置測量狀態
        setTimeout(() => {
          setSocketState(prev => ({ ...prev, isMeasuringPlateau: false }));
        }, 3000);
        return true;
      }
      setSocketState(prev => ({ ...prev, isMeasuringPlateau: false }));
      return false;
    } catch (err) {
      console.error("Failed to trigger plateau measurement", err);
      setSocketState(prev => ({ ...prev, isMeasuringPlateau: false }));
      return false;
    }
  };

  return {
    isConnected: socketState.isConnected,
    settings: socketState.settings,
    patient: socketState.patient,
    currentPip: socketState.currentPip,
    currentFlow: socketState.currentFlow,
    avgVolume: socketState.avgVolume,
    plateauPressure: socketState.plateauPressure,
    isMeasuringPlateau: socketState.isMeasuringPlateau,
    pressureBufferRef: pressureBuffer,
    flowBufferRef: flowBuffer,
    currentIndexRef: currentIndexRef, // 共享當前索引
    startTimeRef: startTimeRef, // 統一時間基準
    maxPoints: MAX_POINTS,
    duration,
    setDuration: changeDuration,
    sendSettingsUpdate,
    measurePlateauPressure,
  };
}
