/**
 * WaveformMonitor — Canvas-based waveforms matching styleSample.html exactly.
 *
 * Visual features (all from styleSample):
 *  - Linear index-to-x mapping (index 0 at left, index N at right)
 *  - Sweeping scan-line div at write position
 *  - Neon glow effect (shadowBlur + shadowColor)
 *  - Rounded line caps/joins
 *  - Gradient mask at bottom edge
 *  - Gap cleared ahead of write head
 *
 * Data source:
 *  - bufferRef / counterRef from useVentilatorSocket hook (real backend data)
 *  - Ring buffer syncs new samples from shared buffer into local slots
 */
"use client";

import React, { useEffect, useRef, useCallback, memo } from "react";
import { Waves, Wind } from "lucide-react";
import type { VitalsData } from "../hooks/useVentilatorSocket";

export interface WaveformMonitorProps {
  readonly bufferRef: React.RefObject<VitalsData[]>;
  readonly counterRef: React.RefObject<number>;
  readonly latest: VitalsData | null;
}

const MAX_POINTS = 500;
const GAP_SIZE = 15; // samples cleared ahead of write head (matches styleSample)

/* ═══════════════════════ Single waveform canvas ═══════════════════════ */

interface CanvasProps {
  readonly bufferRef: React.RefObject<VitalsData[]>;
  readonly counterRef: React.RefObject<number>;
  readonly dataKey: "pressure" | "flow";
  readonly color: string;
  readonly yMin: number;
  readonly yMax: number;
  readonly label: string;
  readonly unit: string;
  readonly currentValue: string;
  readonly baseline?: boolean;
  readonly icon: React.ElementType;
}

function WaveformCanvasInner({
  bufferRef,
  counterRef,
  dataKey,
  color,
  yMin,
  yMax,
  label,
  unit,
  currentValue,
  baseline,
  icon: Icon,
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const scanLineRef = useRef<HTMLDivElement>(null);

  // Linear ring buffer (index 0..MAX_POINTS-1)
  const ringBuf = useRef<(number | null)[]>(new Array(MAX_POINTS).fill(null));
  // Last counterRef value synced
  const lastCounter = useRef(0);
  // Current write position (linear, wraps via modulo)
  const writePos = useRef(0);

  /* ── DPR-aware resize ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  const syncNewSamples = useCallback(() => {
    const total = counterRef.current ?? 0;
    const newCount = total - lastCounter.current;
    if (newCount <= 0) return;

    const src = bufferRef.current ?? [];
    const take = Math.min(newCount, src.length, MAX_POINTS);
    const startIdx = src.length - take;
    for (let i = 0; i < take; i++) {
      const slot = writePos.current % MAX_POINTS;
      ringBuf.current[slot] = src[startIdx + i][dataKey];
      writePos.current++;
    }
    lastCounter.current = total;
  }, [bufferRef, counterRef, dataKey]);

  const clearGapAhead = useCallback((currentIdx: number) => {
    for (let g = 1; g <= GAP_SIZE; g++) {
      ringBuf.current[(currentIdx + g) % MAX_POINTS] = null;
    }
  }, []);

  const updateScanLine = useCallback((currentIdx: number) => {
    if (!scanLineRef.current) return;
    scanLineRef.current.style.left = `${(currentIdx / MAX_POINTS) * 100}%`;
  }, []);

  const drawBaseline = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number) => {
    if (!baseline) return;
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.strokeStyle = "rgba(150,150,150,0.2)";
    ctx.lineWidth = 2;
    ctx.moveTo(0, H / 2);
    ctx.lineTo(W, H / 2);
    ctx.stroke();
    ctx.restore();
  }, [baseline]);

  const drawWaveform = useCallback((ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const range = yMax - yMin;

    ctx.strokeStyle = color;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = 12;
    ctx.shadowColor = color;
    ctx.beginPath();

    let drawing = false;
    for (let i = 0; i < MAX_POINTS; i++) {
      const v = ringBuf.current[i];
      const x = (i / MAX_POINTS) * W;

      if (v === null) {
        if (drawing) {
          ctx.stroke();
          ctx.beginPath();
          drawing = false;
        }
        continue;
      }

      const normalised = (v - yMin) / range;
      const y = baseline
        ? (H / 2) - (normalised - 0.5) * 2 * (H / 2) * 0.7
        : H - normalised * H * 0.7 - 20;

      if (!drawing || i === 0 || ringBuf.current[i - 1] === null) {
        ctx.moveTo(x, y);
        drawing = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    if (drawing) ctx.stroke();

    ctx.shadowBlur = 0;
  }, [baseline, color, yMax, yMin]);

  /* ── rAF draw loop ── */
  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;
    if (!W || !H) return;

    syncNewSamples();
    const currentIdx = writePos.current % MAX_POINTS;

    clearGapAhead(currentIdx);
    updateScanLine(currentIdx);

    ctx.clearRect(0, 0, W, H);
    drawBaseline(ctx, W, H);
    drawWaveform(ctx, W, H);
  }, [clearGapAhead, drawBaseline, drawWaveform, syncNewSamples, updateScanLine]);

  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      drawFrame();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => {
      running = false;
      cancelAnimationFrame(animRef.current);
    };
  }, [drawFrame]);

  return (
    <div className="glass-panel flex-1 min-h-0 flex flex-col relative overflow-hidden group">
      {/* ── Header (matches styleSample) ── */}
      <div className="px-6 py-4 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: `${color}22` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <h2 className="font-semibold text-sm tracking-wide">
            {label}{" "}
            <span
              className="text-xs font-normal ml-1"
              style={{ color: "var(--color-muted)" }}
            >
              {unit}
            </span>
          </h2>
        </div>
        <div
          className="text-3xl font-black drop-shadow-md font-mono"
          style={{ color, textShadow: `0 0 12px ${color}` }}
        >
          {currentValue}
        </div>
      </div>

      {/* ── Gradient mask at bottom (matches styleSample) ── */}
      <div className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-bg/20 to-transparent pointer-events-none z-10" />

      {/* ── Canvas + Scan line ── */}
      <div className="flex-1 min-h-0 relative w-full -mt-2">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
        {/* Scan-line (matches styleSample) */}
        <div
          className="scan-line"
          ref={scanLineRef}
          style={{ left: "0%" }}
        />
      </div>
    </div>
  );
}

