"use client";

import { motion } from "framer-motion";
import { useRef, useEffect, useCallback, useState } from "react";
import {
  Monitor,
  AlertTriangle,
  TrendingUp,
  Map,
  BarChart3,
  Shield,
} from "lucide-react";

function MiniGraph({ width = 280, height = 200 }: { width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    timeRef.current += 0.02;
    const time = timeRef.current;

    ctx.clearRect(0, 0, width, height);

    // Generate nodes
    const nodes = Array.from({ length: 15 }, (_, i) => ({
      x: width / 2 + Math.cos(i * 0.8 + time * 0.1) * (40 + i * 8),
      y: height / 2 + Math.sin(i * 0.8 + time * 0.15) * (30 + i * 6),
      r: 2 + Math.sin(time + i) * 1,
      risk: i < 5 ? 0.9 : i < 10 ? 0.5 : 0.2,
    }));

    // Draw edges
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(0, 245, 255, ${(1 - dist / 100) * 0.15})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw nodes
    nodes.forEach((node) => {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fillStyle =
        node.risk > 0.7
          ? "rgba(255, 59, 59, 0.8)"
          : node.risk > 0.4
          ? "rgba(0, 245, 255, 0.6)"
          : "rgba(148, 163, 184, 0.3)";
      ctx.fill();
    });

    animRef.current = requestAnimationFrame(draw);
  }, [width, height]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return <canvas ref={canvasRef} style={{ width, height }} />;
}

function HeatmapGrid() {
  const [cells, setCells] = useState<number[][]>([]);

  useEffect(() => {
    const grid: number[][] = [];
    for (let i = 0; i < 8; i++) {
      const row: number[] = [];
      for (let j = 0; j < 12; j++) {
        row.push(Math.random());
      }
      grid.push(row);
    }
    setCells(grid);
  }, []);

  return (
    <div className="grid gap-[2px]" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
      {cells.flat().map((val, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: i * 0.005 }}
          viewport={{ once: true }}
          className="aspect-square rounded-[3px]"
          style={{
            backgroundColor:
              val > 0.8
                ? `rgba(255, 59, 59, ${val})`
                : val > 0.5
                ? `rgba(255, 140, 66, ${val * 0.7})`
                : `rgba(0, 245, 255, ${val * 0.3})`,
          }}
        />
      ))}
    </div>
  );
}

