"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { TransactionVolumeChart } from "@/components/charts/TransactionVolumeChart";
import { RiskRadar } from "@/components/charts/RiskRadar";
import { STAGGER_CONTAINER, STAGGER_ITEM_UP } from "@/animations/variants";
import { useAMLStore } from "@/store/useAMLStore";
import { useWebSocketSim } from "@/hooks/useWebSocketSim";
import { starApi, SystemHealth } from "@/lib/api";
import { Activity, ShieldAlert, Crosshair, Network, BarChart2 } from "lucide-react";
import { formatCurrency, getRiskColor } from "@/utils/format";

export default function DashboardPage() {
  const { alerts, transactions } = useAMLStore();
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  
  // Start websocket simulation when on dashboard
  useWebSocketSim();

  useEffect(() => {
    starApi.getHealth().then(setHealthData).catch(console.error);
    const interval = setInterval(() => {
      starApi.getHealth().then(setHealthData).catch(console.error);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // TODO: Replace with real API calls when backend endpoints are available
  // Potential endpoints: /analytics/volume, /analytics/risk-vector
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
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Command Center</h1>
        <p className="text-[#94A3B8]">Real-time AML intelligence overview.</p>
      </div>

      <motion.div
        variants={STAGGER_CONTAINER}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Top Metrics Row */}
        <motion.div variants={STAGGER_ITEM_UP}>
          <MetricCard label="Active Alerts" value={alerts.filter(a => a.status === 'open' || a.status === 'investigating').length} trend={12} icon={ShieldAlert} color="#F43F5E" />
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
          <GlassCard className="col-span-1 md:col-span-2 p-6 h-[300px] flex flex-col relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-[#00F5FF]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-[#00F5FF]" />
                <h3 className="font-bold text-white text-sm">24h Transaction Volume vs Anomalies</h3>
              </div>
              <div className="flex gap-4 text-xs font-mono">
                <div className="flex items-center gap-1 text-[#00F5FF]"><div className="w-2 h-2 rounded-full bg-[#00F5FF]"/> Baseline</div>
                <div className="flex items-center gap-1 text-[#F43F5E]"><div className="w-2 h-2 rounded-full bg-[#F43F5E]"/> Anomalous</div>
              </div>
            </div>
            <div className="flex-1 -ml-4 relative z-10">
              <TransactionVolumeChart data={mockVolumeData} height={200} />
            </div>
          </GlassCard>

          {/* Live Feed List */}
          <GlassCard className="p-4 h-[350px] overflow-hidden flex flex-col border-t-2 border-t-[#3B82F6]">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="font-bold text-white text-sm">Live Alert Stream</h3>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3B82F6] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3B82F6]"></span>
              </span>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-hide">
              {alerts.slice(0, 10).map((alert, i) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={alert.id} 
                  className="bg-[#0f172a] p-3 rounded-lg border border-white/5 hover:border-white/10 transition-colors flex items-start gap-3 cursor-pointer group"
                >
                  <div className="w-1.5 h-full min-h-[40px] rounded-full" style={{ backgroundColor: getRiskColor(alert.severity) }} />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-white truncate max-w-[150px] group-hover:text-[#00F5FF] transition-colors">{alert.type.replace(/_/g, ' ').toUpperCase()}</span>
                      <span className="text-[10px] text-[#94A3B8] font-mono">{alert.time}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] text-[#475569] font-mono">{alert.entityCount} entities</span>
                      <span className="text-xs font-mono font-bold" style={{ color: getRiskColor(alert.severity) }}>{alert.amount}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* Radar Chart */}
          <GlassCard className="p-4 h-[350px] flex flex-col items-center border-t-2 border-t-[#A855F7]">
            <h3 className="font-bold text-white text-sm mb-2 self-start px-2">Aggregate Risk Vector</h3>
            <div className="flex-1 w-full max-w-[300px]">
              <RiskRadar data={mockRadarData} color="#A855F7" />
            </div>
          </GlassCard>

        </motion.div>

        {/* Right Sidebar: Quick Actions & Status */}
        <motion.div variants={STAGGER_ITEM_UP} className="col-span-1 flex flex-col gap-4 mt-4">
          <GlassCard className="p-5 flex-1 border-l-2 border-l-[#10B981]">
            <h3 className="font-bold text-white text-sm mb-4 flex items-center justify-between">
              System Status
              {healthData && (
                <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                  healthData.overall === 'healthy' ? 'bg-[#10B981]/20 text-[#10B981]' : 
                  healthData.overall === 'degraded' ? 'bg-[#FACC15]/20 text-[#FACC15]' : 'bg-[#F43F5E]/20 text-[#F43F5E]'
                }`}>
                  {healthData.overall.toUpperCase()}
                </span>
              )}
            </h3>
            <div className="space-y-4">
              {healthData ? healthData.services.map((svc) => (
                <div key={svc.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-[#94A3B8]">{svc.name}</span>
                    <span className={`font-mono tracking-widest ${
                      svc.status === 'online' ? 'text-[#10B981]' : 
                      svc.status === 'degraded' ? 'text-[#FACC15]' : 'text-[#F43F5E]'
                    }`}>
                      {svc.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: svc.status === 'online' ? "100%" : svc.status === 'degraded' ? "50%" : "0%" }}
                      transition={{ duration: 1 }}
                      className={`h-full ${
                        svc.status === 'online' ? 'bg-[#10B981]' : 
                        svc.status === 'degraded' ? 'bg-[#FACC15]' : 'bg-[#F43F5E]'
                      }`}
                    />
                  </div>
                  {svc.details && <div className="text-[9px] text-[#475569] mt-1">{svc.details}</div>}
                </div>
              )) : (
                <div className="text-sm text-[#94A3B8]">Loading system status...</div>
              )}
            </div>

            <h3 className="font-bold text-white text-sm mt-10 mb-4">Command Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2.5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors text-xs text-[#E2E8F0] font-medium flex items-center justify-between group">
                Generate Daily Briefing
                <Activity className="w-3 h-3 text-[#94A3B8] group-hover:text-white" />
              </button>
              <button className="w-full text-left px-4 py-2.5 rounded-lg border border-[#F43F5E]/20 text-[#F43F5E] hover:bg-[#F43F5E]/10 transition-colors text-xs font-medium flex items-center justify-between group">
                Halt High-Risk Txns
                <ShieldAlert className="w-3 h-3 text-[#F43F5E] group-hover:text-[#F43F5E]" />
              </button>
              <button className="w-full text-left px-4 py-2.5 rounded-lg border border-[#A855F7]/20 text-[#A855F7] hover:bg-[#A855F7]/10 transition-colors text-xs font-medium flex items-center justify-between group">
                Re-train ML Baseline
                <Network className="w-3 h-3 text-[#A855F7] group-hover:text-[#A855F7]" />
              </button>
            </div>
          </GlassCard>
        </motion.div>

      </motion.div>
    </div>
  );
}
