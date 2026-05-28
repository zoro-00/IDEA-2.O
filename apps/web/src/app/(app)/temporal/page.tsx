"use client";

import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Clock, Calendar, Activity } from "lucide-react";

export default function TemporalAnalyticsPage() {
  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto min-h-[calc(100vh-64px)]">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Clock className="w-8 h-8 text-[#EAB308]" />
            Temporal Analytics
          </h1>
          <p className="text-[#94A3B8]">Time-series anomaly detection, burst analysis, and dormancy tracking.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
          <GlassCard className="p-6 h-[400px] flex flex-col justify-center items-center opacity-50 border-dashed">
             <Calendar className="w-12 h-12 text-[#475569] mb-4" />
             <p className="text-[#94A3B8] font-mono text-sm">Temporal Heatmap (Coming Soon)</p>
          </GlassCard>
        </div>
        
        <div className="col-span-1 flex flex-col gap-6">
          <GlassCard className="p-6 h-[200px] flex flex-col justify-center items-center opacity-50 border-dashed">
             <Activity className="w-8 h-8 text-[#475569] mb-4" />
             <p className="text-[#94A3B8] font-mono text-sm">Burst Detection Events</p>
          </GlassCard>
          <GlassCard className="p-6 h-[175px] flex flex-col justify-center items-center opacity-50 border-dashed">
             <Clock className="w-8 h-8 text-[#475569] mb-4" />
             <p className="text-[#94A3B8] font-mono text-sm">Dormancy Reactivations</p>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
