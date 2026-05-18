"use client";

import { motion } from "framer-motion";
import { useRef, useEffect, useCallback } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

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
    timeRef.current += 0.008;
    const time = timeRef.current;

    ctx.clearRect(0, 0, w, h);

    // Neural network nodes
    const layers = 5;
    const nodesPerLayer = 8;
    const nodes: { x: number; y: number; layer: number }[] = [];

    for (let l = 0; l < layers; l++) {
      for (let n = 0; n < nodesPerLayer; n++) {
        const x = (w / (layers + 1)) * (l + 1);
        const y = (h / (nodesPerLayer + 1)) * (n + 1) + Math.sin(time + l + n) * 5;
        nodes.push({ x, y, layer: l });
      }
    }

    // Connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[j].layer === nodes[i].layer + 1) {
          const alpha = 0.03 + Math.sin(time * 2 + i * 0.1) * 0.02;
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(0, 245, 255, ${alpha})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();

          // Flow particle
          const progress = (time * 0.3 + i * 0.05) % 1;
          const px = nodes[i].x + (nodes[j].x - nodes[i].x) * progress;
          const py = nodes[i].y + (nodes[j].y - nodes[i].y) * progress;
          ctx.beginPath();
          ctx.arc(px, py, 1, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(0, 245, 255, ${alpha * 4})`;
          ctx.fill();
        }
      }
    }

    // Nodes
    nodes.forEach((node) => {
      const pulse = Math.sin(time * 2 + node.layer) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(node.x, node.y, 2 * pulse, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 245, 255, ${0.15 * pulse})`;
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
  return (
    <section id="cta" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0F172A] to-[#020617]" />
      <NeuralBackground />

      {/* Glow orbs */}
      <div className="absolute top-1/2 left-1/4 w-96 h-96 rounded-full bg-[#00F5FF]/5 blur-[120px]" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 rounded-full bg-[#A855F7]/5 blur-[100px]" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2">
            <Sparkles className="w-3 h-3 text-[#00F5FF]" />
            <span className="text-xs font-mono text-[#00F5FF] tracking-wider">
              THE FUTURE OF AML
            </span>
          </div>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
            <span className="text-white">Modern AML Requires</span>
            <br />
            <span className="gradient-text">Graph Intelligence.</span>
          </h2>

          <p className="text-lg md:text-xl text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
            Stop drowning in false positives. Start seeing the connections that matter.
            STAR transforms financial crime detection from reactive compliance to
            proactive intelligence.
          </p>

          {/* Comparison strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-6 text-sm font-mono"
          >
            {[
              { legacy: "95% False Positives", star: "<40% False Positives" },
              { legacy: "Hours for SAR", star: "Seconds for SAR" },
              { legacy: "No Graph Intel", star: "Graph-Native" },
            ].map((comp, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[#94A3B8] line-through opacity-50">
                  {comp.legacy}
                </span>
                <ArrowRight className="w-3 h-3 text-[#00F5FF]" />
                <span className="text-[#00F5FF]">{comp.star}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            viewport={{ once: true }}
            className="flex flex-wrap justify-center gap-4 pt-4"
          >
            <a
              href="#"
              className="group inline-flex items-center gap-2 px-10 py-5 rounded-2xl bg-gradient-to-r from-[#00F5FF] to-[#3B82F6] text-[#020617] font-bold text-lg hover:shadow-[0_0_60px_rgba(0,245,255,0.4)] transition-all duration-300"
            >
              Book a Demo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 px-10 py-5 rounded-2xl glass hover:bg-white/5 text-white font-semibold text-lg border border-white/10 hover:border-[#00F5FF]/30 transition-all duration-300"
            >
              Explore Platform
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
