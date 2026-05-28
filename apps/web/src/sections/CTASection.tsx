"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useCallback } from "react";
import { ArrowRight, Sparkles, Shield, Zap, GitBranch, Brain } from "lucide-react";
import Link from "next/link";

function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

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
    timeRef.current += 0.007;
    const time = timeRef.current;

    ctx.clearRect(0, 0, w, h);

    // Neural network nodes in layers
    const layers = 6;
    const nodesPerLayer = 7;
    const nodes: { x: number; y: number; layer: number; active: boolean }[] = [];

    for (let l = 0; l < layers; l++) {
      for (let n = 0; n < nodesPerLayer; n++) {
        const baseX = (w / (layers + 1)) * (l + 1);
        const baseY = (h / (nodesPerLayer + 1)) * (n + 1);
        const jitterX = Math.sin(time * 0.5 + l * 2 + n) * 4;
        const jitterY = Math.cos(time * 0.4 + n * 2 + l) * 4;
        nodes.push({
          x: baseX + jitterX,
          y: baseY + jitterY,
          layer: l,
          active: Math.sin(time * 1.5 + l * n * 0.5) > 0.4,
        });
      }
    }

    // Draw connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[j].layer === nodes[i].layer + 1) {
          const alpha = 0.025 + Math.sin(time * 1.5 + i * 0.1) * 0.015;
          const isActive = nodes[i].active && nodes[j].active;

          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = isActive
            ? `rgba(0, 245, 255, ${alpha * 3})`
            : `rgba(79, 70, 229, ${alpha})`;
          ctx.lineWidth = isActive ? 0.8 : 0.4;
          ctx.stroke();

          // Flow particle
          if (isActive) {
            const progress = (time * 0.4 + i * 0.07) % 1;
            const px = nodes[i].x + (nodes[j].x - nodes[i].x) * progress;
            const py = nodes[i].y + (nodes[j].y - nodes[i].y) * progress;
            ctx.beginPath();
            ctx.arc(px, py, 1.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(0, 245, 255, ${alpha * 8})`;
            ctx.fill();
          }
        }
      }
    }

    // Draw nodes
    nodes.forEach((node) => {
      const pulse = Math.sin(time * 2 + node.layer + node.y * 0.01) * 0.3 + 0.7;
      const r = (node.active ? 2.5 : 1.5) * pulse;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = node.active
        ? `rgba(0, 245, 255, ${0.2 * pulse})`
        : `rgba(79, 70, 229, ${0.12 * pulse})`;
      ctx.fill();
    });

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

export default function CTASection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const comparisons = [
    { legacy: "95% False Positives", star: "<38% False Positives", icon: Shield },
    { legacy: "Hours for SAR Filing", star: "Seconds with AI Copilot", icon: Zap },
    { legacy: "Flat-table Detection", star: "Graph-native Intelligence", icon: GitBranch },
    { legacy: "Batch Processing", star: "Sub-50ms Real-time", icon: Brain },
  ];

  return (
    <section id="cta" className="relative py-40 overflow-hidden" ref={ref}>
      {/* Layered backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0F172A] to-[#020617]" />
      <NeuralBackground />

      {/* Glow orbs */}
      <div className="absolute top-1/3 left-1/6 w-[500px] h-[500px] rounded-full ambient-orb-cyan opacity-20 pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/6 w-[400px] h-[400px] rounded-full ambient-orb-purple opacity-15 pointer-events-none" />

      {/* Scanlines */}
      <div className="absolute inset-0 scanline opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-10"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-3 h-3 text-[#00F5FF]" />
            </motion.div>
            <span className="text-xs font-mono text-[#00F5FF] tracking-[0.12em]">
              THE FUTURE OF FINANCIAL CRIME DETECTION
            </span>
          </div>

          {/* Headline */}
          <div>
            <h2 className="text-5xl md:text-6xl lg:text-8xl font-bold leading-[0.9] tracking-tighter">
              <span className="text-white block mb-2">Modern AML Requires</span>
              <span className="gradient-text block">Graph Intelligence.</span>
            </h2>
          </div>

          {/* Subtext */}
          <p className="text-lg md:text-xl text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
            Stop drowning in false positives. Start seeing the connections that matter.
            STAR transforms financial crime detection from reactive compliance to proactive
            AI-native intelligence.
          </p>

          {/* Comparison grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto"
          >
            {comparisons.map((comp, i) => {
              const Icon = comp.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 + 0.3 }}
                  viewport={{ once: true }}
                  className="glass-card rounded-xl p-3 text-center"
                  style={{ border: "1px solid rgba(0,245,255,0.06)" }}
                >
                  <Icon className="w-4 h-4 text-[#475569] mx-auto mb-2" />
                  <div className="text-[8px] font-mono text-[#475569] line-through mb-1">
                    {comp.legacy}
                  </div>
                  <ArrowRight className="w-2.5 h-2.5 text-[#00F5FF] mx-auto mb-1" />
                  <div className="text-[9px] font-mono text-[#00F5FF] font-bold">
                    {comp.star}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-4 pt-4"
          >
            <Link
              href="/dashboard"
              className="group relative inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-base overflow-hidden transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, #00F5FF, #3B82F6, #A855F7)",
                color: "#020617",
              }}
            >
              <motion.div
                animate={{ x: ["-200%", "200%"] }}
                transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
                className="absolute inset-0 opacity-30"
                style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)" }}
              />
              <Shield className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Launch Platform</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
            </Link>
            <a
              href="#intelligence"
              className="group inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-semibold text-base transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#E2E8F0",
                backdropFilter: "blur(20px)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.25)";
                (e.currentTarget as HTMLElement).style.background = "rgba(0,245,255,0.04)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
              }}
            >
              Explore Platform
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform text-[#00F5FF]" />
            </a>
          </motion.div>

          {/* Trust badges */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-6 pt-4"
          >
            {["SOC 2 Type II", "GDPR Compliant", "BSA/AML Ready", "ISO 27001"].map((badge) => (
              <div key={badge} className="flex items-center gap-2 text-[10px] font-mono text-[#475569]">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" style={{ boxShadow: "0 0 4px rgba(16,185,129,0.6)" }} />
                {badge}
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
