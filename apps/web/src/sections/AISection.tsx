"use client";

import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { MessageSquare, Send, Sparkles, Code, User } from "lucide-react";
import { AI_INVESTIGATION_MESSAGES } from "@/lib/constants";

function TypingEffect({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 8);
    return () => clearInterval(interval);
  }, [started, text]);

  return <span>{displayed}</span>;
}

function ChatMessage({
  role,
  content,
  delay,
}: {
  role: "user" | "assistant";
  content: string;
  delay: number;
}) {
  const isUser = role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      viewport={{ once: true }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
          isUser
            ? "bg-[#3B82F6]/20"
            : "bg-gradient-to-br from-[#A855F7]/20 to-[#00F5FF]/20"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-[#3B82F6]" />
        ) : (
          <Sparkles className="w-4 h-4 text-[#A855F7]" />
        )}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[#3B82F6]/10 border border-[#3B82F6]/20"
            : "glass"
        }`}
      >
        <div className="text-sm text-[#E2E8F0] whitespace-pre-wrap leading-relaxed">
          {content.split("\n").map((line, i) => {
            // Handle code blocks
            if (line.startsWith("```")) {
              return null;
            }
            // Bold text
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
              <div key={i} className={line.startsWith("-") || line.startsWith("▪") ? "ml-4" : ""}>
                {parts.map((part, j) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return (
                      <span key={j} className="font-semibold text-white">
                        {part.slice(2, -2)}
                      </span>
                    );
                  }
                  // Inline code
                  if (part.includes("`")) {
                    const codeParts = part.split(/(`[^`]+`)/g);
                    return codeParts.map((cp, k) => {
                      if (cp.startsWith("`") && cp.endsWith("`")) {
                        return (
                          <code
                            key={k}
                            className="px-1.5 py-0.5 rounded bg-[#A855F7]/10 text-[#A855F7] font-mono text-xs"
                          >
                            {cp.slice(1, -1)}
                          </code>
                        );
                      }
                      return <span key={k}>{cp}</span>;
                    });
                  }
                  return <span key={j}>{part}</span>;
                })}
              </div>
            );
          })}
          {/* Render code block if present */}
          {content.includes("```cypher") && (
            <div className="mt-3 rounded-xl bg-[#0F172A] border border-white/5 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5">
                <Code className="w-3 h-3 text-[#00F5FF]" />
                <span className="text-[10px] font-mono text-[#94A3B8]">CYPHER</span>
              </div>
              <pre className="p-4 text-xs font-mono text-[#06B6D4] overflow-x-auto">
                {content.match(/```cypher\n([\s\S]*?)```/)?.[1] || ""}
              </pre>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SARPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="glass rounded-2xl p-6 h-full"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#FFD166]" />
          <span className="text-xs font-mono text-[#FFD166] tracking-wider">
            AUTO-GENERATED SAR
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#94A3B8]">DRAFT</span>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <div className="text-[10px] font-mono text-[#94A3B8] mb-1">SUBJECT</div>
          <div className="text-white font-medium">
            J. Morrison (ACC-4521) — Circular Transaction Ring
          </div>
        </div>

        <div>
          <div className="text-[10px] font-mono text-[#94A3B8] mb-1">
            SUSPICIOUS ACTIVITY NARRATIVE
          </div>
          <div className="text-[#E2E8F0] text-xs leading-relaxed glass rounded-xl p-3">
            Between March 15-17, 2024, Account ACC-4521 (J. Morrison) participated
            in a circular transaction pattern involving four accounts. Total funds
            moved: $487,200 across 23 wire transfers. The pattern shows characteristics
            consistent with round-tripping and layering:
            <br /><br />
            1. ACC-4521 → ACC-7833 ($9,500 × 6 transfers — below CTR threshold)
            <br />
            2. ACC-7833 → ACC-9877 ($47,000 — single wire)
            <br />
            3. ACC-9877 → ACC-5590 ($45,500 — international wire)
            <br />
            4. ACC-5590 → ACC-4521 ($44,000 — completing the cycle)
            <br /><br />
            Account ACC-4521 was dormant for 11 months prior to reactivation.
            Community detection (Louvain) identified all four accounts in the same
            transaction cluster. GraphSAGE classification: P(suspicious) = 0.91.
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-[#FF3B3B]/10 text-[#FF3B3B] text-xs font-mono">
            Risk: 87/100
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#A855F7]/10 text-[#A855F7] text-xs font-mono">
            GNN: 0.91
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-[#FFD166]/10 text-[#FFD166] text-xs font-mono">
            4 Entities
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function AISection() {
  return (
    <section id="ai-copilot" className="relative py-32 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#030712] to-[#020617]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-3 h-3 text-[#A855F7]" />
            <span className="text-xs font-mono text-[#A855F7] tracking-wider">
              AI INVESTIGATION COPILOT
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
            <span className="text-white">Investigate with </span>
            <span className="gradient-text">Intelligence</span>
          </h2>
          <p className="text-lg text-[#94A3B8] max-w-2xl mx-auto">
            Natural language investigation. Ask questions, generate Cypher queries,
            and auto-generate regulatory-ready SAR narratives — all powered by AI
            with full graph context.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Chat Interface */}
          <div className="glass rounded-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#00F5FF]" />
                <span className="text-xs font-mono text-[#00F5FF] tracking-wider">
                  AI ASSISTANT
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#06D6A0]" />
                <span className="text-[10px] font-mono text-[#94A3B8]">ONLINE</span>
              </div>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {AI_INVESTIGATION_MESSAGES.map((msg, i) => (
                <ChatMessage
                  key={i}
                  role={msg.role}
                  content={msg.content}
                  delay={i * 0.3}
                />
              ))}
            </div>

            {/* Input */}
            <div className="mt-4 flex items-center gap-2 glass rounded-xl p-2">
              <input
                type="text"
                placeholder="Ask about any entity, pattern, or risk..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-[#94A3B8]/50 px-3 py-2 outline-none font-mono"
                readOnly
              />
              <button className="p-2 rounded-lg bg-gradient-to-r from-[#A855F7] to-[#3B82F6] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-shadow">
                <Send className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* SAR Preview */}
          <SARPreview />
        </div>
      </div>
    </section>
  );
}
