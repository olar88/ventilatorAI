"use client";

import { useThemeStore } from "@/store/useThemeStore";
import { useEffect } from "react";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    // Need to update the body attribute for global CSS variables to apply properly
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  // Add the dynamic animated blob orbs to the background safely inside the client root
  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb orb-1 animate-[blob_15s_infinite]"></div>
        <div className="orb orb-2 animate-[blob_15s_infinite]" style={{ animationDelay: '2s' }}></div>
        <div className="orb orb-3 animate-[blob_15s_infinite]" style={{ animationDelay: '4s' }}></div>
      </div>
      {children}
    </div>
  );
}
