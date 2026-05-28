"use client";

import { motion } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { TransactionVolumeChart } from "@/components/charts/TransactionVolumeChart";
import { RiskRadar } from "@/components/charts/RiskRadar";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { FADE_IN, FADE_UP, STAGGER_CONTAINER, STAGGER_ITEM_UP } from "@/animations/variants";
import { useAMLStore } from "@/store/useAMLStore";
import { Activity, ShieldAlert, Crosshair, Network, BarChart2 } from "lucide-react";
import { formatCurrency, getRiskColor } from "@/utils/format";

export default function CommandCenterSection() {
  const { ref, isInView } = useScrollReveal();
  const { alerts, transactions } = useAMLStore();

  const mockVolumeData = [
    { time: "00:00", volume: 1200, anomaly: 0 },
    { time: "04:00", volume: 900, anomaly: 200 },
    { time: "08:00", volume: 3400, anomaly: 0 },
    { time: "12:00", volume: 5600, anomaly: 400 },
    { time: "16:00", volume: 4800, anomaly: 1200 },
    { time: "20:00", volume: 2100, anomaly: 100 },
    { time: "24:00", volume: 1500, anomaly: 0 },
  ];

  const mockRadarData = [
    { subject: "Velocity", A: 85, fullMark: 100 },
    { subject: "Structuring", A: 65, fullMark: 100 },
    { subject: "Network Centrality", A: 92, fullMark: 100 },
    { subject: "Jurisdiction", A: 70, fullMark: 100 },
    { subject: "Mule Pattern", A: 45, fullMark: 100 },
    { subject: "Dormancy", A: 88, fullMark: 100 },
  ];

  return (
    <section id="command-center" className="relative py-32 bg-[#030712] border-t border-white/5">
      <div className="container mx-auto px-6 lg:px-12 relative z-10" ref={ref}>
        <SectionHeader
          badgeIcon={Activity}
          badgeText="COMMAND CENTER"
          badgeColor="#00F5FF"
          title1="Real-time"
          title2="Intelligence Dashboard."
          description="A unified, single-pane-of-glass view of your institution's risk landscape. Monitor alerts, analyze transaction volumes, and track ML pipeline performance instantly."
        />

        <motion.div
          variants={STAGGER_CONTAINER}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12"
        >
          {/* Top Metrics Row */}
          <motion.div variants={STAGGER_ITEM_UP}>
            <MetricCard label="Active Alerts" value={142} trend={12} icon={ShieldAlert} color="#F43F5E" />
          </motion.div>
          <motion.div variants={STAGGER_ITEM_UP}>
            <MetricCard label="Transactions Analyzed" value={2.7} suffix="M" trend={5} icon={Activity} color="#3B82F6" />
          </motion.div>
          <motion.div variants={STAGGER_ITEM_UP}>
            <MetricCard label="Graph Nodes" value={1.2} suffix="M" trend={8} icon={Network} color="#A855F7" />
          </motion.div>
          <motion.div variants={STAGGER_ITEM_UP}>
            <MetricCard label="Avg Scoring Latency" value={47} suffix="ms" trend={-15} icon={Crosshair} color="#10B981" />
          </motion.div>

          {/* Main Dashboard Area */}
          <motion.div variants={STAGGER_ITEM_UP} className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            
            {/* Chart 1: Volume */}
            <GlassCard className="col-span-1 md:col-span-2 p-6 h-[300px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-[#00F5FF]" />
                  <h3 className="font-bold text-white text-sm">24h Transaction Volume vs Anomalies</h3>
                </div>
                <div className="flex gap-4 text-xs font-mono">
                  <div className="flex items-center gap-1 text-[#00F5FF]"><div className="w-2 h-2 rounded-full bg-[#00F5FF]"/> Baseline</div>
                  <div className="flex items-center gap-1 text-[#F43F5E]"><div className="w-2 h-2 rounded-full bg-[#F43F5E]"/> Anomalous</div>
                </div>
              </div>
              <div className="flex-1 -ml-4">
                <TransactionVolumeChart data={mockVolumeData} height={200} />
              </div>
            </GlassCard>

            {/* Live Feed List */}
            <GlassCard className="p-4 h-[350px] overflow-hidden flex flex-col">
              <h3 className="font-bold text-white text-sm mb-4 px-2">Live Alert Stream</h3>
              <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide">
                {alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className="bg-[#0f172a] p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors flex items-start gap-3">
                    <div className="w-1.5 h-full min-h-[40px] rounded-full" style={{ backgroundColor: getRiskColor(alert.severity) }} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-white truncate max-w-[150px]">{alert.type.replace(/_/g, ' ').toUpperCase()}</span>
                        <span className="text-[10px] text-[#94A3B8] font-mono">{alert.time}</span>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className="text-[10px] text-[#475569] font-mono">{alert.entityCount} entities</span>
                        <span className="text-xs font-mono" style={{ color: getRiskColor(alert.severity) }}>{alert.amount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>

            {/* Radar Chart */}
            <GlassCard className="p-4 h-[350px] flex flex-col items-center">
              <h3 className="font-bold text-white text-sm mb-2 self-start px-2">Aggregate Risk Vector</h3>
              <div className="flex-1 w-full max-w-[300px]">
                <RiskRadar data={mockRadarData} color="#A855F7" />
              </div>
            </GlassCard>

          </motion.div>

          {/* Right Sidebar: Quick Actions & Status */}
          <motion.div variants={STAGGER_ITEM_UP} className="col-span-1 flex flex-col gap-4 mt-4">
            <GlassCard className="p-5 flex-1 border-t-2 border-t-[#00F5FF]">
              <h3 className="font-bold text-white text-sm mb-4">System Status</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#94A3B8]">Isolation Forest Pipeline</span>
                    <span className="text-[#10B981] font-mono">ONLINE</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#10B981] w-[100%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#94A3B8]">GraphSAGE Engine</span>
                    <span className="text-[#10B981] font-mono">ONLINE</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#10B981] w-[100%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#94A3B8]">Data Ingestion Load</span>
                    <span className="text-[#FACC15] font-mono">78%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#FACC15] w-[78%]" />
                  </div>
                </div>
              </div>

              <h3 className="font-bold text-white text-sm mt-8 mb-4">Command Actions</h3>
              <div className="space-y-2">
                <button className="w-full text-left px-4 py-2 rounded border border-white/5 hover:bg-white/5 transition-colors text-xs text-[#E2E8F0] font-medium">
                  Generate Daily Briefing
                </button>
                <button className="w-full text-left px-4 py-2 rounded border border-[#F43F5E]/20 text-[#F43F5E] hover:bg-[#F43F5E]/10 transition-colors text-xs font-medium">
                  Halt All High-Risk Txns
                </button>
                <button className="w-full text-left px-4 py-2 rounded border border-[#A855F7]/20 text-[#A855F7] hover:bg-[#A855F7]/10 transition-colors text-xs font-medium">
                  Re-train ML Baseline
                </button>
              </div>
            </GlassCard>
          </motion.div>

        </motion.div>
      </div>
    </section>
  );
}
