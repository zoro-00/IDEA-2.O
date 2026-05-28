"use client";

import { useAnimatedNumber } from "@/hooks/useAnimatedNumber";

interface MetricCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  trend?: number;
  icon?: any;
  color?: string;
}

export function MetricCard({ 
  label, 
  value, 
  prefix = "", 
  suffix = "", 
  trend,
  icon: Icon,
  color = "#00F5FF"
}: MetricCardProps) {
  
  const animatedValue = useAnimatedNumber(value);

  // Formatting for decimals vs integers
  const displayValue = value % 1 === 0 
    ? Math.floor(animatedValue).toLocaleString()
    : animatedValue.toFixed(1);

  return (
    <div 
      className="glass-card rounded-xl p-4 transition-all duration-300 hover-glow-cyan"
      style={{ border: `1px solid ${color}20` }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = `${color}40`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = `${color}20`;
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        {Icon && (
          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
            <Icon className="w-3.5 h-3.5" style={{ color }} />
          </div>
        )}
        <span className="text-[10px] font-mono text-[#475569] uppercase tracking-wider">{label}</span>
      </div>
      
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold font-mono text-white">
          {prefix}{displayValue}{suffix}
        </div>
        
        {trend !== undefined && (
          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${trend >= 0 ? "text-[#10B981] bg-[#10B981]/10" : "text-[#F43F5E] bg-[#F43F5E]/10"}`}>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
    </div>
  );
}
