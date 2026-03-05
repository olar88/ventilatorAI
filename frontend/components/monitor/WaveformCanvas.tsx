"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useThemeStore } from "@/store/useThemeStore";

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  buffer: (number | null)[],
  currentIndex: number,
  maxPoints: number,
  width: number,
  height: number,
  config: { type: "pressure" | "flow"; waveColor: string }
) {
  ctx.beginPath();
  ctx.strokeStyle = config.waveColor;
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Neon Glow
  ctx.shadowBlur = 12;
  ctx.shadowColor = config.waveColor;

  let drawing = false;

  // 按順序繪製 buffer（扫描线模式：左边新数据，右边旧数据）
  for (let i = 0; i < maxPoints; i++) {
    const val = buffer[i];
    
    if (val === null) {
      if (drawing) {
        ctx.stroke();
        ctx.beginPath();
        drawing = false;
      }
      continue;
    }

    const x = (i / maxPoints) * width;
    const y =
      config.type === "pressure"
        ? height - ((val / 40) * height * 0.7) - 20
        : (height / 2) - ((val / 80) * (height / 2) * 0.7);

    if (drawing) {
      ctx.lineTo(x, y);
    } else {
      ctx.moveTo(x, y);
      drawing = true;
    }
  }

  if (drawing) {
    ctx.stroke();
  }

  // Reset shadow for next frame clearance
  ctx.shadowBlur = 0;
}

interface WaveformCanvasProps {
  readonly type: "pressure" | "flow";
  readonly dataBufferRef: RefObject<(number | null)[] | null>;
  readonly currentIndexRef: RefObject<number>; // 數據寫入位置（用於調試）
  readonly startTimeRef: RefObject<number>; // 統一時間基準
  readonly maxPoints: number;
  readonly duration: number;
}

export function WaveformCanvas({ type, dataBufferRef, currentIndexRef, startTimeRef, maxPoints, duration }: WaveformCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scanLineRef = useRef<HTMLDivElement>(null);
  const isDark = useThemeStore((s) => s.isDarkMode());
  const durationRef = useRef(duration);
  
  // These will update when theme switches
  const [waveColor, setWaveColor] = useState(type === "pressure" ? "#0ea5e9" : "#8b5cf6");

  // Sync wave color with CSS variables
  useEffect(() => {
    const rootStyle = getComputedStyle(document.body);
    const colorVar = type === "pressure" ? "--color-wave1" : "--color-wave2";
    const cssVarColor = rootStyle.getPropertyValue(colorVar).trim();
    if(cssVarColor) setTimeout(() => setWaveColor(cssVarColor), 0);
  }, [isDark, type]);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // Clear canvas when duration changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    ctx.clearRect(0, 0, width, height);
  }, [duration]);

  // Main canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;

    const resizeCanvas = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        
        if (!rect.width || !rect.height) return;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        // Use setTransform to reset and set scale to avoid accumulation
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        
        canvas.style.width = `${rect.width}px`;
        canvas.style.height = `${rect.height}px`;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const draw = () => {
      const buffer = dataBufferRef.current;
      if (!buffer) { animFrameId = requestAnimationFrame(draw); return; }

      // 使用 currentIndex 计算扫描线位置（与数据写入同步）
      const currentIndex = currentIndexRef.current;
      const progress = currentIndex / maxPoints;
      if (scanLineRef.current) {
        scanLineRef.current.style.left = `${progress * 100}%`;
      }

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      ctx.clearRect(0, 0, width, height);

      // Baseline for flow
      if (type === "flow") {
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.strokeStyle = "rgba(150, 150, 150, 0.2)";
        ctx.lineWidth = 2;
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      drawWaveform(ctx, buffer, currentIndex, maxPoints, width, height, { type, waveColor });
      
      animFrameId = requestAnimationFrame(draw);
    };

    // Start loop
    animFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animFrameId);
    };
  }, [maxPoints, waveColor, type, dataBufferRef, currentIndexRef, startTimeRef, duration]);

  return (
    <div ref={containerRef} className="flex-1 relative w-full h-full -mt-2 group overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" style={{ touchAction: 'none' }}></canvas>
      <div 
         ref={scanLineRef}
         className="scan-line" 
         style={{ left: "0%" }}
      ></div>
    </div>
  );
}
