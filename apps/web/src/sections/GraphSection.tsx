"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState, useCallback } from "react";
import { GitBranch, Search, Maximize2 } from "lucide-react";
import { GRAPH_NODES, GRAPH_LINKS, COLORS } from "@/lib/constants";

function InteractiveGraph() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<number>(0);

  const paths = [
    ["ACC-4521", "ACC-7833", "ACC-9877", "ACC-5590", "ACC-4521"],
    ["ACC-9877", "ACC-1102", "ACC-4521"],
    ["ACC-5590", "ACC-7744", "ACC-7833"],
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedPath((p) => (p + 1) % paths.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [paths.length]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) / 700;

    timeRef.current += 0.015;
    const time = timeRef.current;

    ctx.clearRect(0, 0, w, h);

    // Map node positions
    const nodePositions: Record<string, { x: number; y: number }> = {};
    GRAPH_NODES.forEach((n) => {
      nodePositions[n.id] = {
        x: cx + n.x * scale,
        y: cy + n.y * scale,
      };
    });

    const currentPath = paths[selectedPath];

    // Draw links
    GRAPH_LINKS.forEach((link) => {
      const src = nodePositions[link.source];
      const tgt = nodePositions[link.target];
      if (!src || !tgt) return;

      const isInPath =
        currentPath.some((id, i) => {
          if (i >= currentPath.length - 1) return false;
          return (
            (link.source === currentPath[i] && link.target === currentPath[i + 1]) ||
            (link.target === currentPath[i] && link.source === currentPath[i + 1])
          );
        });

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);

      if (isInPath) {
        ctx.strokeStyle = "rgba(255, 59, 59, 0.6)";
        ctx.lineWidth = 2.5;
        ctx.shadowColor = "rgba(255, 59, 59, 0.3)";
        ctx.shadowBlur = 10;
      } else if (link.suspicious) {
        ctx.strokeStyle = "rgba(255, 140, 66, 0.2)";
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
      } else {
        ctx.strokeStyle = "rgba(0, 245, 255, 0.08)";
        ctx.lineWidth = 0.5;
        ctx.shadowBlur = 0;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Flow particles on path
      if (isInPath) {
        const progress = (time * 0.3) % 1;
        const px = src.x + (tgt.x - src.x) * progress;
        const py = src.y + (tgt.y - src.y) * progress;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 59, 59, 0.8)";
        ctx.fill();

        // Trail
        for (let t = 0; t < 3; t++) {
          const tp = (time * 0.3 - t * 0.05) % 1;
          if (tp > 0) {
            const tx = src.x + (tgt.x - src.x) * tp;
            const ty = src.y + (tgt.y - src.y) * tp;
            ctx.beginPath();
            ctx.arc(tx, ty, 2 - t * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 59, 59, ${0.4 - t * 0.1})`;
            ctx.fill();
          }
        }
      }
    });

    // Draw nodes
    GRAPH_NODES.forEach((node) => {
      const pos = nodePositions[node.id];
      if (!pos) return;

      const isInPath = currentPath.includes(node.id);
      const pulse = Math.sin(time * 2 + node.risk * 0.1) * 0.3 + 0.7;
      const radius = isInPath ? 10 : 4 + (node.risk / 100) * 6;

      // Glow for high-risk nodes
      if (node.risk > 60) {
        const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius * 4);
        const glowColor = isInPath
          ? `rgba(255, 59, 59, ${0.15 * pulse})`
          : `rgba(0, 245, 255, ${0.08 * pulse})`;
        grad.addColorStop(0, glowColor);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(pos.x - radius * 4, pos.y - radius * 4, radius * 8, radius * 8);
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius * pulse, 0, Math.PI * 2);
      const communityColors = ["#FF3B3B", "#00F5FF", "#06D6A0"];
      ctx.fillStyle = isInPath
        ? `rgba(255, 59, 59, ${0.8 * pulse})`
        : communityColors[node.community] || "#94A3B8";
      ctx.fill();

      // Node border
      if (isInPath) {
        ctx.strokeStyle = "rgba(255, 59, 59, 0.4)";
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Label
      if (radius > 5 || isInPath) {
        ctx.font = `${isInPath ? "bold " : ""}${isInPath ? 11 : 9}px "JetBrains Mono", monospace`;
        ctx.fillStyle = isInPath ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.5)";
        ctx.textAlign = "center";
        ctx.fillText(node.name, pos.x, pos.y + radius + 14);
      }
    });

    animRef.current = requestAnimationFrame(draw);
  }, [selectedPath, paths]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <div className="relative w-full h-[500px] glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-[#00F5FF]" />
          <span className="text-xs font-mono text-[#00F5FF] tracking-wider">
            GRAPH EXPLORER
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg glass hover:bg-white/10 transition-colors">
            <Search className="w-3 h-3 text-[#94A3B8]" />
          </button>
          <button className="p-1.5 rounded-lg glass hover:bg-white/10 transition-colors">
            <Maximize2 className="w-3 h-3 text-[#94A3B8]" />
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-[10px] font-mono">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#FF3B3B]" />
          <span className="text-[#94A3B8]">Suspicious Cluster</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#00F5FF]" />
          <span className="text-[#94A3B8]">Monitored</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#06D6A0]" />
          <span className="text-[#94A3B8]">Legitimate</span>
        </div>
      </div>

      {/* Path indicator */}
      <div className="absolute bottom-4 right-4 glass rounded-lg px-3 py-1.5">
        <span className="text-[10px] font-mono text-[#FF3B3B]">
          PATH {selectedPath + 1}/{paths.length} · {paths[selectedPath].length - 1} HOPS
        </span>
      </div>
    </div>
  );
}

export default function GraphSection() {
  const ref = useRef(null);

  const capabilities = [
    {
      title: "Multi-hop Tracing",
      desc: "Follow money through N intermediaries. Reconstruct the complete laundering chain with weighted path analysis.",
      color: "#00F5FF",
    },
    {
      title: "Circular Detection",
      desc: "Detect money loops: A→B→C→A. The smoking gun of round-tripping laundering, found automatically by graph traversal.",
      color: "#FF3B3B",
    },
    {
      title: "Community Detection",
      desc: "Louvain algorithm reveals tightly-knit clusters — potential mule rings and shell company networks.",
      color: "#A855F7",
    },
    {
      title: "GNN Classification",
      desc: "GraphSAGE neural network learns suspicious patterns from graph topology. No manual feature engineering.",
      color: "#06B6D4",
    },
  ];

  return (
    <section id="graph" className="relative py-32 overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0F172A]/50 to-[#020617]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
            <GitBranch className="w-3 h-3 text-[#A855F7]" />
            <span className="text-xs font-mono text-[#A855F7] tracking-wider">
              GRAPH INTELLIGENCE
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-white">See What Legacy </span>
            <br className="hidden md:block" />
            <span className="gradient-text">Systems Miss</span>
          </h2>
          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
            Graph-native intelligence reveals hidden connections that flat-table
            AML systems simply cannot detect. Multi-hop paths, circular patterns,
            and community structures — visible in seconds.
          </p>
        </motion.div>

        {/* Graph + Capabilities */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Graph visualization */}
          <div className="lg:col-span-2">
            <InteractiveGraph />
          </div>

          {/* Capabilities list */}
          <div className="space-y-4">
            {capabilities.map((cap, i) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-5 hover:bg-white/[0.04] transition-all group cursor-pointer"
                style={{
                  borderLeft: `2px solid ${cap.color}`,
                }}
              >
                <h4
                  className="text-sm font-semibold mb-1.5"
                  style={{ color: cap.color }}
                >
                  {cap.title}
                </h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  {cap.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
