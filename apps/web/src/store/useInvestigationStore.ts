// ============================================================
// STAR — Investigation Store
// State management for AI Copilot and Case Management
// ============================================================
import { create } from "zustand";
import type { AIMessage, Investigation, SARReport } from "@/types";
import { AI_MESSAGES, MOCK_SAR } from "@/data";

interface InvestigationState {
  // Current Investigation
  activeInvestigationId: string | null;
  messages: AIMessage[];
  isTyping: boolean;

  // SAR Generation
  activeSarDraft: SARReport | null;
  isGeneratingSar: boolean;

  // Actions
  setActiveInvestigation: (id: string | null) => void;
  addMessage: (message: AIMessage) => void;
  setTyping: (isTyping: boolean) => void;
  setActiveSar: (sar: SARReport | null) => void;
  setGeneratingSar: (isGenerating: boolean) => void;

  // AI Simulator Action
  simulateAIResponse: (userMessage: string) => Promise<void>;
}

export const useInvestigationStore = create<InvestigationState>((set, get) => ({
  activeInvestigationId: "INV-2024-089",
  messages: AI_MESSAGES,
  isTyping: false,

  activeSarDraft: null,
  isGeneratingSar: false,

  setActiveInvestigation: (id) => set({ activeInvestigationId: id }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
  setTyping: (isTyping) => set({ isTyping }),
  setActiveSar: (sar) => set({ activeSarDraft: sar }),
  setGeneratingSar: (isGenerating) => set({ isGeneratingSar: isGenerating }),

  simulateAIResponse: async (userMessage) => {
    const { addMessage, setTyping, setActiveSar, setGeneratingSar } = get();

    // 1. Add User message
    const userMsg: AIMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    addMessage(userMsg);

    setTyping(true);

    try {
      // 2. Call real backend API
      const { starApi } = await import('@/lib/api');
      
      if (userMessage.toLowerCase().includes("sar") || userMessage.toLowerCase().includes("report")) {
        // Special case: SAR generation
        setGeneratingSar(true);
        const sarRes: any = await starApi.generateSAR({ account_id: "ACC-1001", alert_ids: [] });
        setGeneratingSar(false);
        
        setActiveSar({
          id: `SAR-${Date.now()}`,
          subject: sarRes.subject || "Auto-Generated SAR",
          accountId: sarRes.account_id || "ACC-1001",
          narrative: sarRes.narrative || "Report generated.",
          riskScore: sarRes.risk_score || 85,
          gnnScore: sarRes.gnn_score || 92,
          entityCount: sarRes.entity_count || 12,
          totalAmount: sarRes.total_amount || 0,
          dateRange: sarRes.date_range || "Last 30 Days",
          pattern: sarRes.pattern || "Suspicious Activity",
          status: "draft",
          createdAt: new Date().toLocaleTimeString()
        });
        
        const aiMsg: AIMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: "I have generated the Suspicious Activity Report (SAR). Please review the draft in the workspace.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        };
        addMessage(aiMsg);
      } else {
        // Regular chat query
        const res: any = await starApi.copilotQuery(userMessage);
        
        const aiMsg: AIMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: res.content || res.response || "Done.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          metadata: res.metadata?.cypherQuery ? { cypherQuery: res.metadata.cypherQuery } : undefined,
        };
        addMessage(aiMsg);
      }
    } catch (error) {
      console.error("Copilot error:", error);
      const errorMsg: AIMessage = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: "I encountered an error connecting to the intelligence engine.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
      addMessage(errorMsg);
      setGeneratingSar(false);
    } finally {
      setTyping(false);
    }
  },
}));
