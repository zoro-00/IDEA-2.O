"use client";

import { Search, Bell, Activity, ShieldCheck, User } from "lucide-react";
import { PulsingDot } from "@/components/ui/TerminalText";
import { useAMLStore } from "@/store/useAMLStore";

export function TopNav() {
  const { isStreaming } = useAMLStore();

  return (
    <header className="h-16 sticky top-0 bg-[#030712]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 z-40">
      
      {/* Left: Global Search */}
      <div className="flex-1 max-w-md relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-[#475569]" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-white/5 rounded-lg bg-[#0F172A]/50 text-sm text-[#E2E8F0] placeholder-[#475569] focus:outline-none focus:ring-1 focus:ring-[#00F5FF]/50 focus:border-[#00F5FF]/50 transition-all"
          placeholder="Search entities, accounts, or alert IDs... (⌘K)"
        />
      </div>

      {/* Right: Status & Profile */}
      <div className="flex items-center gap-6">
        
        {/* ML Pipeline Status */}
        <div className="hidden md:flex items-center gap-4 border-r border-white/5 pr-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#A855F7]" />
            <span className="text-[10px] font-mono text-[#94A3B8] uppercase">IF-300 Engine</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#3B82F6]" />
            <span className="text-[10px] font-mono text-[#94A3B8] uppercase">GraphSAGE</span>
          </div>
        </div>

        {/* WebSocket Stream Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
          <PulsingDot color={isStreaming ? "#10B981" : "#F59E0B"} size={1.5} />
          <span className={`text-[10px] font-mono font-bold tracking-widest ${isStreaming ? "text-[#10B981]" : "text-[#F59E0B]"}`}>
            {isStreaming ? "LIVE STREAM" : "PAUSED"}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="p-2 text-[#94A3B8] hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#F43F5E] rounded-full border border-[#030712]" />
          </button>
          
          <button className="flex items-center gap-2 p-1.5 pr-3 bg-white/5 border border-white/5 rounded-full hover:bg-white/10 transition-colors">
            <div className="w-6 h-6 rounded-full bg-[#00F5FF]/20 flex items-center justify-center border border-[#00F5FF]/30">
              <User className="w-3 h-3 text-[#00F5FF]" />
            </div>
            <span className="text-xs font-medium text-[#E2E8F0]">Analyst_04</span>
          </button>
        </div>
      </div>
    </header>
  );
}
