"use client";

import { useParams } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { User, Activity, ShieldAlert, FileText, Share2 } from "lucide-react";

export default function EntityInvestigationPage() {
  const params = useParams();
  const id = params.id as string;

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto min-h-[calc(100vh-64px)]">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-[#00F5FF] font-mono tracking-widest mb-1">ENTITY PROFILE</div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <User className="w-8 h-8 text-[#00F5FF]" />
            {id || "ACC-UNKNOWN"}
          </h1>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#A855F7]/10 border border-[#A855F7]/30 text-[#A855F7] hover:bg-[#A855F7]/20 transition-colors text-sm font-bold">
            <FileText className="w-4 h-4" /> Generate Entity SAR
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="p-6 flex flex-col gap-4 border-l-2 border-l-[#F43F5E]">
           <h3 className="text-white font-bold text-sm">Risk Profile</h3>
           <div className="flex justify-between items-center text-sm">
             <span className="text-[#94A3B8]">Entity Risk Score</span>
             <span className="font-mono text-[#F43F5E] font-bold text-xl">94</span>
           </div>
           <div className="flex justify-between items-center text-sm border-t border-white/5 pt-3">
             <span className="text-[#94A3B8]">Anomaly Confidence</span>
             <span className="font-mono text-white">99.1%</span>
           </div>
           <div className="flex justify-between items-center text-sm border-t border-white/5 pt-3">
             <span className="text-[#94A3B8]">Primary Tag</span>
             <span className="font-mono text-[#EAB308]">STRUCTURING</span>
           </div>
        </GlassCard>
        
        <GlassCard className="col-span-1 lg:col-span-2 p-6 h-[300px] flex flex-col justify-center items-center opacity-50 border-dashed">
           <Activity className="w-8 h-8 text-[#475569] mb-4" />
           <p className="text-[#94A3B8] font-mono text-sm">Entity Timeline / Transactions</p>
        </GlassCard>

        <GlassCard className="col-span-1 lg:col-span-3 p-6 h-[400px] flex flex-col justify-center items-center opacity-50 border-dashed">
           <ShieldAlert className="w-8 h-8 text-[#475569] mb-4" />
           <p className="text-[#94A3B8] font-mono text-sm">1-Hop Neighborhood Graph</p>
        </GlassCard>
      </div>
    </div>
  );
}
