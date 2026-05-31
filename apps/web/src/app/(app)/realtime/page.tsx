"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { useAMLStore } from "@/store/useAMLStore";
import { useWebSocketSim } from "@/hooks/useWebSocketSim";
import { STAGGER_CONTAINER, STAGGER_ITEM_UP } from "@/animations/variants";
import { Activity, ArrowRight, Server, ShieldCheck, TriangleAlert } from "lucide-react";
import { formatCurrency, getRiskColor } from "@/utils/format";

export default function RealtimePage() {
  const { transactions, isStreaming, toggleStreaming } = useAMLStore();
  useWebSocketSim(); // Start simulation

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 text-[#00F5FF]" />
            Streaming Center
          </h1>
          <p className="text-[#94A3B8]">Live WebSocket ingest and real-time anomaly classification.</p>
          <p className="text-[#F43F5E] text-[10px] mt-1 font-mono uppercase">
            Note: This global stream continuously processes data from the backend independently of the TGNN Demo controls.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm font-bold text-white">{transactions.length.toLocaleString()}</div>
            <div className="text-[10px] font-mono text-[#94A3B8]">EVENTS INGESTED</div>
          </div>
          <button 
            onClick={toggleStreaming}
            className={`px-6 py-2 rounded-lg font-bold text-xs transition-colors border ${
              isStreaming 
                ? "bg-[#F43F5E]/10 text-[#F43F5E] border-[#F43F5E]/30 hover:bg-[#F43F5E]/20" 
                : "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30 hover:bg-[#10B981]/20"
            }`}
          >
            {isStreaming ? "PAUSE STREAM" : "RESUME STREAM"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Stats & Status */}
        <motion.div variants={STAGGER_CONTAINER} initial="hidden" animate="visible" className="col-span-1 flex flex-col gap-4">
          <GlassCard className="p-6 border-l-2 border-l-[#00F5FF]">
            <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
              <Server className="w-4 h-4 text-[#00F5FF]" /> Pipeline Latency
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1 font-mono text-[#94A3B8]">
                  <span>Ingest (Kafka)</span><span>4ms</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-[#3B82F6] w-[15%]" /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1 font-mono text-[#94A3B8]">
                  <span>Feature Extract</span><span>12ms</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-[#A855F7] w-[40%]" /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1 font-mono text-[#94A3B8]">
                  <span>IF-300 Score</span><span>31ms</span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-[#F43F5E] w-[80%]" /></div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 flex-1 border-l-2 border-l-[#F43F5E]">
            <h3 className="font-bold text-white text-sm mb-4 flex items-center gap-2">
              <TriangleAlert className="w-4 h-4 text-[#F43F5E]" /> Recent Anomalies
            </h3>
            <div className="space-y-3">
              {transactions.filter(t => t.anomalyScore >= 0.7).slice(0, 5).map(t => (
                <div key={t.id} className="p-3 bg-[#030712] border border-[#F43F5E]/20 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-mono text-white">{t.id}</span>
                    <span className="text-[10px] font-mono text-[#F43F5E] bg-[#F43F5E]/10 px-1.5 py-0.5 rounded">
                      SCORE: {(t.anomalyScore * 100).toFixed(1)}
                    </span>
                  </div>
                  <div className="text-xs text-[#94A3B8] flex items-center gap-1">
                    {t.from} <ArrowRight className="w-3 h-3" /> {t.to}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>

        {/* Right Column: Live Feed */}
        <div className="col-span-1 lg:col-span-3 flex flex-col min-h-0 bg-[#0F172A]/50 border border-white/5 rounded-2xl overflow-hidden relative">
          
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 bg-[#030712]/80 text-[10px] font-mono font-bold text-[#94A3B8] uppercase tracking-wider shrink-0 z-10">
            <div className="col-span-2">Time / ID</div>
            <div className="col-span-3">Sender</div>
            <div className="col-span-3">Receiver</div>
            <div className="col-span-2 text-right">Amount</div>
            <div className="col-span-2 text-right">Risk Score</div>
          </div>

          {/* Scrolling Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide relative z-0">
            {transactions.slice(0, 50).map((txn, i) => (
              <motion.div
                key={txn.id}
                initial={{ opacity: 0, y: -20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`grid grid-cols-12 gap-4 p-4 rounded-xl border items-center text-sm transition-colors ${
                  txn.anomalyScore >= 0.7 
                    ? "bg-[#F43F5E]/5 border-[#F43F5E]/20 hover:bg-[#F43F5E]/10 shadow-[0_0_15px_rgba(244,63,94,0.1)]" 
                    : "bg-white/5 border-transparent hover:bg-white/10"
                }`}
              >
                <div className="col-span-2">
                  <div className="text-white font-mono">{txn.timestamp}</div>
                  <div className="text-[10px] text-[#475569] font-mono mt-0.5">{txn.id}</div>
                </div>
                <div className="col-span-3 text-[#94A3B8] font-mono truncate pr-4">
                  {txn.from}
                </div>
                <div className="col-span-3 text-[#94A3B8] font-mono truncate pr-4">
                  {txn.to}
                </div>
                <div className={`col-span-2 text-right font-mono font-bold ${txn.anomalyScore >= 0.7 ? "text-[#F43F5E]" : "text-white"}`}>
                  {formatCurrency(txn.amount)}
                </div>
                <div className="col-span-2 flex justify-end">
                  <div className="px-2 py-1 rounded bg-[#030712] border flex items-center justify-center min-w-[50px]"
                       style={{ borderColor: txn.anomalyScore >= 0.7 ? "rgba(244,63,94,0.3)" : "rgba(255,255,255,0.1)" }}>
                    <span className="font-mono text-xs font-bold" style={{ color: txn.anomalyScore >= 0.7 ? "#F43F5E" : "#10B981" }}>
                      {(txn.anomalyScore * 100).toFixed(0)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom Gradient Fade */}
          <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#020617] to-transparent pointer-events-none z-10" />
        </div>

      </div>
    </div>
  );
}
