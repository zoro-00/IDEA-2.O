"use client";

import { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { AICopilot } from "@/features/investigation/AICopilot";
import { useInvestigationStore } from "@/store/useInvestigationStore";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { FADE_IN, FADE_UP, STAGGER_CONTAINER, STAGGER_ITEM_UP } from "@/animations/variants";
import { Bot, FileText, CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";

export default function AISection() {
  const { activeSarDraft, isGeneratingSar } = useInvestigationStore();
  const { ref, isInView } = useScrollReveal();

  return (
    <section id="ai-copilot" className="relative py-32 bg-[#020617] border-t border-white/5 overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#A855F7] rounded-full blur-[150px] opacity-10 pointer-events-none" />
      <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-[#3B82F6] rounded-full blur-[120px] opacity-10 pointer-events-none" />

      <div className="container mx-auto px-6 lg:px-12 relative z-10" ref={ref}>
        <SectionHeader
          badgeIcon={Bot}
          badgeText="INVESTIGATION COPILOT"
          badgeColor="#A855F7"
          title1="Conversational"
          title2="Intelligence."
          description="Investigate complex networks, translate natural language to Cypher graph queries, and automatically generate Suspicious Activity Reports (SAR) in seconds."
        />

        <motion.div
          variants={STAGGER_CONTAINER}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-16"
        >
          {/* Left Column: AI Copilot Chat */}
          <motion.div variants={STAGGER_ITEM_UP} className="lg:col-span-7 h-[700px]">
            <AICopilot />
          </motion.div>

          {/* Right Column: SAR Generation & Workspace */}
          <motion.div variants={STAGGER_ITEM_UP} className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Context Panel */}
            <GlassCard intensity="light" className="p-6 border-white/5 border-l-2 border-l-[#A855F7]">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-[#A855F7]/10 rounded border border-[#A855F7]/20">
                  <AlertTriangle className="w-4 h-4 text-[#A855F7]" />
                </div>
                <h3 className="text-white font-bold">Active Context</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#94A3B8]">Primary Entity:</span>
                  <span className="font-mono text-[#00F5FF]">ACC-4521</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#94A3B8]">Pattern:</span>
                  <span className="text-white">Circular Laundering</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#94A3B8]">Graph Hops:</span>
                  <span className="text-white">4 Degrees</span>
                </div>
                <div className="w-full h-px bg-white/5 my-2" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[#94A3B8]">ML Risk Score:</span>
                  <span className="font-mono font-bold text-[#F43F5E]">94/100 (CRITICAL)</span>
                </div>
              </div>
            </GlassCard>

            {/* SAR Generator Panel */}
            <GlassCard intensity="cyber" className="flex-1 p-6 relative overflow-hidden group">
              {/* Animated scanline */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#A855F7]/10 to-transparent h-1/3 -translate-y-full group-hover:animate-scanline opacity-0 group-hover:opacity-100 pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className="p-2 bg-[#10B981]/10 rounded border border-[#10B981]/20">
                  <FileText className="w-4 h-4 text-[#10B981]" />
                </div>
                <h3 className="text-white font-bold">Auto-SAR Generator</h3>
              </div>

              <div className="relative h-full min-h-[300px]">
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
                      <p className="text-[#94A3B8] text-sm">
                        Ask the Copilot to generate a SAR draft based on the current investigation context.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
            
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
