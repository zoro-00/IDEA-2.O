import React from "react";

export function TerminalText({ children, className = "", color = "#00F5FF" }: { children: React.ReactNode, className?: string, color?: string }) {
  return (
    <span 
      className={`font-mono ${className}`}
      style={{ 
        color,
        textShadow: `0 0 10px ${color}60`
      }}
    >
      {children}
    </span>
  );
}

export function PulsingDot({ color = "#10B981", size = 2 }: { color?: string, size?: number }) {
  return (
    <span className="relative flex" style={{ width: `${size*4}px`, height: `${size*4}px` }}>
      <span 
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" 
        style={{ backgroundColor: color }}
      />
      <span 
        className="relative inline-flex rounded-full" 
        style={{ width: `${size*4}px`, height: `${size*4}px`, backgroundColor: color }}
      />
    </span>
  );
}
