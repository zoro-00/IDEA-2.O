"use client";

import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface TransactionVolumeChartProps {
  data: { time: string; volume: number; anomaly: number }[];
  height?: number;
}

export function TransactionVolumeChart({ data, height = 200 }: TransactionVolumeChartProps) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00F5FF" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#00F5FF" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorAnomaly" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#F43F5E" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="time" 
            tick={{ fill: "#475569", fontSize: 10, fontFamily: "JetBrains Mono" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: "#475569", fontSize: 10, fontFamily: "JetBrains Mono" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", borderRadius: "8px" }}
            itemStyle={{ fontFamily: "JetBrains Mono", fontSize: "12px" }}
            labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
          />
          <Area 
            type="monotone" 
            dataKey="volume" 
            stroke="#00F5FF" 
            fillOpacity={1} 
            fill="url(#colorVolume)" 
          />
          <Area 
            type="monotone" 
            dataKey="anomaly" 
            stroke="#F43F5E" 
            fillOpacity={1} 
            fill="url(#colorAnomaly)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
