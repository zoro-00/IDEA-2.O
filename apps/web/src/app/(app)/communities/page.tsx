"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Users, Filter, ArrowRight } from "lucide-react";

export default function CommunitiesPage() {
  const mockCommunities = [
    { id: "C-942", size: 45, risk: 94, type: "Circular Laundering", region: "US/EU/APAC" },
    { id: "C-112", size: 128, risk: 85, type: "Mule Network", region: "EU" },
    { id: "C-443", size: 12, risk: 98, type: "Shell Company Ring", region: "LATAM" },
    { id: "C-881", size: 340, risk: 45, type: "Standard Corporate", region: "Global" },
    { id: "C-902", size: 67, risk: 62, type: "Structuring Hub", region: "US" },
    { id: "C-019", size: 8, risk: 99, type: "Sanctions Evasion", region: "Middle East" },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto min-h-[calc(100vh-64px)]">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-[#3B82F6]" />
            Community Detection
          </h1>
          <p className="text-[#94A3B8]">Louvain clustering and graph segmentation analysis.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-sm text-[#E2E8F0]">
            <Filter className="w-4 h-4" /> Filter Clusters
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCommunities.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <GlassCard className="p-6 relative overflow-hidden group hover:border-[#3B82F6]/50 transition-colors cursor-pointer">
              {c.risk > 80 && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#F43F5E] blur-[50px] opacity-20 pointer-events-none" />
              )}
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white font-mono mb-1">{c.id}</h3>
                  <p className="text-sm text-[#94A3B8]">{c.type}</p>
                </div>
                <div className={`px-2 py-1 rounded border font-mono text-xs font-bold ${
                  c.risk > 80 ? "bg-[#F43F5E]/10 border-[#F43F5E]/30 text-[#F43F5E]" :
                  c.risk > 60 ? "bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]" :
                  "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]"
                }`}>
                  {c.risk} RISK
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-[#475569]">Nodes</span>
                  <span className="text-white font-mono">{c.size} Entities</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#475569]">Region Span</span>
                  <span className="text-white">{c.region}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-sm text-[#3B82F6] font-medium group-hover:text-[#00F5FF] transition-colors">
                View Graph Sub-network
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
