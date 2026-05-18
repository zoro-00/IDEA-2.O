"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  ArrowRight,
  Play,
  ChevronDown,
  AlertTriangle,
  Activity,
} from "lucide-react";
import AnimatedGraphBackground from "@/components/AnimatedGraphBackground";
import { HERO_STATS } from "@/lib/constants";

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

function FloatingCard({ delay, children, className }: { delay: number; children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`glass rounded-2xl p-4 ${className}`}
      style={{ animation: `float ${6 + delay}s ease-in-out infinite ${delay}s` }}
    >
      {children}
    </motion.div>
  );
}

export default function HeroSection() {
  const [currentAlert, setCurrentAlert] = useState(0);
  const alerts = [
    "CIRCULAR TXN DETECTED — 4 nodes, $487K, 72h window",
    "STRUCTURING ALERT — 6× $9.5K deposits, ACC-7833",
    "MULE NETWORK — 8 accounts, community cluster #3",
    "DORMANT REACTIVATION — ACC-4521, 11mo inactive",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAlert((prev) => (prev + 1) % alerts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [alerts.length]);

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background layers */}
      <AnimatedGraphBackground />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617] z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#020617]/80 via-transparent to-[#020617]/80 z-[1]" />

      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern z-[1] opacity-30" />

      {/* Radar sweep effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] z-[1] opacity-10">
        <div className="absolute inset-0 rounded-full border border-[#00F5FF]/10" />
        <div className="absolute inset-[15%] rounded-full border border-[#00F5FF]/10" />
        <div className="absolute inset-[30%] rounded-full border border-[#00F5FF]/10" />
        <div
          className="absolute inset-0 animate-radar"
          style={{
            background: "conic-gradient(from 0deg, transparent 0deg, rgba(0, 245, 255, 0.08) 30deg, transparent 60deg)",
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 w-full">
        <div className="grid lg:grid-cols-5 gap-12 items-center">
          {/* Left content — 3 cols */}
          <div className="lg:col-span-3">
            {/* Live alert ticker */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF3B3B] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF3B3B]" />
              </span>
              <span className="text-xs font-mono text-[#FF3B3B]">LIVE</span>
              <span className="w-px h-3 bg-white/10" />
              <motion.span
                key={currentAlert}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-xs font-mono text-[#94A3B8]"
              >
                {alerts[currentAlert]}
              </motion.span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.9] tracking-tight mb-6"
            >
              <span className="text-white">Follow</span>
              <br />
              <span className="text-white">the </span>
              <span className="gradient-text">Money.</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="text-lg md:text-xl text-[#94A3B8] max-w-lg mb-8 leading-relaxed"
            >
              AI-native graph intelligence platform for modern AML.
              Real-time detection powered by Graph Neural Networks,
              multi-hop tracing, and autonomous investigation.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-wrap gap-4 mb-12"
            >
              <a
                href="#cta"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#00F5FF] to-[#3B82F6] text-[#020617] font-semibold text-base hover:shadow-[0_0_40px_rgba(0,245,255,0.4)] transition-all duration-300"
              >
                Request Demo
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
              <a
                href="#architecture"
                className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl glass hover:bg-white/5 text-white font-medium text-base transition-all duration-300"
              >
                <Play className="w-4 h-4" />
                View Architecture
              </a>
              <a
                href="#command-center"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 hover:border-[#00F5FF]/30 text-[#94A3B8] hover:text-white font-medium text-base transition-all duration-300"
              >
                Launch Platform
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-6"
            >
              {HERO_STATS.map((stat, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-2xl md:text-3xl font-bold font-mono text-white">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-xs text-[#94A3B8] font-mono uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right side — Floating Intelligence Cards */}
          <div className="lg:col-span-2 relative hidden lg:block h-[500px]">
            {/* Risk Score Card */}
            <FloatingCard delay={0.8} className="absolute top-0 right-0 w-64">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-[#94A3B8]">RISK ANALYSIS</span>
                <AlertTriangle className="w-4 h-4 text-[#FF3B3B]" />
              </div>
              <div className="flex items-end gap-2 mb-2">
                <span className="text-4xl font-bold font-mono text-[#FF3B3B]">87</span>
                <span className="text-sm text-[#94A3B8] mb-1">/100</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "87%" }}
                  transition={{ delay: 1.5, duration: 1.5, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-[#FF8C42] to-[#FF3B3B]"
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[#94A3B8]">Rules</span>
                  <span className="block text-[#FF8C42]">30%</span>
                </div>
                <div>
                  <span className="text-[#94A3B8]">Graph</span>
                  <span className="block text-[#3B82F6]">25%</span>
                </div>
                <div>
                  <span className="text-[#94A3B8]">Behavioral</span>
                  <span className="block text-[#A855F7]">25%</span>
                </div>
                <div>
                  <span className="text-[#94A3B8]">GNN</span>
                  <span className="block text-[#06B6D4]">20%</span>
                </div>
              </div>
            </FloatingCard>

            {/* Transaction Flow Card */}
            <FloatingCard delay={1.2} className="absolute top-52 left-0 w-56">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-3 h-3 text-[#00F5FF]" />
                <span className="text-xs font-mono text-[#94A3B8]">LIVE FLOW</span>
              </div>
              <div className="space-y-2">
                {["ACC-4521 → ACC-7833", "ACC-7833 → ACC-9877", "ACC-9877 → ACC-5590"].map(
                  (flow, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.8 + i * 0.3 }}
                      className="flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-[#94A3B8]">{flow}</span>
                      <span className="text-[#FF3B3B]">$9.5K</span>
                    </motion.div>
                  )
                )}
              </div>
              <div className="mt-2 px-2 py-1 rounded-lg bg-[#FF3B3B]/10 text-[#FF3B3B] text-[10px] font-mono text-center">
                ⚠ CIRCULAR PATTERN
              </div>
            </FloatingCard>

            {/* GNN Score Card */}
            <FloatingCard delay={1.0} className="absolute bottom-10 right-12 w-52">
              <div className="text-xs font-mono text-[#94A3B8] mb-2">GRAPHSAGE OUTPUT</div>
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 -rotate-90">
                    <circle
                      cx="24" cy="24" r="20"
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="3"
                    />
                    <motion.circle
                      cx="24" cy="24" r="20"
                      fill="none"
                      stroke="#A855F7"
                      strokeWidth="3"
                      strokeDasharray={`${0.91 * 125.6} 125.6`}
                      initial={{ strokeDasharray: "0 125.6" }}
                      animate={{ strokeDasharray: `${0.91 * 125.6} 125.6` }}
                      transition={{ delay: 2, duration: 1.5 }}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold font-mono text-[#A855F7]">
                    .91
                  </span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">Suspicious</div>
                  <div className="text-xs text-[#94A3B8]">P(fraud) = 0.91</div>
                </div>
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
          <span className="text-xs font-mono text-[#94A3B8] tracking-wider">SCROLL TO EXPLORE</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <ChevronDown className="w-5 h-5 text-[#00F5FF]" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
