// ============================================================
// STAR Platform — Complete TypeScript Type System
// ============================================================

// ─── Risk Level ──────────────────────────────────────────────
export type RiskLevel = "normal" | "monitoring" | "moderate" | "high" | "critical";
export type Severity = "low" | "medium" | "high" | "critical";

export function getRiskLevel(score: number): RiskLevel {
  if (score < 0.5) return "normal";
  if (score < 0.58) return "monitoring";
  if (score < 0.65) return "moderate";
  if (score < 0.72) return "high";
  return "critical";
}

export const RISK_COLORS: Record<RiskLevel, string> = {
  normal: "#10B981",
  monitoring: "#3B82F6",
  moderate: "#FACC15",
  high: "#F97316",
  critical: "#F43F5E",
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  normal: "Normal",
  monitoring: "Monitoring",
  moderate: "Moderate Risk",
  high: "High Risk",
  critical: "Critical",
};

// ─── Transactions ─────────────────────────────────────────────
export interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  currency: string;
  timestamp: string;
  type: TransactionType;
  channel: string;
  risk: Severity;
  anomalyScore: number;
  flags: string[];
  jurisdiction: string;
  reference?: string;
}

export type TransactionType =
  | "wire"
  | "international_wire"
  | "ach"
  | "cash"
  | "crypto"
  | "swift"
  | "rtgs";

// ─── Accounts ────────────────────────────────────────────────
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  jurisdiction: string;
  openDate: string;
  riskScore: number;
  anomalyScore: number;
  riskLevel: RiskLevel;
  community: number;
  features: AMLFeatures;
  flagged: boolean;
  sarFiled: boolean;
  dormantDays?: number;
  tags: string[];
}

export type AccountType =
  | "personal"
  | "business"
  | "shell"
  | "offshore"
  | "crypto_exchange"
  | "money_service";

// ─── AML Features (Isolation Forest inputs) ──────────────────
export interface AMLFeatures {
  txn_count: number;
  avg_amount: number;
  structuring_ratio: number;
  fan_out_ratio: number;
  pagerank: number;
  out_degree: number;
  txn_velocity: number;
  night_ratio: number;
  cross_bank_ratio: number;
  dormancy_days: number;
  burst_score: number;
  layering_depth: number;
  circular_flag: number;
  geo_entropy: number;
  counterparty_diversity: number;
  amount_variance: number;
  hour_entropy: number;
  weekend_ratio: number;
  rapid_succession: number;
  mule_score: number;
  shell_indicator: number;
  smurfing_flag: number;
  reactivation_score: number;
  community_centrality: number;
  betweenness: number;
  closeness: number;
  clustering_coeff: number;
  graph_anomaly_score: number;
  unique_receivers: number;
}

// ─── Alerts ──────────────────────────────────────────────────
export interface AMLAlert {
  id: string;
  type: AlertType;
  severity: Severity;
  score: number;
  entities: string[];
  entityCount: number;
  amount: string;
  amountRaw: number;
  time: string;
  timestamp: number;
  description: string;
  status: AlertStatus;
  assignee?: string;
  tags: string[];
  relatedTransactions: string[];
  graphPath?: string[];
}

export type AlertType =
  | "circular_transaction"
  | "structuring"
  | "rapid_layering"
  | "mule_network"
  | "dormant_reactivation"
  | "high_velocity"
  | "cross_border_anomaly"
  | "smurfing"
  | "round_tripping"
  | "shell_company"
  | "gnn_flagged";

export type AlertStatus = "open" | "investigating" | "escalated" | "closed" | "sar_filed";

// ─── Graph ───────────────────────────────────────────────────
export interface GraphNode {
  id: string;
  name: string;
  risk: number;
  anomalyScore: number;
  riskLevel: RiskLevel;
  community: number;
  x?: number;
  y?: number;
  size?: number;
  type: AccountType;
  flagged: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  amount: number;
  suspicious: boolean;
  type: TransactionType;
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphEdge[];
}

export interface TraversalPath {
  nodes: string[];
  totalAmount: number;
  hops: number;
  isCircular: boolean;
  riskScore: number;
}

// ─── Isolation Forest ────────────────────────────────────────
export interface IsolationScore {
  accountId: string;
  score: number;
  riskLevel: RiskLevel;
  treesIsolated: number;
  avgPathLength: number;
  topFeatures: FeatureContribution[];
  verdict: "isolated" | "anomaly" | "normal";
}

export interface FeatureContribution {
  feature: keyof AMLFeatures;
  label: string;
  value: number;
  normalizedScore: number;
  riskLevel: RiskLevel;
  description: string;
}

// ─── SAR ─────────────────────────────────────────────────────
export interface SARReport {
  id: string;
  subject: string;
  accountId: string;
  narrative: string;
  riskScore: number;
  gnnScore: number;
  entityCount: number;
  totalAmount: number;
  dateRange: string;
  pattern: string;
  status: "draft" | "review" | "submitted";
  createdAt: string;
}

// ─── AI Investigation ────────────────────────────────────────
export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  typing?: boolean;
  metadata?: {
    cypherQuery?: string;
    graphPath?: string[];
    sarDraft?: Partial<SARReport>;
    relatedEntities?: string[];
  };
}

export interface Investigation {
  id: string;
  title: string;
  status: "active" | "pending" | "closed";
  primaryEntity: string;
  riskScore: number;
  messages: AIMessage[];
  createdAt: string;
}

// ─── Architecture ────────────────────────────────────────────
export interface ArchitectureLayer {
  name: string;
  tech: string;
  items: string[];
  color: string;
  icon?: string;
  description?: string;
}

// ─── Performance ─────────────────────────────────────────────
export interface PerformanceMetric {
  label: string;
  value: number;
  suffix: string;
  prefix: string;
  trend?: number;
  unit?: string;
}

// ─── UI State ────────────────────────────────────────────────
export interface UIPanel {
  id: string;
  title: string;
  isOpen: boolean;
  position?: { x: number; y: number };
}

export interface FilterState {
  riskLevel: RiskLevel | "all";
  alertType: AlertType | "all";
  dateRange: "1h" | "24h" | "7d" | "30d";
  search: string;
}
