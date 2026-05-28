"use client";

import { AICopilot } from "@/features/investigation/AICopilot";
import { GlassCard } from "@/components/ui/GlassCard";
import { Bot, FileText, CheckCircle2, ShieldCheck } from "lucide-react";
import { useInvestigationStore } from "@/store/useInvestigationStore";
import { motion, AnimatePresence } from "framer-motion";

export default function CopilotPage() {
  const { activeSarDraft, isGeneratingSar } = useInvestigationStore();

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto h-[calc(100vh-64px)] flex flex-col">
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            <Bot className="w-8 h-8 text-[#A855F7]" />
            AI Investigation Copilot
          </h1>
          <p className="text-[#94A3B8]">Natural Language to Cypher and automated SAR generation.</p>
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Chat Interface */}
        <div className="col-span-1 lg:col-span-8 flex flex-col">
          <AICopilot />
        </div>

        {/* Right: SAR Generation Workspace */}
        <div className="col-span-1 lg:col-span-4 flex flex-col gap-6">
          <GlassCard className="flex-1 p-6 relative overflow-hidden group flex flex-col border-t-2 border-t-[#10B981]">
            <div className="flex items-center gap-3 mb-6 relative z-10">
              <div className="p-2 bg-[#10B981]/10 rounded border border-[#10B981]/20">
                <FileText className="w-4 h-4 text-[#10B981]" />
              </div>
              <h3 className="text-white font-bold">Auto-SAR Workspace</h3>
            </div>

            <div className="relative flex-1 min-h-0">
              <AnimatePresence mode="wait">
                {isGeneratingSar ? (
                  <motion.div
                    key="generating"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center"
                  >
                    <div className="w-12 h-12 relative mb-4">
                      <div className="absolute inset-0 border-2 border-[#A855F7]/20 rounded-full" />
                      <div className="absolute inset-0 border-2 border-[#A855F7] rounded-full border-t-transparent animate-spin" />
                      <Bot className="absolute inset-0 m-auto w-5 h-5 text-[#A855F7] animate-pulse" />
                    </div>
                    <h4 className="text-[#E2E8F0] font-bold mb-2">Synthesizing Report</h4>
                    <p className="text-[#94A3B8] text-sm font-mono max-w-[250px]">
                      Compiling graph trajectories, ML scores, and transaction history...
                    </p>
                  </motion.div>
                ) : activeSarDraft ? (
                  <motion.div
                    key="draft"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute inset-0 flex flex-col"
                  >
                    <div className="flex items-center gap-2 mb-4 text-[#10B981] text-xs font-mono bg-[#10B981]/10 px-3 py-1.5 rounded w-fit border border-[#10B981]/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      DRAFT GENERATED
                    </div>
                    <div className="bg-[#030712] border border-white/10 rounded-lg p-4 flex-1 overflow-y-auto scrollbar-hide text-sm">
                      <div className="font-mono text-[#00F5FF] mb-3 text-xs">
                        REPORT_ID: {activeSarDraft.id}<br/>
                        TIMESTAMP: {activeSarDraft.createdAt}
                      </div>
                      <h4 className="font-bold text-white mb-2">{activeSarDraft.subject}</h4>
                      <div className="space-y-4 text-[#94A3B8] leading-relaxed">
                        {activeSarDraft.narrative.split('\n\n').map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button className="flex-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-lg py-2.5 text-sm font-medium transition-colors">
                        Edit Draft
                      </button>
                      <button className="flex-1 bg-[#A855F7]/20 hover:bg-[#A855F7]/30 text-[#A855F7] border border-[#A855F7]/30 rounded-lg py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4" />
                        File to FinCEN
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-50"
                  >
                    <FileText className="w-12 h-12 text-[#475569] mb-4" />
                    <p className="text-[#94A3B8] text-sm px-4">
                      Ask the Copilot to generate a SAR draft based on the current investigation context.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