function RadarChart() {
  const axes = ["Structural", "Behavioral", "Temporal", "Network", "Rule-Based"];
  const values = [0.85, 0.72, 0.91, 0.68, 0.79];
  const cx = 100;
  const cy = 100;
  const r = 70;

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={axes
            .map((_, i) => {
              const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
              return `${cx + r * scale * Math.cos(angle)},${cy + r * scale * Math.sin(angle)}`;
            })
            .join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="0.5"
        />
      ))}

      {/* Axis lines */}
      {axes.map((_, i) => {
        const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + r * Math.cos(angle)}
            y2={cy + r * Math.sin(angle)}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.5"
          />
        );
      })}

      {/* Data polygon */}
      <motion.polygon
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        points={values
          .map((val, i) => {
            const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
            return `${cx + r * val * Math.cos(angle)},${cy + r * val * Math.sin(angle)}`;
          })
          .join(" ")}
        fill="rgba(0, 245, 255, 0.1)"
        stroke="#00F5FF"
        strokeWidth="1.5"
      />

      {/* Data points */}
      {values.map((val, i) => {
        const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        return (
          <circle
            key={i}
            cx={cx + r * val * Math.cos(angle)}
            cy={cy + r * val * Math.sin(angle)}
            r="3"
            fill="#00F5FF"
          />
        );
      })}

      {/* Labels */}
      {axes.map((label, i) => {
        const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
        const lx = cx + (r + 20) * Math.cos(angle);
        const ly = cy + (r + 20) * Math.sin(angle);
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#94A3B8"
            fontSize="7"
            fontFamily="JetBrains Mono, monospace"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

export default function CommandCenterSection() {
  const panels = [
    {
      title: "Graph Explorer",
      icon: Monitor,
      content: <MiniGraph />,
      span: "col-span-2 row-span-2",
    },
    {
      title: "Risk Radar",
      icon: Shield,
      content: <div className="w-full h-40"><RadarChart /></div>,
      span: "col-span-1 row-span-1",
    },
    {
      title: "Activity Heatmap",
      icon: Map,
      content: <HeatmapGrid />,
      span: "col-span-1 row-span-1",
    },
    {
      title: "Alert Stream",
      icon: AlertTriangle,
      content: (
        <div className="space-y-1.5">
          {["Circular Ring — 94", "Structuring — 82", "Mule Network — 91", "Rapid Layering — 65", "Dormant — 78"].map(
            (alert, i) => (
              <div
                key={i}
                className="flex items-center justify-between text-[10px] font-mono py-1 px-2 rounded bg-white/[0.02]"
              >
                <span className="text-[#94A3B8]">{alert.split(" — ")[0]}</span>
                <span
                  className={
                    parseInt(alert.split(" — ")[1]) > 85
                      ? "text-[#FF3B3B]"
                      : parseInt(alert.split(" — ")[1]) > 70
                      ? "text-[#FF8C42]"
                      : "text-[#FFD166]"
                  }
                >
                  {alert.split(" — ")[1]}
                </span>
              </div>
            )
          )}
        </div>
      ),
      span: "col-span-1 row-span-1",
    },
    {
      title: "Transaction Volume",
      icon: BarChart3,
      content: (
        <div className="flex items-end gap-1 h-24">
          {[32, 45, 28, 55, 41, 63, 38, 72, 48, 35, 58, 67, 42, 53, 39, 61, 44, 56, 37, 85, 78, 92, 88, 74].map((h, i) => (
              <motion.div
                key={i}
                initial={{ height: 0 }}
                whileInView={{ height: h }}
                transition={{ delay: i * 0.03, duration: 0.5 }}
                viewport={{ once: true }}
                className="flex-1 rounded-t"
                style={{
                  backgroundColor:
                    h > 80
                      ? "rgba(255, 59, 59, 0.6)"
                      : h > 50
                      ? "rgba(0, 245, 255, 0.4)"
                      : "rgba(0, 245, 255, 0.15)",
                }}
              />
            ))}
        </div>
      ),
      span: "col-span-1 row-span-1",
    },
    {
      title: "Risk Distribution",
      icon: TrendingUp,
      content: (
        <div className="flex items-center justify-center h-24">
          <div className="flex gap-2">
            {[
              { label: "Critical", pct: 12, color: "#FF3B3B" },
              { label: "High", pct: 28, color: "#FF8C42" },
              { label: "Medium", pct: 35, color: "#FFD166" },
              { label: "Low", pct: 25, color: "#06D6A0" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <motion.div
                  initial={{ height: 0 }}
                  whileInView={{ height: item.pct * 2.5 }}
                  transition={{ duration: 0.8 }}
                  viewport={{ once: true }}
                  className="w-8 rounded-t mx-auto"
                  style={{ backgroundColor: item.color + "80" }}
                />
                <div className="text-[8px] font-mono mt-1" style={{ color: item.color }}>
                  {item.pct}%
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
      span: "col-span-1 row-span-1",
    },
  ];

  return (
    <section id="command-center" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0F172A]/40 to-[#020617]" />
      <div className="absolute inset-0 grid-pattern opacity-10" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
            <Monitor className="w-3 h-3 text-[#00F5FF]" />
            <span className="text-xs font-mono text-[#00F5FF] tracking-wider">
              COMMAND CENTER
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-white">Mission </span>
            <span className="gradient-text">Control</span>
          </h2>
          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
            A unified intelligence dashboard for financial crime operations.
            Real-time monitoring, graph exploration, and risk analysis — all in one view.
          </p>
        </motion.div>

        {/* Dashboard Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass rounded-3xl p-4 md:p-6"
        >
          {/* Dashboard header */}
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF3B3B]/60" />
                <div className="w-3 h-3 rounded-full bg-[#FFD166]/60" />
                <div className="w-3 h-3 rounded-full bg-[#06D6A0]/60" />
              </div>
              <span className="text-xs font-mono text-[#94A3B8]">
                STAR Command Center v2.1
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06D6A0] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#06D6A0]" />
              </span>
              <span className="text-[10px] font-mono text-[#94A3B8]">ALL SYSTEMS NOMINAL</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {panels.map((panel, i) => {
              const Icon = panel.icon;
              return (
                <motion.div
                  key={panel.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  className={`glass rounded-2xl p-4 ${panel.span} overflow-hidden`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-3 h-3 text-[#00F5FF]" />
                    <span className="text-[10px] font-mono text-[#94A3B8] tracking-wider uppercase">
                      {panel.title}
                    </span>
                  </div>
                  {panel.content}
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
