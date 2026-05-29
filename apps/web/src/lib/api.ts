// ============================================================
// STAR — Backend API Client
// Typed client for all STAR backend endpoints
// ============================================================

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Generic fetch helper ───────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${path} failed [${res.status}]: ${err}`);
  }

  return res.json() as Promise<T>;
}

// ── Types ─────────────────────────────────────────────────────

export interface SystemHealth {
  overall: "healthy" | "degraded" | "unhealthy";
  services: {
    name: string;
    status: "online" | "degraded" | "offline";
    latency_ms: number | null;
    details: string | null;
  }[];
  uptime_seconds: number;
  version: string;
}

export interface FusedRiskResponse {
  account_id: string | null;
  final_score: number;
  risk_level: string;
  breakdown: Record<string, number>;
  top_signals: string[];
  explanation: string;
  alert_generated: boolean;
  alert_id: string | null;
  if_score: {
    account_id: string;
    raw_score: number;
    risk_score: number;
    risk_level: string;
    threshold: number;
    is_anomalous: boolean;
    top_features: {
      feature: string;
      label: string;
      value: number;
      normalized_score: number;
      risk_level: string;
      description: string;
    }[];
    inference_ms: number;
  } | null;
  tgnn_score: {
    fraud_probability: number;
    fraud_score: number;
    risk_level: string;
    is_suspicious: boolean;
    attention_layers: number;
    edge_scores: number[];
    inference_ms: number;
  } | null;
  rule_hits: {
    rule: string;
    severity: string;
    description: string;
    score_contribution: number;
    evidence: Record<string, unknown>;
  }[];
  total_inference_ms: number;
}

export interface GraphData {
  nodes: {
    id: string;
    name: string;
    risk: number;
    anomaly_score: number;
    risk_level: string;
    community: number;
    type: string;
    flagged: boolean;
    x?: number;
    y?: number;
    size?: number;
  }[];
  links: {
    source: string;
    target: string;
    amount: number;
    suspicious: boolean;
    type: string;
    weight: number;
    fraud_probability?: number;
  }[];
  total_nodes: number;
  total_edges: number;
  suspicious_edges: number;
}

export interface AlertData {
  id: string;
  type: string;
  severity: string;
  score: number;
  entities: string[];
  entity_count: number;
  amount: string;
  amount_raw: number;
  time: string;
  timestamp: number;
  description: string;
  status: string;
  assignee?: string;
  tags: string[];
  related_transactions: string[];
  graph_path?: string[];
  if_score?: number;
  tgnn_score?: number;
  rule_hits: string[];
}

export interface ModelInfo {
  isolation_forest: Record<string, unknown>;
  tgnn: Record<string, unknown>;
}

// ── API Methods ────────────────────────────────────────────────

export const starApi = {
  // System
  getHealth: () => apiFetch<SystemHealth>("/system/health"),
  getMetrics: () => apiFetch<Record<string, unknown>>("/system/metrics"),
  getModelInfo: () => apiFetch<ModelInfo>("/system/models"),

  // Scoring
  scoreTransaction: (body: {
    transaction: {
      id: string;
      from_account: string;
      to_account: string;
      amount: number;
      currency?: string;
      payment_format?: string;
      timestamp?: number;
    };
    context_transactions?: unknown[];
  }) =>
    apiFetch<FusedRiskResponse>("/score/transaction", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  scoreAccount: (accountId: string, features: Record<string, number>) =>
    apiFetch<FusedRiskResponse>("/score/account", {
      method: "POST",
      body: JSON.stringify({ account_id: accountId, features }),
    }),

  // Alerts
  getAlerts: (params?: { status?: string; severity?: string; limit?: number }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return apiFetch<AlertData[]>(`/alerts${qs ? `?${qs}` : ""}`);
  },

  getAlert: (id: string) => apiFetch<AlertData>(`/alerts/${id}`),

  updateAlert: (id: string, status: string, assignee?: string) =>
    apiFetch<AlertData>(`/alerts/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status, assignee }),
    }),

  getAlertStats: () => apiFetch<Record<string, unknown>>("/alerts/stats/summary"),

  // Graph
  getSubgraph: (accountId: string, depth = 2) =>
    apiFetch<GraphData>(`/graph/subgraph?account_id=${accountId}&depth=${depth}`),

  getFullGraph: () => apiFetch<GraphData>("/graph/full"),

  tracePath: (fromId: string, toId: string) =>
    apiFetch<{
      nodes: string[];
      total_amount: number;
      hops: number;
      is_circular: boolean;
    }>(`/graph/path?from_id=${fromId}&to_id=${toId}`),

  getCommunities: () => apiFetch<Record<string, unknown>>("/graph/communities"),
  getGraphStats: () => apiFetch<Record<string, unknown>>("/graph/stats"),

  // Copilot
  copilotQuery: async (message: string, sessionId = "default", context?: Record<string, unknown>) => {
    const res = await fetch(`${BASE_URL}/copilot/query/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, session_id: sessionId, context }),
    });
    if (!res.ok) throw new Error("Copilot query failed");
    return res.json() as Promise<{ id: string; role: string; content: string; timestamp: string }>;
  },

  copilotStatus: () => apiFetch<{ available: boolean; message: string }>("/copilot/status"),

  generateSAR: (body: { account_id: string; alert_ids: string[]; investigation_notes?: string }) =>
    apiFetch<Record<string, unknown>>("/copilot/sar", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};

// ── WebSocket Helper ───────────────────────────────────────────

export function createSTARWebSocket(
  onMessage: (data: unknown) => void,
  onConnected?: () => void,
  onDisconnected?: () => void,
): WebSocket {
  const wsUrl = BASE_URL.replace("http://", "ws://").replace("https://", "wss://");
  const ws = new WebSocket(`${wsUrl}/ws/stream`);

  ws.onopen = () => {
    console.log("[STAR WS] Connected to real-time stream");
    onConnected?.();
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (e) {
      console.warn("[STAR WS] Failed to parse message", e);
    }
  };

  ws.onclose = () => {
    console.log("[STAR WS] Disconnected");
    onDisconnected?.();
  };

  ws.onerror = (err) => {
    console.error("[STAR WS] Error", err);
  };

  return ws;
}
