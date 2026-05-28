"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  ArrowRight,
  ChevronDown,
  AlertTriangle,
  Activity,
  Shield,
  TrendingUp,
  Eye,
} from "lucide-react";
import AnimatedGraphBackground from "@/components/AnimatedGraphBackground";
import { HERO_STATS } from "@/lib/constants";
import dynamic from "next/dynamic";
import Link from "next/link";

const NetworkGlobe3D = dynamic(() => import("@/components/NetworkGlobe3D"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-transparent" />,
});

// ─── Live Alert Ticker ─────────────────────────────────────────────────────────
function AlertTicker() {
  const alerts = [
    { text: "CIRCULAR TXN — 4 nodes · $487K · 72h window · CRITICAL", color: "#F43F5E", severity: "CRITICAL" },
    { text: "STRUCTURING ALERT — 6× $9.5K deposits · ACC-7833 · HIGH", color: "#F97316", severity: "HIGH" },
    { text: "MULE NETWORK — 8 accounts · community cluster #3 · CRITICAL", color: "#F43F5E", severity: "CRITICAL" },
    { text: "DORMANT REACTIVATION — ACC-4521 · 11mo inactive · $234K · HIGH", color: "#F97316", severity: "HIGH" },
    { text: "GNN SCORE 0.91 — GraphSAGE flagged ACC-9877 · SAR RECOMMENDED", color: "#A855F7", severity: "ML-FLAG" },
  ];
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setCurrent(p => (p + 1) % alerts.length), 3500);
    return () => clearInterval(iv);
  }, [alerts.length]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="inline-flex items-center gap-3 rounded-full px-4 py-1.5 mb-8"
      style={{
        background: "rgba(13, 20, 36, 0.9)",
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Live dot */}
      <span className="relative flex h-2 w-2 flex-shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
      </span>
      <span className="text-[10px] font-bold tracking-[0.12em] font-mono text-[#10B981]">
        LIVE INTEL
      </span>
      <div className="w-px h-3 bg-white/10" />
      <AnimatePresence mode="wait">
        <motion.span
          key={current}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="text-[10px] font-mono tracking-wide"
          style={{ color: alerts[current].color }}
        >
          {alerts[current].text}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ value, suffix = "", prefix = "" }: { value: string; suffix?: string; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;
    const numericPart = value.replace(/[^0-9.]/g, "");
    const target = parseFloat(numericPart);
    const nonNumeric = value.replace(/[0-9.]/g, "");
    const duration = 2000;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = target * eased;

      if (value.includes(".")) {
        setDisplay(current.toFixed(1) + nonNumeric);
      } else {
        setDisplay(Math.floor(current).toLocaleString() + nonNumeric);
      }

      if (progress < 1) requestAnimationFrame(tick);
      else setDisplay(value);
    };

    tick();
  }, [inView, value]);

  return <span ref={ref}>{prefix}{display}{suffix}</span>;
}

