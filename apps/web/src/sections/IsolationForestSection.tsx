"use client";

import { motion, useInView, useAnimation } from "framer-motion";
import { useRef, useState, useEffect, useCallback } from "react";
import { Brain, TreePine, Activity, Target, Zap, TrendingUp } from "lucide-react";

// ─── Isolation Forest Visualization ──────────────────────────────────────────
function IsolationTreeCanvas() {
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
    timeRef.current += 0.012;
    const time = timeRef.current;

    ctx.clearRect(0, 0, w, h);

    // Draw 12 isolation trees (simplified as branching structures)
    const treeCount = 12;
    const treeWidth = w / treeCount;

    for (let t = 0; t < treeCount; t++) {
      const tx = treeWidth * t + treeWidth / 2;
      const baseY = h - 10;
      const treeH = h * (0.5 + Math.sin(t * 1.3 + time * 0.3) * 0.15);

      // Tree highlight for suspicious (trees 0, 3, 7)
      const isSuspicious = [0, 3, 7].includes(t);
      const treeColor = isSuspicious ? "#F43F5E" : "#00F5FF";
      const pulse = Math.sin(time * 2 + t * 0.5) * 0.3 + 0.7;

      // Draw isolation tree as vertical branch structure
      const drawBranch = (x: number, y: number, length: number, depth: number, angle: number) => {
        if (depth <= 0 || length < 2) return;

        const ex = x + Math.cos(angle) * length;
        const ey = y - Math.abs(Math.sin(angle) * length);

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(ex, ey);
        ctx.strokeStyle = isSuspicious
          ? `rgba(244, 63, 94, ${(0.15 + depth * 0.08) * pulse})`
          : `rgba(0, 245, 255, ${(0.1 + depth * 0.06) * pulse})`;
        ctx.lineWidth = depth * 0.4;
        ctx.stroke();

        const spread = (Math.PI / 4) + Math.sin(time + t + depth) * 0.1;
        drawBranch(ex, ey, length * 0.65, depth - 1, angle - spread);
        drawBranch(ex, ey, length * 0.65, depth - 1, angle + spread);
      };

      // Trunk
      ctx.beginPath();
      ctx.moveTo(tx, baseY);
      ctx.lineTo(tx, baseY - treeH * 0.35);
      ctx.strokeStyle = isSuspicious
        ? `rgba(244, 63, 94, ${0.6 * pulse})`
        : `rgba(0, 245, 255, ${0.3 * pulse})`;
      ctx.lineWidth = isSuspicious ? 1.5 : 0.8;
      ctx.stroke();

      // Branches at top
      drawBranch(tx, baseY - treeH * 0.35, treeH * 0.25, 4, -Math.PI / 2);

      // Root glow
      if (isSuspicious) {
        const grad = ctx.createRadialGradient(tx, baseY, 0, tx, baseY, 20);
        grad.addColorStop(0, `rgba(244, 63, 94, 0.2)`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(tx - 20, baseY - 20, 40, 40);
      }
    }

    // Draw isolation path highlight for suspicious node
    const pathProgress = (time * 0.2) % 1;
    const suspiciousX = treeWidth * 3 + treeWidth / 2;
    const pathY = (h - 10) * (1 - pathProgress * 0.6);
    ctx.beginPath();
    ctx.arc(suspiciousX, pathY, 4 * (1 - pathProgress * 0.5), 0, Math.PI * 2);
    ctx.fillStyle = `rgba(244, 63, 94, ${0.8 * (1 - pathProgress)})`;
    ctx.fill();

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return <canvas ref={canvasRef} className="w-full h-[160px]" />;
}

// ─── Feature Score Bars ───────────────────────────────────────────────────────
function FeatureScoreBars() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  const features = [
    { name: "structuring_ratio", score: 0.94, color: "#F43F5E", risk: "CRITICAL" },
    { name: "fan_out_ratio", score: 0.87, color: "#F97316", risk: "HIGH" },
    { name: "night_ratio", score: 0.82, color: "#F97316", risk: "HIGH" },
    { name: "txn_velocity", score: 0.79, color: "#FACC15", risk: "HIGH" },
    { name: "pagerank", score: 0.73, color: "#FACC15", risk: "MED" },
    { name: "avg_amount", score: 0.61, color: "#FACC15", risk: "MED" },
    { name: "unique_receivers", score: 0.48, color: "#10B981", risk: "LOW" },
    { name: "out_degree", score: 0.34, color: "#10B981", risk: "LOW" },
  ];

  return (
    <div ref={ref} className="space-y-2">
      {features.map((f, i) => (
        <motion.div
          key={f.name}
          initial={{ opacity: 0, x: -20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: i * 0.07, duration: 0.4 }}
          className="flex items-center gap-2"
        >
          <span className="text-[9px] font-mono text-[#475569] w-28 flex-shrink-0 text-right">
            {f.name}
          </span>
          <div className="flex-1 h-4 bg-white/[0.03] rounded-sm overflow-hidden relative">
            <motion.div
              initial={{ width: 0 }}
              animate={inView ? { width: `${f.score * 100}%` } : {}}
              transition={{ delay: i * 0.07 + 0.2, duration: 0.8, ease: "easeOut" }}
              className="h-full rounded-sm relative overflow-hidden"
              style={{ backgroundColor: `${f.color}30`, borderRight: `2px solid ${f.color}80` }}
            >
              <motion.div
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 1.5, delay: i * 0.07 + 0.8, ease: "easeInOut" }}
                className="absolute inset-0 opacity-50"
                style={{
                  background: `linear-gradient(90deg, transparent, ${f.color}60, transparent)`,
                }}
              />
            </motion.div>
          </div>
          <span
            className="text-[9px] font-mono w-8 text-right font-bold"
            style={{ color: f.color }}
          >
            {f.score.toFixed(2)}
          </span>
          <span
            className="text-[8px] font-mono px-1.5 py-0.5 rounded font-bold w-14 text-center"
            style={{ backgroundColor: `${f.color}12`, color: f.color }}
          >
            {f.risk}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Anomaly Score Gauge ──────────────────────────────────────────────────────
function AnomalyScoreGauge({ score }: { score: number }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(score * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    tick();
  }, [inView, score]);

  const angle = -135 + displayScore * 2.7; // -135 to +135 degrees
  const scoreColor = displayScore > 70 ? "#F43F5E" : displayScore > 50 ? "#F97316" : "#10B981";

  return (
    <div ref={ref} className="relative w-32 h-32">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Background arc */}
        <path
          d="M 15 80 A 40 40 0 1 1 85 80"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Score arc */}
        <motion.path
          d="M 15 80 A 40 40 0 1 1 85 80"
          fill="none"
          stroke={scoreColor}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${displayScore * 2.2} 220`}
          initial={{ strokeDasharray: "0 220" }}
          animate={inView ? { strokeDasharray: `${score * 2.2} 220` } : {}}
          transition={{ duration: 2, ease: "easeOut" }}
          style={{ filter: `drop-shadow(0 0 6px ${scoreColor}60)` }}
        />
        {/* Needle */}
        <motion.line
          x1="50"
          y1="55"
          x2={50 + Math.cos(((angle - 90) * Math.PI) / 180) * 30}
          y2={55 + Math.sin(((angle - 90) * Math.PI) / 180) * 30}
          stroke={scoreColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 1 }}
          style={{ filter: `drop-shadow(0 0 4px ${scoreColor})` }}
        />
        <circle cx="50" cy="55" r="3" fill={scoreColor} />
        {/* Score text */}
        <text
          x="50"
          y="70"
          textAnchor="middle"
          fill={scoreColor}
          fontSize="14"
          fontWeight="bold"
          fontFamily="JetBrains Mono, monospace"
          style={{ filter: `drop-shadow(0 0 6px ${scoreColor}80)` }}
        >
          {Math.round(displayScore)}
        </text>
        <text
          x="50"
          y="80"
          textAnchor="middle"
          fill="#475569"
          fontSize="6"
          fontFamily="JetBrains Mono, monospace"
        >
          ANOMALY SCORE
        </text>
      </svg>
    </div>
  );
}

// ─── Live Isolation Scoring Feed ──────────────────────────────────────────────
function LiveScoringFeed() {
  const [entries, setEntries] = useState([
    { id: "ACC-4521", score: 0.94, trees: 287, label: "ISOLATED", color: "#F43F5E" },
    { id: "ACC-7833", score: 0.89, trees: 271, label: "ISOLATED", color: "#F97316" },
    { id: "ACC-9877", score: 0.83, trees: 254, label: "ANOMALY", color: "#F97316" },
    { id: "ACC-6612", score: 0.21, trees: 58, label: "NORMAL", color: "#10B981" },
  ]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
      // Slightly fluctuate top scores
      setEntries(prev => prev.map((e, i) => ({
        ...e,
        score: i < 3
          ? Math.min(0.99, Math.max(0.7, e.score + (Math.random() - 0.5) * 0.04))
          : e.score,
        trees: i < 3
          ? Math.min(300, Math.max(240, e.trees + Math.floor((Math.random() - 0.5) * 6)))
          : e.trees,
      })));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2">
      {entries.map((entry, i) => (
        <motion.div
          key={entry.id}
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
          className="flex items-center gap-3 p-2.5 rounded-lg"
          style={{ backgroundColor: `${entry.color}08`, border: `1px solid ${entry.color}15` }}
        >
          <div
            className="w-2 h-2 rounded-full flex-shrink-0 animate-pulse-glow-red"
            style={{ backgroundColor: entry.color, boxShadow: `0 0 8px ${entry.color}` }}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-white font-medium">{entry.id}</span>
              <span
                className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                style={{ color: entry.color, backgroundColor: `${entry.color}15` }}
              >
                {entry.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ width: `${entry.score * 100}%`, backgroundColor: entry.color }}
                  animate={{ width: `${entry.score * 100}%` }}
                  transition={{ duration: 0.6 }}
                />
              </div>
              <span className="text-[9px] font-mono" style={{ color: entry.color }}>
                {entry.score.toFixed(3)}
              </span>
              <span className="text-[9px] font-mono text-[#475569]">
                {entry.trees}/300 trees
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Main Section ─────────────────────────────────────────────────────────────
export default function IsolationForestSection() {
  const ref = useRef(null);

  const allFeatures = [
    "txn_count", "avg_amount", "structuring_ratio", "fan_out_ratio", "pagerank",
    "out_degree", "night_ratio", "txn_velocity", "unique_receivers", "cross_bank_ratio",
    "dormancy_days", "burst_score", "layering_depth", "circular_flag", "geo_entropy",
    "counterparty_diversity", "amount_variance", "hour_entropy", "weekend_ratio",
    "rapid_succession", "mule_score", "shell_indicator", "smurfing_flag",
    "reactivation_score", "community_centrality", "betweenness", "closeness",
    "clustering_coeff", "graph_anomaly_score",
  ];

  return (
    <section id="isolation-forest" className="relative py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#030712] to-[#020617]" />
      <div className="absolute inset-0 grid-pattern opacity-20" />

      {/* Ambient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full ambient-orb-purple opacity-30 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full ambient-orb-cyan opacity-20 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
            <TreePine className="w-3 h-3 text-[#A855F7]" />
            <span className="text-xs font-mono text-[#A855F7] tracking-wider">
              ISOLATION FOREST ENGINE
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            <span className="text-white">300 Trees. 29 Features.</span>
            <br />
            <span className="gradient-text">One Verdict.</span>
          </h2>
          <p className="text-lg text-[#94A3B8] max-w-3xl mx-auto leading-relaxed">
            Our Isolation Forest model isolates suspicious accounts by randomly partitioning
            feature space. Anomalous accounts — structuring, rapid layering, high fan-out —
            are isolated in far fewer splits. Real-time scoring at sub-50ms latency.
          </p>
        </motion.div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-12">

          {/* Left: Forest Visualization + Tree count */}
          <div className="lg:col-span-2 space-y-4">
            {/* Forest visualization panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="glass-cyber rounded-2xl p-6 overflow-hidden relative"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TreePine className="w-4 h-4 text-[#A855F7]" />
                  <span className="text-xs font-mono text-[#A855F7] tracking-wider">ISOLATION FOREST · 300 TREES</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F43F5E] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F43F5E]" />
                  </span>
                  <span className="text-[10px] font-mono text-[#F43F5E]">3 ACCOUNTS ISOLATED</span>
                </div>
              </div>

              <IsolationTreeCanvas />

              <div className="flex items-center justify-between mt-3 text-[9px] font-mono text-[#475569]">
                <span>← NORMAL (long path to isolation)</span>
                <span className="text-[#F43F5E]">SUSPICIOUS (short path) →</span>
              </div>
            </motion.div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "Total Trees", value: "300", icon: TreePine, color: "#A855F7", sub: "ensembled" },
                { label: "AML Features", value: "29", icon: Brain, color: "#00F5FF", sub: "engineered" },
                { label: "Contamination", value: "5%", icon: Target, color: "#F43F5E", sub: "threshold" },
                { label: "Score Latency", value: "<50ms", icon: Zap, color: "#10B981", sub: "per account" },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    viewport={{ once: true }}
                    className="glass-card rounded-xl p-3 text-center hover-glow-cyan"
                    style={{ borderColor: `${stat.color}20` }}
                  >
                    <Icon className="w-4 h-4 mx-auto mb-1.5" style={{ color: stat.color }} />
                    <div className="text-xl font-bold font-mono text-white">{stat.value}</div>
                    <div className="text-[9px] font-mono text-[#475569] uppercase mt-0.5">{stat.label}</div>
                    <div className="text-[8px] font-mono mt-0.5" style={{ color: stat.color }}>{stat.sub}</div>
                  </motion.div>
                );
              })}
            </div>

            {/* 29 Features pill grid */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="glass rounded-xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-3 h-3 text-[#00F5FF]" />
                <span className="text-[10px] font-mono text-[#00F5FF] tracking-wider">29 ENGINEERED AML BEHAVIORAL FEATURES</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {allFeatures.map((feat, i) => {
                  const isHighRisk = ["structuring_ratio", "fan_out_ratio", "circular_flag", "mule_score", "smurfing_flag", "layering_depth"].includes(feat);
                  const isMedium = ["night_ratio", "txn_velocity", "burst_score", "reactivation_score", "graph_anomaly_score"].includes(feat);
                  return (
                    <motion.span
                      key={feat}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.03 }}
                      viewport={{ once: true }}
                      className="text-[9px] font-mono px-2 py-1 rounded-md cursor-default transition-all hover:scale-105"
                      style={{
                        backgroundColor: isHighRisk
                          ? "rgba(244, 63, 94, 0.1)"
                          : isMedium
                          ? "rgba(250, 204, 21, 0.08)"
                          : "rgba(0, 245, 255, 0.06)",
                        color: isHighRisk ? "#F43F5E" : isMedium ? "#FACC15" : "#00F5FF",
                        border: `1px solid ${isHighRisk ? "rgba(244,63,94,0.15)" : isMedium ? "rgba(250,204,21,0.12)" : "rgba(0,245,255,0.1)"}`,
                      }}
                    >
                      {feat}
                    </motion.span>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Right: Anomaly scoring + feature bars */}
          <div className="space-y-4">
            {/* Anomaly gauge */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-cyber rounded-2xl p-5 flex flex-col items-center"
            >
              <div className="text-[10px] font-mono text-[#A855F7] tracking-wider mb-3">ACC-4521 · ANOMALY SCORE</div>
              <AnomalyScoreGauge score={94} />
              <div className="mt-3 text-center">
                <div className="text-[10px] font-mono text-[#475569] mb-1">Isolated in</div>
                <div className="text-2xl font-bold font-mono text-[#F43F5E]">4.2 <span className="text-sm text-[#94A3B8]">avg splits</span></div>
                <div className="text-[9px] font-mono text-[#475569] mt-0.5">vs 15.8 avg for normal</div>
              </div>
              <div className="mt-3 w-full glass rounded-lg px-3 py-2 text-center">
                <div className="text-[9px] font-mono text-[#F43F5E] font-bold">⚠ ACCOUNT ISOLATED</div>
                <div className="text-[8px] font-mono text-[#475569] mt-0.5">SAR recommended</div>
              </div>
            </motion.div>

            {/* Feature importance */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-3 h-3 text-[#F97316]" />
                <span className="text-[10px] font-mono text-[#F97316] tracking-wider">FEATURE CONTRIBUTIONS</span>
              </div>
              <FeatureScoreBars />
            </motion.div>

            {/* Live scoring feed */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-3 h-3 text-[#00F5FF]" />
                  <span className="text-[10px] font-mono text-[#00F5FF] tracking-wider">LIVE SCORING ENGINE</span>
                </div>
                <span className="text-[9px] font-mono text-[#475569]">300-tree ensemble</span>
              </div>
              <LiveScoringFeed />
            </motion.div>
          </div>
        </div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-cyber rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6"
        >
          <div className="flex-1">
            <div className="text-sm font-mono text-[#A855F7] mb-2">ISOLATION FOREST ARCHITECTURE</div>
            <p className="text-[#94A3B8] text-sm leading-relaxed">
              Each of 300 trees randomly selects a feature and split value to recursively partition data.
              Suspicious accounts with extreme <span className="text-[#F43F5E] font-mono">structuring_ratio</span>,
              high <span className="text-[#F97316] font-mono">fan_out_ratio</span>, and anomalous
              <span className="text-[#FACC15] font-mono"> night_ratio</span> are isolated in
              far fewer splits — scoring near 1.0. Contamination threshold set at 5%.
            </p>
          </div>
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="text-4xl font-bold font-mono gradient-text">94.7%</div>
            <div className="text-[10px] font-mono text-[#475569] text-center">DETECTION<br />ACCURACY</div>
          </div>
          <div className="w-px h-16 neon-line-v hidden md:block" />
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="text-4xl font-bold font-mono" style={{ color: "#F43F5E" }}>&lt;38%</div>
            <div className="text-[10px] font-mono text-[#475569] text-center">FALSE<br />POSITIVE RATE</div>
          </div>
          <div className="w-px h-16 neon-line-v hidden md:block" />
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="text-4xl font-bold font-mono text-[#10B981]">&lt;50ms</div>
            <div className="text-[10px] font-mono text-[#475569] text-center">SCORING<br />LATENCY</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
