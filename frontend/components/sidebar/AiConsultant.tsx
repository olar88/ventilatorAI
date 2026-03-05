"use client";

import { Sparkles, Bot, ArrowRightCircle, CheckCircle2 } from "lucide-react";
import { GlassPanel, GlassInner } from "../ui/GlassPanel";
import { useState } from "react";

interface AiConsultantProps {
  readonly onAcceptRecommendation: () => Promise<void> | void;
  readonly spo2: number;
  readonly cdyn: number;
}

export function AiConsultant({ onAcceptRecommendation, spo2, cdyn }: AiConsultantProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Simple hardcoded trigger logic as per prototype
  const hasEventTriggered = spo2 <= 88 || cdyn <= 25;

  const handleAccept = async () => {
    setIsProcessing(true);
    await Promise.resolve(onAcceptRecommendation());
    setIsProcessing(false);
  };

  return (
    <GlassPanel highlight="ai" className="flex-1 flex flex-col relative overflow-hidden">
      {/* AI Special Glow Background */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/20 rounded-full blur-[60px] pointer-events-none"></div>

      <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center z-10 backdrop-blur-sm">
        <h2 className="font-semibold flex items-center gap-2 text-primary">
          <Sparkles className="w-5 h-5" /> AI 決策輔助
        </h2>
        <span className="text-[10px] bg-primary/20 border border-primary/30 text-primary px-3 py-1 rounded-full font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(59,130,246,0.2)]">
          Active
        </span>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4 z-10 overflow-y-auto">
        {/* Event Trigger Display */}
        {hasEventTriggered ? (
          <div className="text-sm border-l-2 border-danger pl-4 py-1 relative">
            <div className="absolute -left-1.25 top-2 w-2 h-2 rounded-full bg-danger shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
            <p className="text-danger font-bold text-xs mb-1 tracking-wider">異常偵測</p>
            <p className="text-muted leading-relaxed text-xs">
              SpO2 下降 (目前 {spo2}%)，且 Cdyn 偏低 ({cdyn})。
            </p>
          </div>
        ) : (
            <div className="text-sm border-l-2 border-primary pl-4 py-1 relative">
                <div className="absolute -left-1.25 top-2 w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                <p className="text-primary font-bold text-xs mb-1 tracking-wider">系統穩定</p>
                <p className="text-muted leading-relaxed text-xs">目前無異常呼吸事件</p>
            </div>
        )}

        {/* AI Response Area */}
        {hasEventTriggered && (
          <GlassInner className="p-4 text-sm flex-1 relative group">
            <div className="flex gap-3 mb-3 items-center">
              <div className="w-8 h-8 rounded-xl bg-linear-to-br from-primary/30 to-purple-500/30 flex items-center justify-center shrink-0 border border-white/10 shadow-lg">
                <Bot className="w-4 h-4 text-white drop-shadow-md" />
              </div>
              <div className="font-semibold text-primary/90 text-base">ARDSnet 協議建議</div>
            </div>
            <ul className="space-y-3 text-muted leading-relaxed pl-1 text-xs">
              <li className="flex items-start gap-2">
                <ArrowRightCircle className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
                <span>
                  中重度 ARDS，建議執行 <strong className="text-text font-semibold">Lung Recruitment</strong>。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRightCircle className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
                <span>
                  將 <strong className="text-text font-semibold">PEEP 調升至 14</strong> 以改善氧合。
                </span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRightCircle className="w-4 h-4 text-primary/70 mt-0.5 shrink-0" />
                <span>
                  監控 Plateau Pressure <strong className="text-text font-semibold">&lt; 30 cmH2O</strong>。
                </span>
              </li>
            </ul>
          </GlassInner>
        )}

        <div className="mt-auto pt-4">
            <button
            onClick={handleAccept}
            disabled={!hasEventTriggered || isProcessing}
            className={`w-full bg-linear-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 text-white font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all duration-300 ${
                !hasEventTriggered || isProcessing ? "opacity-50 cursor-not-allowed" : "shadow-[0_8px_20px_-5px_rgba(59,130,246,0.5)] hover:shadow-[0_8px_25px_-5px_rgba(59,130,246,0.7)] hover:-translate-y-0.5"
            }`}
            >
            <CheckCircle2 className="w-5 h-5" /> 
            {isProcessing ? "傳送醫囑中..." : "接受建議並生成醫囑"}
            </button>
        </div>
      </div>
    </GlassPanel>
  );
}
