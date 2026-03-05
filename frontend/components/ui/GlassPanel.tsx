import { ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  highlight?: "danger" | "ai" | "none";
}

export function GlassPanel({ children, className = "", highlight = "none" }: GlassPanelProps) {
  const highlightClass =
    highlight === "danger"
      ? "highlight-danger"
      : highlight === "ai"
      ? "highlight-ai"
      : "";

  return (
    <div className={`glass-panel ${highlightClass} ${className}`}>
      {children}
    </div>
  );
}

// Sub-component for smaller internal glass segments
interface GlassInnerProps {
  children: ReactNode;
  className?: string;
}

export function GlassInner({ children, className = "" }: GlassInnerProps) {
  return <div className={`glass-inner ${className}`}>{children}</div>;
}