const WaveformCanvas = memo(WaveformCanvasInner);

/* ═══════════════════════ Composed monitor ═══════════════════════ */

// Colors matching globals.css variables
const THEME_COLORS = {
  "icu-night": {
    wave1: "#22d3ee", // --color-wave1
    wave2: "#a78bfa", // --color-wave2
  },
  "clinical-day": {
    wave1: "#0ea5e9", // --color-wave1
    wave2: "#8b5cf6", // --color-wave2
  },
};

function WaveformMonitorInner({
  bufferRef,
  counterRef,
  latest,
  theme,
}: WaveformMonitorProps & { theme: "icu-night" | "clinical-day" }) {
  const pressureStr = latest ? latest.pressure.toFixed(1) : "--";
  const flowStr = latest ? latest.flow.toFixed(1) : "--";
  
  const colors = THEME_COLORS[theme] || THEME_COLORS["icu-night"];

  return (
    <>
      <WaveformCanvas
        bufferRef={bufferRef}
        counterRef={counterRef}
        dataKey="pressure"
        color={colors.wave1}
        yMin={0}
        yMax={40}
        label="壓力波形 (Paw)"
        unit="cmH₂O"
        currentValue={pressureStr}
        icon={Waves}
      />
      <WaveformCanvas
        bufferRef={bufferRef}
        counterRef={counterRef}
        dataKey="flow"
        color={colors.wave2}
        yMin={-80}
        yMax={80}
        label="流量波形 (Flow)"
        unit="L/min"
        currentValue={flowStr}
        baseline
        icon={Wind}
      />
    </>
  );
}

const WaveformMonitor = memo(WaveformMonitorInner);
export default WaveformMonitor;
