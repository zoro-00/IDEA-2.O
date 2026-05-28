"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Settings, Sliders, HardDrive, Bell } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto min-h-[calc(100vh-64px)]">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <Settings className="w-8 h-8 text-[#94A3B8]" />
          Platform Configuration
        </h1>
        <p className="text-[#94A3B8]">Manage ML thresholds, visual preferences, and integrations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <GlassCard className="p-6">
           <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><Sliders className="w-4 h-4 text-[#A855F7]"/> Risk Thresholds</h3>
           <div className="space-y-4">
             <div>
               <label className="text-xs text-[#94A3B8] block mb-1">Critical Anomaly Cutoff</label>
               <input type="range" min="0" max="100" defaultValue="72" className="w-full accent-[#A855F7]" />
               <div className="text-right text-[10px] font-mono text-white mt-1">0.72</div>
             </div>
             <div>
               <label className="text-xs text-[#94A3B8] block mb-1">Monitoring Anomaly Cutoff</label>
               <input type="range" min="0" max="100" defaultValue="50" className="w-full accent-[#3B82F6]" />
               <div className="text-right text-[10px] font-mono text-white mt-1">0.50</div>
             </div>
           </div>
        </GlassCard>

        <GlassCard className="p-6">
           <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><HardDrive className="w-4 h-4 text-[#00F5FF]"/> Graph Engine</h3>
           <div className="space-y-4">
             <div className="flex items-center justify-between">
               <label className="text-xs text-[#94A3B8]">Max Render Nodes</label>
               <span className="text-xs font-mono text-white">5,000</span>
             </div>
             <div className="flex items-center justify-between">
               <label className="text-xs text-[#94A3B8]">Physics Iterations</label>
               <span className="text-xs font-mono text-white">50</span>
             </div>
             <div className="flex items-center justify-between">
               <label className="text-xs text-[#94A3B8]">Auto-collapse Degrees</label>
               <span className="text-xs font-mono text-white">&gt; 3</span>
             </div>
           </div>
        </GlassCard>

        <GlassCard className="p-6">
           <h3 className="text-white font-bold text-sm mb-4 flex items-center gap-2"><Bell className="w-4 h-4 text-[#F43F5E]"/> Notifications</h3>
           <div className="space-y-4">
             <div className="flex items-center justify-between">
               <label className="text-xs text-[#94A3B8]">Critical Alert Sound</label>
               <input type="checkbox" defaultChecked className="accent-[#F43F5E]" />
             </div>
             <div className="flex items-center justify-between">
               <label className="text-xs text-[#94A3B8]">Webhooks (Kafka)</label>
               <span className="text-[10px] px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30">ACTIVE</span>
             </div>
           </div>
        </GlassCard>
      </div>
    </div>
  );
}
