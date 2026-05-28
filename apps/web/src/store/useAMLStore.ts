// ============================================================
// STAR — Zustand AML Store
// Real-time AML state management
// ============================================================
import { create } from "zustand";
import type { AMLAlert, Transaction, GraphNode, GraphEdge, FilterState } from "@/types";
import { MOCK_ALERTS, MOCK_TRANSACTIONS, MOCK_GRAPH_NODES, MOCK_GRAPH_EDGES } from "@/data";

interface AMLState {
  // Live data
  alerts: AMLAlert[];
  transactions: Transaction[];
  graphNodes: GraphNode[];
  graphEdges: GraphEdge[];

  // Selected state
  selectedNodeId: string | null;
  selectedAlertId: string | null;
  selectedPath: string[];

  // Filters
  filters: FilterState;

  // Streaming state
  isStreaming: boolean;
  streamCount: number;

  // Actions
  setAlerts: (alerts: AMLAlert[]) => void;
  addAlert: (alert: AMLAlert) => void;
  addTransaction: (tx: Transaction) => void;
  selectNode: (id: string | null) => void;
  selectAlert: (id: string | null) => void;
  setSelectedPath: (path: string[]) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  toggleStreaming: () => void;
  incrementStreamCount: () => void;
  updateAlertStatus: (alertId: string, status: AMLAlert["status"]) => void;
}

export const useAMLStore = create<AMLState>((set) => ({
  alerts: MOCK_ALERTS,
  transactions: MOCK_TRANSACTIONS,
  graphNodes: MOCK_GRAPH_NODES,
  graphEdges: MOCK_GRAPH_EDGES,

  selectedNodeId: null,
  selectedAlertId: null,
  selectedPath: [],

  filters: {
    riskLevel: "all",
    alertType: "all",
    dateRange: "24h",
    search: "",
  },

  isStreaming: true,
  streamCount: 0,

  setAlerts: (alerts) => set({ alerts }),
  addAlert: (alert) => set((state) => ({
    alerts: [alert, ...state.alerts.slice(0, 19)],
  })),
  addTransaction: (tx) => set((state) => ({
    transactions: [tx, ...state.transactions.slice(0, 49)],
    streamCount: state.streamCount + 1,
  })),
  selectNode: (id) => set({ selectedNodeId: id }),
  selectAlert: (id) => set({ selectedAlertId: id }),
  setSelectedPath: (path) => set({ selectedPath: path }),
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
  })),
  toggleStreaming: () => set((state) => ({ isStreaming: !state.isStreaming })),
  incrementStreamCount: () => set((state) => ({ streamCount: state.streamCount + 1 })),
  updateAlertStatus: (alertId, status) => set((state) => ({
    alerts: state.alerts.map((a) => a.id === alertId ? { ...a, status } : a),
  })),
}));
