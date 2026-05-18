"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Shield,
  TrendingUp,
  Zap,
} from "lucide-react";
import { MOCK_TRANSACTIONS, MOCK_ALERTS } from "@/lib/constants";

function TransactionFeed() {
  const [transactions, setTransactions] = useState(MOCK_TRANSACTIONS.slice(0, 4));
  const [key, setKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTransactions((prev) => {
        const nextIndex = (MOCK_TRANSACTIONS.indexOf(prev[0]) + 1) % MOCK_TRANSACTIONS.length;
        const newTx = MOCK_TRANSACTIONS[nextIndex];
        return [newTx, ...prev.slice(0, 3)];
      });
      setKey((k) => k + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const riskColor = (risk: string) => {
    switch (risk) {
      case "critical": return "#FF3B3B";
      case "high": return "#FF8C42";
      case "medium": return "#FFD166";
      default: return "#06D6A0";
    }
  };

  return (
    <div className="glass rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#00F5FF]" />
          <h3 className="text-sm font-mono font-semibold text-[#00F5FF] tracking-wider">
            LIVE TRANSACTION FEED
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06D6A0] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#06D6A0]" />
          </span>
          <span className="text-xs font-mono text-[#94A3B8]">STREAMING</span>
        </div>
      </div>

      <div className="space-y-2">
        {transactions.map((tx, i) => (
          <motion.div
            key={`${tx.id}-${key}-${i}`}
            initial={i === 0 ? { opacity: 0, y: -20, scale: 0.95 } : { opacity: 1 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-white/[0.03]"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: riskColor(tx.risk) }}
              />
              <div>
                <div className="text-xs font-mono text-white">
                  {tx.from} → {tx.to}
                </div>
                <div className="text-[10px] font-mono text-[#94A3B8]">
                  {tx.timestamp} · {tx.type.replace("_", " ")}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-mono font-semibold text-white">
                ${tx.amount.toLocaleString('en-US')}
              </div>
              {tx.flag && (
                <div
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded mt-0.5"
                  style={{
                    backgroundColor: `${riskColor(tx.risk)}15`,
                    color: riskColor(tx.risk),
                  }}
                >
                  {tx.flag}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function AlertCards() {
  return (
    <div className="glass rounded-2xl p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#FF3B3B]" />
          <h3 className="text-sm font-mono font-semibold text-[#FF3B3B] tracking-wider">
            ACTIVE ALERTS
          </h3>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-[#FF3B3B]/10 text-[#FF3B3B] text-xs font-mono">
          {MOCK_ALERTS.length} OPEN
        </span>
      </div>

      <div className="space-y-3">
        {MOCK_ALERTS.map((alert, i) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            className="group p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all border border-white/[0.03] hover:border-[#00F5FF]/10 cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase"
                    style={{
                      backgroundColor:
                        alert.severity === "critical"
                          ? "rgba(255,59,59,0.15)"
                          : alert.severity === "high"
                          ? "rgba(255,140,66,0.15)"
                          : "rgba(255,209,102,0.15)",
                      color:
                        alert.severity === "critical"
                          ? "#FF3B3B"
                          : alert.severity === "high"
                          ? "#FF8C42"
                          : "#FFD166",
                    }}
                  >
                    {alert.severity}
                  </span>
                  <span className="text-[10px] font-mono text-[#94A3B8]">
                    {alert.id}
                  </span>
                </div>
                <div className="text-sm text-white font-medium">
                  {alert.type}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-[#94A3B8]">
                  <span>{alert.entities} entities</span>
                  <span>·</span>
                  <span>{alert.amount}</span>
                  <span>·</span>
                  <span>{alert.time}</span>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-lg font-bold font-mono text-white">
                  {alert.score}
                </div>
                <div className="text-[9px] text-[#94A3B8]">RISK</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function IntelStats() {
  const stats = [
    { label: "Total Monitored", value: "847K", icon: Shield, color: "#00F5FF" },
    { label: "Critical Alerts", value: "23", icon: AlertTriangle, color: "#FF3B3B" },
    { label: "Under Investigation", value: "12", icon: TrendingUp, color: "#FF8C42" },
    { label: "SAR Filed (MTD)", value: "8", icon: ArrowUpRight, color: "#A855F7" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-4 group hover:border-[#00F5FF]/20 transition-all"
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4" style={{ color: stat.color }} />
              <span className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider">
                {stat.label}
              </span>
            </div>
            <div className="text-3xl font-bold font-mono text-white">
              {stat.value}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

export default function IntelligenceSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="intelligence" className="relative py-32 overflow-hidden" ref={ref}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#030712] to-[#020617]" />
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#00F5FF] animate-pulse" />
            <span className="text-xs font-mono text-[#00F5FF] tracking-wider">
              REAL-TIME INTELLIGENCE
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-white">Live AML </span>
            <span className="gradient-text">Intelligence</span>
          </h2>
          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
            Every transaction analyzed in real-time. Suspicious patterns detected
            and surfaced instantly. No batch processing. No delays.
          </p>
        </motion.div>

        {/* Stats Row */}
        <IntelStats />

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          <TransactionFeed />
          <AlertCards />
        </div>
      </div>
    </section>
  );
}