// ─── Floating Intelligence Card ───────────────────────────────────────────────
function FloatingCard({
  delay,
  children,
  className,
  glowColor = "rgba(0,245,255,0.1)",
}: {
  delay: number;
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`glass-card rounded-2xl p-4 ${className}`}
      style={{
        animation: `float ${7 + delay}s ease-in-out infinite ${delay}s`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
        borderColor: "rgba(255,255,255,0.06)",
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── Radar Sweep Component ────────────────────────────────────────────────────
function RadarSweep() {
  return (
    <div className="absolute top-8 right-8 w-24 h-24 opacity-40 pointer-events-none">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Rings */}
        {[1, 2, 3].map(r => (
          <circle
            key={r}
            cx="50" cy="50"
            r={r * 15}
            fill="none"
            stroke="rgba(0,245,255,0.15)"
            strokeWidth="0.5"
          />
        ))}
        {/* Cross hairs */}
        <line x1="50" y1="5" x2="50" y2="95" stroke="rgba(0,245,255,0.1)" strokeWidth="0.5" />
        <line x1="5" y1="50" x2="95" y2="50" stroke="rgba(0,245,255,0.1)" strokeWidth="0.5" />
        {/* Sweep */}
        <g style={{ transformOrigin: "50px 50px", animation: "radar-sweep 4s linear infinite" }}>
          <defs>
            <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00F5FF" stopOpacity="0" />
              <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.3" />
            </radialGradient>
          </defs>
          <path
            d="M 50 50 L 50 5 A 45 45 0 0 1 94 65 Z"
            fill="url(#radarGrad)"
          />
          <line
            x1="50" y1="50" x2="50" y2="5"
            stroke="#00F5FF"
            strokeWidth="1"
            opacity="0.6"
          />
        </g>
        {/* Blips */}
        <circle cx="68" cy="28" r="2" fill="#F43F5E" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="35" cy="62" r="1.5" fill="#F97316" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
}

// ─── Main Hero Section ────────────────────────────────────────────────────────
export default function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated graph background */}
      <AnimatedGraphBackground />

      {/* Deep gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/95 via-[#020617]/40 to-[#020617]/95 z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/80 via-transparent to-[#020617]/80 z-[1]" />

      {/* Fine grid overlay */}
      <div className="absolute inset-0 grid-pattern z-[1] opacity-25" />

      {/* Scanlines for cyberpunk feel */}
      <div className="absolute inset-0 scanline z-[1] opacity-30 pointer-events-none" />

      {/* Large ambient glow orbs */}
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full ambient-orb-purple opacity-25 z-[1] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-[500px] h-[500px] rounded-full ambient-orb-cyan opacity-15 z-[1] pointer-events-none" />
      <div className="absolute top-2/3 left-1/2 w-[400px] h-[400px] rounded-full ambient-orb-blue opacity-20 z-[1] pointer-events-none" />

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-20 w-full">
        <div className="grid lg:grid-cols-5 gap-12 items-center min-h-[calc(100vh-8rem)]">

          {/* ─── Left content: 3 cols ──────────────────────── */}
          <div className="lg:col-span-3 flex flex-col justify-center">

            {/* Alert ticker */}
            <AlertTicker />

            {/* System classification badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-2 mb-6"
            >
              <span className="text-[10px] font-mono tracking-[0.2em] text-[#475569] uppercase">
                Spatial Temporal Automated Risk System
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-[#00F5FF]/20 to-transparent" />
              <span className="text-[10px] font-mono text-[#475569]">v2.1</span>
            </motion.div>

            {/* Main headline */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="mb-6"
            >
              <h1 className="font-bold leading-[0.92] tracking-tighter text-white">
                <span className="block text-6xl md:text-7xl lg:text-8xl xl:text-9xl">
                  Follow
                </span>
                <span className="block text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-light italic text-transparent"
                  style={{
                    WebkitTextStroke: "1px rgba(255,255,255,0.3)",
                  }}
                >
                  the Money.
                </span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.8 }}
              className="text-base md:text-lg text-[#94A3B8] max-w-xl mb-10 leading-relaxed"
            >
              AI-native graph intelligence for modern AML. Isolation Forest anomaly detection,
              GNN-powered investigation, and multi-hop laundering tracing — all in real-time.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.8 }}
              className="flex flex-wrap gap-3 mb-14"
            >
              <Link
                href="/dashboard"
                className="group relative inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden"
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
                <Shield className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Launch Platform</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
              </Link>

              <a
                href="#graph"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl border font-medium text-sm transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.08)",
                  color: "#94A3B8",
                  backdropFilter: "blur(10px)",
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,245,255,0.3)";
                  (e.currentTarget as HTMLElement).style.color = "#E2E8F0";
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLElement).style.color = "#94A3B8";
                }}
              >
                <Eye className="w-4 h-4" />
                Explore Platform
              </a>

              <a
                href="#isolation-forest"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl border font-medium text-sm transition-all duration-300"
                style={{
                  background: "rgba(168,85,247,0.05)",
                  borderColor: "rgba(168,85,247,0.15)",
                  color: "#A855F7",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Activity className="w-4 h-4" />
                ML Engine
              </a>
            </motion.div>

            {/* Stats row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6"
            >
              {HERO_STATS.map((stat, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-2xl md:text-3xl font-bold font-mono text-white animate-flicker">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-[10px] text-[#475569] font-mono uppercase tracking-wider">
                    {stat.label}
                  </div>
                  <div className="h-px bg-gradient-to-r from-[#00F5FF]/20 to-transparent" />
                </div>
              ))}
            </motion.div>
          </div>

          {/* ─── Right: Intelligence Cards + Globe ─────────── */}
          <div className="lg:col-span-2 relative hidden lg:block h-[600px]">

            {/* 3D Globe */}
            <NetworkGlobe3D />

            {/* Radar sweep overlay */}
            <RadarSweep />

            {/* ── Risk Score Card ─── */}
            <FloatingCard
              delay={0.9}
              className="absolute top-0 right-0 w-64"
              glowColor="rgba(244,63,94,0.1)"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono text-[#475569] tracking-wider">RISK ANALYSIS · ACC-4521</span>
                <AlertTriangle className="w-3.5 h-3.5 text-[#F43F5E] animate-pulse" />
              </div>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-5xl font-bold font-mono text-[#F43F5E] text-glow-cyan"
                  style={{ textShadow: "0 0 20px rgba(244,63,94,0.5)" }}>87</span>
                <span className="text-sm text-[#475569] mb-2">/100</span>
                <span className="ml-auto text-[9px] font-mono bg-[#F43F5E]/10 text-[#F43F5E] px-2 py-1 rounded font-bold">CRITICAL</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.04] mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "87%" }}
                  transition={{ delay: 1.5, duration: 1.5, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #F97316, #F43F5E)",
                    boxShadow: "0 0 8px rgba(244,63,94,0.4)",
                  }}
                />
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-[9px] font-mono">
                {[
                  { label: "Rules", val: "30%", color: "#F97316" },
                  { label: "Graph", val: "25%", color: "#3B82F6" },
                  { label: "ML", val: "25%", color: "#A855F7" },
                  { label: "GNN", val: "20%", color: "#14B8A6" },
                ].map(m => (
                  <div key={m.label} className="text-center">
                    <div className="text-[#475569]">{m.label}</div>
                    <div className="font-bold" style={{ color: m.color }}>{m.val}</div>
                  </div>
                ))}
              </div>
            </FloatingCard>

            {/* ── Live Transaction Flow ─── */}
            <FloatingCard delay={1.3} className="absolute top-52 left-0 w-60">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-3 h-3 text-[#00F5FF]" />
                <span className="text-[10px] font-mono text-[#00F5FF] tracking-wider">CIRCULAR PATTERN</span>
              </div>
              <div className="space-y-2">
                {[
                  { from: "ACC-4521", to: "ACC-7833", amount: "$9.5K" },
                  { from: "ACC-7833", to: "ACC-9877", amount: "$47K" },
                  { from: "ACC-9877", to: "ACC-5590", amount: "$45.5K" },
                  { from: "ACC-5590", to: "ACC-4521", amount: "$44K" },
                ].map((flow, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.8 + i * 0.2 }}
                    className="flex items-center justify-between text-[10px] font-mono"
                  >
                    <span className="text-[#94A3B8]">{flow.from} → {flow.to}</span>
                    <span className="text-[#F43F5E] font-bold">{flow.amount}</span>
                  </motion.div>
                ))}
              </div>
              <motion.div
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mt-3 px-2 py-1.5 rounded-lg text-center text-[9px] font-mono font-bold"
                style={{ background: "rgba(244,63,94,0.1)", color: "#F43F5E", border: "1px solid rgba(244,63,94,0.2)" }}
              >
                ⚠ CIRCULAR LAUNDERING DETECTED
              </motion.div>
            </FloatingCard>

            {/* ── GNN Score Card ─── */}
            <FloatingCard delay={1.1} className="absolute bottom-16 right-8 w-52">
              <div className="text-[10px] font-mono text-[#475569] mb-3">GRAPHSAGE OUTPUT</div>
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14">
                  <svg className="w-14 h-14 -rotate-90">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="4" />
                    <motion.circle
                      cx="28" cy="28" r="22"
                      fill="none"
                      stroke="#A855F7"
                      strokeWidth="4"
                      strokeLinecap="round"
                      initial={{ strokeDasharray: "0 138.2" }}
                      animate={{ strokeDasharray: `${0.91 * 138.2} 138.2` }}
                      transition={{ delay: 2, duration: 1.5 }}
                      style={{ filter: "drop-shadow(0 0 6px rgba(168,85,247,0.6))" }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold font-mono text-[#A855F7]">
                    .91
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-[#F43F5E]">Suspicious</div>
                  <div className="text-[10px] text-[#475569]">P(fraud) = 0.91</div>
                  <div className="text-[9px] text-[#A855F7] mt-0.5">300-tree ensemble</div>
                </div>
              </div>
            </FloatingCard>

            {/* ── Isolation Forest score card ─── */}
            <FloatingCard delay={1.5} className="absolute bottom-2 left-4 w-44">
              <div className="text-[10px] font-mono text-[#A855F7] mb-2">ISOLATION SCORE</div>
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold font-mono text-[#F43F5E]">0.94</div>
                <div className="flex-1">
                  <div className="text-[9px] font-mono text-[#475569]">Isolated in</div>
                  <div className="text-[10px] font-mono text-[#F43F5E]">4.2 splits</div>
                  <div className="text-[8px] font-mono text-[#475569]">vs 15.8 normal</div>
                </div>
              </div>
              <div className="mt-2 h-1 rounded-full bg-white/[0.04] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "94%" }}
                  transition={{ delay: 2.5, duration: 1 }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #F97316, #F43F5E)", boxShadow: "0 0 6px rgba(244,63,94,0.5)" }}
                />
              </div>
            </FloatingCard>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-[9px] font-mono text-[#475569] tracking-[0.2em]">SCROLL TO EXPLORE</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-4 h-4 text-[#00F5FF]/50" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
