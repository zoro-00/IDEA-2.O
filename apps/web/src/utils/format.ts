// ============================================================
// STAR — Risk & Formatting Utils
// ============================================================
import type { RiskLevel, Severity } from "@/types";
import { COLORS } from "@/constants";

export function formatCurrency(amount: number): string {
  if (amount >= 1e6) return `$${(amount / 1e6).toFixed(1)}M`;
  if (amount >= 1e3) return `$${(amount / 1e3).toFixed(1)}K`;
  return `$${amount.toLocaleString()}`;
}

export function formatNumber(num: number): string {
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
  return num.toLocaleString();
}

export function getRiskColor(level: RiskLevel | Severity): string {
  switch (level) {
    case "critical": return COLORS.critical;
    case "high": return COLORS.high;
    case "moderate":
    case "medium": return COLORS.medium;
    case "monitoring": return COLORS.blue;
    case "normal":
    case "low": return COLORS.emerald;
    default: return COLORS.textMuted;
  }
}

export function getRiskBgColor(level: RiskLevel | Severity, opacity: number = 0.1): string {
  const color = getRiskColor(level);
  // Convert hex to rgba
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
