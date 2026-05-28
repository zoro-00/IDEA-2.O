"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, FileText, Share2, CornerDownRight } from "lucide-react";
import { useInvestigationStore } from "@/store/useInvestigationStore";
import { GlassCard } from "@/components/ui/GlassCard";
import { TerminalText } from "@/components/ui/TerminalText";
import { FADE_IN, FADE_UP } from "@/animations/variants";

export function AICopilot() {
  const { messages, isTyping, simulateAIResponse } = useInvestigationStore();
  const [input, setInput] = useState("");
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;
    simulateAIResponse(input);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#020617]/50 border border-white/5 rounded-2xl overflow-hidden relative">
      {/* Background ambient */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-[#A855F7]/10 to-transparent pointer-events-none" />
      
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-white/5 bg-[#030712]/80 backdrop-blur z-10">
        <div className="w-8 h-8 rounded-full bg-[#A855F7]/20 flex items-center justify-center border border-[#A855F7]/30">
          <Bot className="w-4 h-4 text-[#A855F7]" />
        </div>
        <div>
          <h3 className="font-bold text-[#E2E8F0]">STAR Copilot</h3>
          <p className="text-[10px] text-[#94A3B8] font-mono">GNN + LLM Investigation Agent</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]"></span>
          </span>
          <span className="text-[10px] text-[#10B981] font-mono tracking-widest">ONLINE</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide z-10">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              variants={FADE_UP}
              initial="hidden"
              animate="visible"
              className={`flex gap-4 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div className="flex-shrink-0 mt-1">
                {msg.role === "assistant" ? (
                  <div className="w-8 h-8 rounded bg-[#A855F7]/10 flex items-center justify-center border border-[#A855F7]/30 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                    <Bot className="w-4 h-4 text-[#A855F7]" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded bg-[#3B82F6]/10 flex items-center justify-center border border-[#3B82F6]/30">
                    <User className="w-4 h-4 text-[#3B82F6]" />
                  </div>
                )}
              </div>

              {/* Content Bubble */}
              <div className="space-y-2">
                <div className={`flex items-center gap-2 text-[10px] font-mono ${msg.role === "user" ? "flex-row-reverse text-[#3B82F6]" : "text-[#A855F7]"}`}>
                  <span>{msg.role === "assistant" ? "AGENT" : "INVESTIGATOR"}</span>
                  <span className="text-[#475569]">{msg.timestamp}</span>
                </div>
                
                <div className={`p-4 rounded-xl text-sm leading-relaxed ${
                  msg.role === "user" 
                    ? "bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#E2E8F0] rounded-tr-sm" 
                    : "bg-[#A855F7]/5 border border-[#A855F7]/20 text-[#E2E8F0] rounded-tl-sm glass-card"
                }`}>
                  {/* Markdown-ish rendering for the mock text */}
                  {msg.content.split('\n').map((line, i) => (
                    <p key={i} className={`mb-2 last:mb-0 ${line.startsWith('`') ? 'font-mono text-xs text-[#00F5FF]' : ''}`}>
                      {line.replace(/`/g, '').replace(/\*\*/g, '')}
                    </p>
                  ))}
                </div>

                {/* Metadata Attachments (Cypher, Graph) */}
                {msg.metadata && msg.metadata.cypherQuery && (
                  <div className="mt-2 p-3 bg-[#030712] border border-white/5 rounded-lg border-l-2 border-l-[#00F5FF]">
                    <div className="flex items-center gap-2 mb-2 text-[#94A3B8]">
                      <TerminalText className="text-[10px]">EXECUTED_CYPHER_QUERY</TerminalText>
                    </div>
                    <code className="text-xs font-mono text-[#E2E8F0] break-all">
                      {msg.metadata.cypherQuery}
                    </code>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Typing Indicator */}
        {isTyping && (
          <motion.div variants={FADE_IN} initial="hidden" animate="visible" className="flex gap-4 max-w-[85%]">
            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 rounded bg-[#A855F7]/10 flex items-center justify-center border border-[#A855F7]/30">
                <Bot className="w-4 h-4 text-[#A855F7]" />
              </div>
            </div>
            <div className="p-4 rounded-xl bg-[#A855F7]/5 border border-[#A855F7]/20 rounded-tl-sm flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-bounce" style={{ animationDelay: "300ms" }} />
              <span className="ml-2 text-xs font-mono text-[#A855F7]">PROCESSING GRAPH...</span>
            </div>
          </motion.div>
        )}
        <div ref={endOfMessagesRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#030712]/80 backdrop-blur border-t border-white/5 z-10">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isTyping}
            placeholder={isTyping ? "Agent is analyzing..." : "Ask the copilot to investigate an entity or pattern..."}
            className="w-full bg-[#0F172A] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#A855F7]/50 focus:ring-1 focus:ring-[#A855F7]/50 transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-2 top-2 p-1.5 bg-[#A855F7]/20 text-[#A855F7] rounded-lg hover:bg-[#A855F7]/30 transition-colors disabled:opacity-50 disabled:hover:bg-[#A855F7]/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <button onClick={() => setInput("Show suspicious paths involving account ACC-4521")} className="whitespace-nowrap px-3 py-1.5 rounded bg-white/5 border border-white/5 text-[10px] text-[#94A3B8] font-mono hover:bg-white/10 hover:text-white transition-colors">
            "Show suspicious paths for ACC-4521"
          </button>
          <button onClick={() => setInput("Generate SAR for entity X")} className="whitespace-nowrap px-3 py-1.5 rounded bg-white/5 border border-white/5 text-[10px] text-[#94A3B8] font-mono hover:bg-white/10 hover:text-white transition-colors">
            "Generate SAR draft"
          </button>
        </div>
      </div>
    </div>
  );
}
