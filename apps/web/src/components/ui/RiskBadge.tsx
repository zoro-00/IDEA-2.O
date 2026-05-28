import React from "react";
import type { RiskLevel, Severity } from "@/types";
import { getRiskColor, getRiskBgColor } from "@/utils/format";

interface RiskBadgeProps {
  level: RiskLevel | Severity;
  className?: string;
  outline?: boolean;
}

export function RiskBadge({ level, className = "", outline = false }: RiskBadgeProps) {
  const color = getRiskColor(level);
  const bg = outline ? "transparent" : getRiskBgColor(level, 0.15);
  const border = outline ? `1px solid ${color}` : `1px solid ${getRiskBgColor(level, 0.3)}`;

  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${className}`}
      style={{
        backgroundColor: bg,
        color: color,
        border: border,
        textShadow: `0 0 8px ${getRiskBgColor(level, 0.5)}`,
      }}
    >
      {level}
    </span>
  );
}
