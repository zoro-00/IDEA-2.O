"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Gauge } from "lucide-react";
import { PERFORMANCE_METRICS } from "@/lib/constants";

function AnimatedMetric({
  label,
  value,
  suffix,
  prefix,
  delay,
}: {
  label: string;
  value: number;
  suffix: string;
  prefix: string;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (!inView) return;

    const timeout = setTimeout(() => {
      const duration = 2500;
      const start = Date.now();

      const tick = () => {
        const elapsed = Date.now() - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        const current = value * eased;

        if (value % 1 !== 0) {
          setDisplay(current.toFixed(1));
        } else {
          setDisplay(Math.floor(current).toLocaleString());
        }

        if (progress < 1) requestAnimationFrame(tick);
        else {
          if (value % 1 !== 0) setDisplay(value.toFixed(1));
          else setDisplay(value.toLocaleString());
        }
      };

      tick();
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [inView, value, delay]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      viewport={{ once: true }}
      className="glass rounded-2xl p-6 text-center group hover:glow-cyan transition-all duration-500"
    >
      <div className="text-4xl md:text-5xl font-bold font-mono text-white mb-2">
        <span className="text-[#94A3B8] text-2xl">{prefix}</span>
        <span className="gradient-text">{display}</span>
        <span className="text-[#94A3B8] text-lg ml-1">{suffix}</span>
      </div>
      <div className="text-xs font-mono text-[#94A3B8] uppercase tracking-wider">
        {label}
      </div>

      {/* Progress bar */}
      <div className="mt-4 w-full h-1 rounded-full bg-white/5">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.min((value / 3000) * 100, 100)}%` }}
          transition={{ delay: delay + 0.5, duration: 1.5, ease: "easeOut" }}
          viewport={{ once: true }}
          className="h-full rounded-full bg-gradient-to-r from-[#00F5FF] to-[#3B82F6]"
        />
      </div>
    </motion.div>
  );
}

export default function PerformanceSection() {
  return (
    <section className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#030712] to-[#020617]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
            <Gauge className="w-3 h-3 text-[#06D6A0]" />
            <span className="text-xs font-mono text-[#06D6A0] tracking-wider">
              PERFORMANCE
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-white">Built for </span>
            <span className="gradient-text">Speed</span>
          </h2>
          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
            Sub-second detection at scale. Every metric engineered for
            production-grade financial intelligence.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {PERFORMANCE_METRICS.map((metric, i) => (
            <AnimatedMetric
              key={metric.label}
              label={metric.label}
              value={metric.value}
              suffix={metric.suffix}
              prefix={metric.prefix}
              delay={i * 0.1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
