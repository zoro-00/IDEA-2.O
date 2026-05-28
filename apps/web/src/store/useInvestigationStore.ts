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

    // 2. Simulate processing delay
    setTyping(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // 3. Check for specific commands (SAR generation simulation)
    const lowerMsg = userMessage.toLowerCase();
    let aiContent = "I've analyzed the graph data. Let me know if you want me to generate a SAR draft or expand the search radius.";
    let metadata = {};

    if (lowerMsg.includes("sar") || lowerMsg.includes("report")) {
      aiContent = "I have drafted the Suspicious Activity Report (SAR) for the ACC-4521 circular transaction ring based on the Isolation Forest and GraphSAGE findings. Review the draft attached below.";
      setGeneratingSar(true);
      setTimeout(() => {
        setGeneratingSar(false);
        setActiveSar(MOCK_SAR);
      }, 2000);
    } else if (lowerMsg.includes("path") || lowerMsg.includes("hop")) {
      aiContent = "I've run a graph traversal query. The path connects ACC-4521 to ACC-7833 via 3 intermediate shell companies. Total volume: $1.2M.";
      metadata = {
        cypherQuery: "MATCH p=(a:Account)-[:TRANSFERRED*1..3]->(b:Account) WHERE a.id='ACC-4521' RETURN p",
        graphPath: ["ACC-4521", "ACC-7833"],
      };
    }

    // 4. Add AI response
    const aiMsg: AIMessage = {
      id: `msg-${Date.now() + 1}`,
      role: "assistant",
      content: aiContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      metadata,
    };

    setTyping(false);
    addMessage(aiMsg);
  },
}));
