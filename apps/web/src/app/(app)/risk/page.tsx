"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { ScoreHistogram } from "@/components/charts/ScoreHistogram";
import { STAGGER_CONTAINER, STAGGER_ITEM_UP } from "@/animations/variants";
import { Search, Brain, Target, Zap, AlertTriangle, ShieldCheck } from "lucide-react";

export default function RiskEnginePage() {
  const histogramData = [
    { range: "0.0-0.1", count: 4000, isAnomaly: false },
    { range: "0.1-0.2", count: 8500, isAnomaly: false },
    { range: "0.2-0.3", count: 12000, isAnomaly: false },
    { range: "0.3-0.4", count: 9000, isAnomaly: false },
    { range: "0.4-0.5", count: 4500, isAnomaly: false },
    { range: "0.5-0.6", count: 1200, isAnomaly: false },
    { range: "0.6-0.7", count: 400, isAnomaly: true },
    { range: "0.7-0.8", count: 150, isAnomaly: true },
    { range: "0.8-0.9", count: 45, isAnomaly: true },
    { range: "0.9-1.0", count: 12, isAnomaly: true },
  ];

  const features = [
    { name: "out_degree", weight: 0.85, color: "#F43F5E" },
    { name: "txn_velocity", weight: 0.72, color: "#F97316" },
    { name: "structuring_ratio", weight: 0.65, color: "#EAB308" },
    { name: "pagerank", weight: 0.58, color: "#3B82F6" },
    { name: "night_ratio", weight: 0.45, color: "#A855F7" },
    { name: "fan_out_ratio", weight: 0.38, color: "#00F5FF" },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto min-h-[calc(100vh-64px)]">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Search className="w-8 h-8 text-[#A855F7]" />
            Risk Engine
          </h1>
          <p className="text-[#94A3B8]">Isolation Forest anomaly scoring and feature contribution.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A855F7]/10 border border-[#A855F7]/30 text-[#A855F7] hover:bg-[#A855F7]/20 transition-colors text-sm font-bold">
            Retrain Model
          </button>
        </div>
      </div>

      <motion.div variants={STAGGER_CONTAINER} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI Row */}
        <motion.div variants={STAGGER_ITEM_UP}>
          <MetricCard label="Model Accuracy" value={99.4} suffix="%" icon={Target} color="#10B981" />
        </motion.div>
        <motion.div variants={STAGGER_ITEM_UP}>
          <MetricCard label="Inference Latency" value={31} suffix="ms" icon={Zap} color="#00F5FF" />
        </motion.div>
        <motion.div variants={STAGGER_ITEM_UP}>
          <MetricCard label="False Positive Rate" value={2.1} suffix="%" icon={AlertTriangle} color="#F43F5E" />
        </motion.div>

        {/* Score Distribution */}
        <motion.div variants={STAGGER_ITEM_UP} className="col-span-1 md:col-span-2">
          <GlassCard className="p-6 h-[400px] flex flex-col">
            <h3 className="font-bold text-white text-sm mb-6 flex items-center gap-2">
              <Brain className="w-4 h-4 text-[#A855F7]" />
              Isolation Score Distribution
            </h3>
            <div className="flex-1 -ml-4">
              <ScoreHistogram data={histogramData} height={300} />
            </div>
            <div className="mt-4 flex gap-4 text-xs font-mono justify-center border-t border-white/5 pt-4">
              <div className="flex items-center gap-2 text-[#3B82F6]"><div className="w-3 h-3 rounded-sm bg-[#3B82F6]/40 border border-[#3B82F6]" /> Normal Behavior (&lt; 0.6)</div>
              <div className="flex items-center gap-2 text-[#F43F5E]"><div className="w-3 h-3 rounded-sm bg-[#F43F5E]/80 border border-[#F43F5E]" /> Anomalous (&gt;= 0.6)</div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Feature Importance (SHAP) */}
        <motion.div variants={STAGGER_ITEM_UP} className="col-span-1">
          <GlassCard className="p-6 h-[400px] flex flex-col border-t-2 border-t-[#00F5FF]">
            <h3 className="font-bold text-white text-sm mb-6">Global Feature Importance (SHAP)</h3>
            <div className="flex-1 flex flex-col justify-center gap-4">
              {features.map((f, i) => (
                <div key={f.name}>
                  <div className="flex justify-between text-[10px] font-mono text-[#E2E8F0] mb-1.5 uppercase">
                    <span>{f.name}</span>
                    <span>{(f.weight * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 bg-[#0F172A] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${f.weight * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: f.color, boxShadow: `0 0 10px ${f.color}80` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

      </motion.div>
    </div>
  );
}
