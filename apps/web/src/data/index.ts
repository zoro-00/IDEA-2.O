// ============================================================
// STAR — Rich Mock AML Dataset
// ============================================================
import type {
  Transaction, Account, AMLAlert, GraphNode, GraphEdge,
  IsolationScore, FeatureContribution, SARReport, AIMessage,
  ArchitectureLayer, PerformanceMetric, TraversalPath,
} from "@/types";

// ─── Accounts ────────────────────────────────────────────────
export const MOCK_ACCOUNTS: Account[] = [
  {
    id: "ACC-4521", name: "J. Morrison", type: "personal",
    jurisdiction: "US-NV", openDate: "2022-03-10",
    riskScore: 87, anomalyScore: 0.94, riskLevel: "critical",
    community: 0, flagged: true, sarFiled: false,
    dormantDays: 11 * 30,
    tags: ["structuring", "circular", "dormant-reactivation"],
    features: {
      txn_count: 342, avg_amount: 9400, structuring_ratio: 0.91,
      fan_out_ratio: 0.84, pagerank: 0.88, out_degree: 23,
      txn_velocity: 0.89, night_ratio: 0.72, cross_bank_ratio: 0.76,
      dormancy_days: 330, burst_score: 0.88, layering_depth: 4,
      circular_flag: 1, geo_entropy: 0.3, counterparty_diversity: 0.72,
      amount_variance: 0.12, hour_entropy: 0.91, weekend_ratio: 0.08,
      rapid_succession: 0.87, mule_score: 0.82, shell_indicator: 0.4,
      smurfing_flag: 0.88, reactivation_score: 0.94, community_centrality: 0.81,
      betweenness: 0.77, closeness: 0.69, clustering_coeff: 0.43,
      graph_anomaly_score: 0.91, unique_receivers: 7,
    },
  },
  {
    id: "ACC-7833", name: "Oceanic Ltd", type: "shell",
    jurisdiction: "KY", openDate: "2021-09-15",
    riskScore: 92, anomalyScore: 0.91, riskLevel: "critical",
    community: 0, flagged: true, sarFiled: true,
    tags: ["shell-company", "circular", "offshore"],
    features: {
      txn_count: 156, avg_amount: 47000, structuring_ratio: 0.22,
      fan_out_ratio: 0.91, pagerank: 0.92, out_degree: 18,
      txn_velocity: 0.78, night_ratio: 0.43, cross_bank_ratio: 0.93,
      dormancy_days: 0, burst_score: 0.61, layering_depth: 3,
      circular_flag: 1, geo_entropy: 0.89, counterparty_diversity: 0.88,
      amount_variance: 0.67, hour_entropy: 0.77, weekend_ratio: 0.31,
      rapid_succession: 0.62, mule_score: 0.44, shell_indicator: 0.97,
      smurfing_flag: 0.15, reactivation_score: 0.21, community_centrality: 0.94,
      betweenness: 0.88, closeness: 0.84, clustering_coeff: 0.67,
      graph_anomaly_score: 0.88, unique_receivers: 12,
    },
  },
  {
    id: "ACC-9877", name: "Shell Corp A", type: "shell",
    jurisdiction: "PA", openDate: "2020-11-02",
    riskScore: 89, anomalyScore: 0.88, riskLevel: "critical",
    community: 0, flagged: true, sarFiled: false,
    tags: ["shell-company", "layering", "offshore"],
    features: {
      txn_count: 89, avg_amount: 45000, structuring_ratio: 0.34,
      fan_out_ratio: 0.76, pagerank: 0.84, out_degree: 14,
      txn_velocity: 0.71, night_ratio: 0.38, cross_bank_ratio: 0.87,
      dormancy_days: 5, burst_score: 0.55, layering_depth: 2,
      circular_flag: 1, geo_entropy: 0.92, counterparty_diversity: 0.81,
      amount_variance: 0.44, hour_entropy: 0.68, weekend_ratio: 0.26,
      rapid_succession: 0.55, mule_score: 0.38, shell_indicator: 0.91,
      smurfing_flag: 0.22, reactivation_score: 0.18, community_centrality: 0.78,
      betweenness: 0.72, closeness: 0.77, clustering_coeff: 0.59,
      graph_anomaly_score: 0.84, unique_receivers: 9,
    },
  },
  {
    id: "ACC-5590", name: "Golden Trade", type: "business",
    jurisdiction: "US-FL", openDate: "2023-01-20",
    riskScore: 78, anomalyScore: 0.81, riskLevel: "high",
    community: 0, flagged: true, sarFiled: false,
    tags: ["rapid-layering", "high-velocity"],
    features: {
      txn_count: 211, avg_amount: 44000, structuring_ratio: 0.67,
      fan_out_ratio: 0.79, pagerank: 0.76, out_degree: 21,
      txn_velocity: 0.82, night_ratio: 0.61, cross_bank_ratio: 0.68,
      dormancy_days: 0, burst_score: 0.71, layering_depth: 3,
      circular_flag: 1, geo_entropy: 0.55, counterparty_diversity: 0.77,
      amount_variance: 0.34, hour_entropy: 0.83, weekend_ratio: 0.17,
      rapid_succession: 0.79, mule_score: 0.66, shell_indicator: 0.28,
      smurfing_flag: 0.61, reactivation_score: 0.12, community_centrality: 0.69,
      betweenness: 0.63, closeness: 0.58, clustering_coeff: 0.41,
      graph_anomaly_score: 0.77, unique_receivers: 14,
    },
  },
  {
    id: "ACC-1204", name: "R. Chen", type: "personal",
    jurisdiction: "US-CA", openDate: "2019-06-11",
    riskScore: 45, anomalyScore: 0.47, riskLevel: "normal",
    community: 1, flagged: false, sarFiled: false,
    tags: [],
    features: {
      txn_count: 892, avg_amount: 3200, structuring_ratio: 0.04,
      fan_out_ratio: 0.22, pagerank: 0.34, out_degree: 8,
      txn_velocity: 0.21, night_ratio: 0.12, cross_bank_ratio: 0.28,
      dormancy_days: 0, burst_score: 0.09, layering_depth: 1,
      circular_flag: 0, geo_entropy: 0.31, counterparty_diversity: 0.44,
      amount_variance: 0.55, hour_entropy: 0.48, weekend_ratio: 0.38,
      rapid_succession: 0.11, mule_score: 0.07, shell_indicator: 0.02,
      smurfing_flag: 0.05, reactivation_score: 0.08, community_centrality: 0.22,
      betweenness: 0.18, closeness: 0.31, clustering_coeff: 0.72,
      graph_anomaly_score: 0.19, unique_receivers: 34,
    },
  },
  {
    id: "ACC-6612", name: "M. Santos", type: "personal",
    jurisdiction: "US-TX", openDate: "2020-02-14",
    riskScore: 23, anomalyScore: 0.31, riskLevel: "normal",
    community: 2, flagged: false, sarFiled: false,
    tags: [],
    features: {
      txn_count: 1243, avg_amount: 1100, structuring_ratio: 0.02,
      fan_out_ratio: 0.11, pagerank: 0.18, out_degree: 5,
      txn_velocity: 0.08, night_ratio: 0.09, cross_bank_ratio: 0.14,
      dormancy_days: 0, burst_score: 0.04, layering_depth: 1,
      circular_flag: 0, geo_entropy: 0.22, counterparty_diversity: 0.31,
      amount_variance: 0.41, hour_entropy: 0.38, weekend_ratio: 0.44,
      rapid_succession: 0.06, mule_score: 0.03, shell_indicator: 0.01,
      smurfing_flag: 0.02, reactivation_score: 0.04, community_centrality: 0.12,
      betweenness: 0.09, closeness: 0.21, clustering_coeff: 0.81,
      graph_anomaly_score: 0.11, unique_receivers: 56,
    },
  },
  {
    id: "ACC-1102", name: "D. Petrov", type: "personal",
    jurisdiction: "RU", openDate: "2021-07-03",
    riskScore: 71, anomalyScore: 0.74, riskLevel: "high",
    community: 0, flagged: true, sarFiled: false,
    tags: ["cross-border", "high-risk-jurisdiction"],
    features: {
      txn_count: 67, avg_amount: 32000, structuring_ratio: 0.45,
      fan_out_ratio: 0.68, pagerank: 0.71, out_degree: 12,
      txn_velocity: 0.66, night_ratio: 0.54, cross_bank_ratio: 0.88,
      dormancy_days: 45, burst_score: 0.58, layering_depth: 2,
      circular_flag: 0, geo_entropy: 0.87, counterparty_diversity: 0.62,
      amount_variance: 0.51, hour_entropy: 0.72, weekend_ratio: 0.21,
      rapid_succession: 0.61, mule_score: 0.51, shell_indicator: 0.34,
      smurfing_flag: 0.39, reactivation_score: 0.44, community_centrality: 0.58,
      betweenness: 0.52, closeness: 0.49, clustering_coeff: 0.38,
      graph_anomaly_score: 0.69, unique_receivers: 8,
    },
  },
  {
    id: "ACC-7744", name: "M. Al-Rashid", type: "business",
    jurisdiction: "AE", openDate: "2022-05-19",
    riskScore: 83, anomalyScore: 0.86, riskLevel: "critical",
    community: 0, flagged: true, sarFiled: false,
    tags: ["high-risk-jurisdiction", "rapid-layering"],
    features: {
      txn_count: 134, avg_amount: 28000, structuring_ratio: 0.58,
      fan_out_ratio: 0.82, pagerank: 0.79, out_degree: 17,
      txn_velocity: 0.76, night_ratio: 0.48, cross_bank_ratio: 0.91,
      dormancy_days: 12, burst_score: 0.74, layering_depth: 3,
      circular_flag: 0, geo_entropy: 0.78, counterparty_diversity: 0.81,
      amount_variance: 0.39, hour_entropy: 0.69, weekend_ratio: 0.19,
      rapid_succession: 0.73, mule_score: 0.59, shell_indicator: 0.61,
      smurfing_flag: 0.44, reactivation_score: 0.35, community_centrality: 0.76,
      betweenness: 0.68, closeness: 0.62, clustering_coeff: 0.44,
      graph_anomaly_score: 0.82, unique_receivers: 11,
    },
  },
];

// ─── Transactions ─────────────────────────────────────────────
export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "TXN-38291", from: "ACC-4521", to: "ACC-7833", amount: 9500,
    currency: "USD", timestamp: "14:32:07", type: "wire", channel: "SWIFT",
    risk: "high", anomalyScore: 0.88, jurisdiction: "US",
    flags: ["Below CTR threshold", "Structuring pattern"],
    reference: "REF-8829A",
  },
  {
    id: "TXN-38292", from: "ACC-1204", to: "ACC-9877", amount: 245000,
    currency: "USD", timestamp: "14:32:11", type: "international_wire", channel: "SWIFT",
    risk: "critical", anomalyScore: 0.94, jurisdiction: "PA",
    flags: ["High-risk jurisdiction", "Offshore destination"],
    reference: "REF-7741B",
  },
  {
    id: "TXN-38293", from: "ACC-6612", to: "ACC-3341", amount: 1200,
    currency: "USD", timestamp: "14:32:15", type: "ach", channel: "ACH",
    risk: "low", anomalyScore: 0.21, jurisdiction: "US",
    flags: [],
  },
  {
    id: "TXN-38294", from: "ACC-7833", to: "ACC-4521", amount: 9800,
    currency: "USD", timestamp: "14:32:18", type: "wire", channel: "FEDWIRE",
    risk: "critical", anomalyScore: 0.96, jurisdiction: "US",
    flags: ["Circular pattern", "Round-tripping detected"],
    reference: "REF-4412C",
  },
  {
    id: "TXN-38295", from: "ACC-2201", to: "ACC-5590", amount: 67800,
    currency: "USD", timestamp: "14:32:22", type: "wire", channel: "SWIFT",
    risk: "medium", anomalyScore: 0.67, jurisdiction: "US",
    flags: ["Velocity anomaly"],
  },
  {
    id: "TXN-38296", from: "ACC-9877", to: "ACC-1102", amount: 189000,
    currency: "USD", timestamp: "14:32:26", type: "international_wire", channel: "SWIFT",
    risk: "high", anomalyScore: 0.84, jurisdiction: "RU",
    flags: ["Rapid layering", "High-risk jurisdiction"],
    reference: "REF-9983D",
  },
  {
    id: "TXN-38297", from: "ACC-3341", to: "ACC-8856", amount: 450,
    currency: "USD", timestamp: "14:32:30", type: "ach", channel: "ACH",
    risk: "low", anomalyScore: 0.19, jurisdiction: "US",
    flags: [],
  },
  {
    id: "TXN-38298", from: "ACC-5590", to: "ACC-7744", amount: 9950,
    currency: "USD", timestamp: "14:32:34", type: "wire", channel: "SWIFT",
    risk: "high", anomalyScore: 0.81, jurisdiction: "AE",
    flags: ["Structuring suspected", "High-risk jurisdiction"],
    reference: "REF-2278E",
  },
  {
    id: "TXN-38299", from: "ACC-7744", to: "ACC-7833", amount: 28000,
    currency: "USD", timestamp: "14:32:39", type: "wire", channel: "SWIFT",
    risk: "critical", anomalyScore: 0.91, jurisdiction: "KY",
    flags: ["Shell company destination", "Layering detected"],
    reference: "REF-5534F",
  },
  {
    id: "TXN-38300", from: "ACC-1102", to: "ACC-4521", amount: 32000,
    currency: "USD", timestamp: "14:32:44", type: "wire", channel: "FEDWIRE",
    risk: "critical", anomalyScore: 0.89, jurisdiction: "US",
    flags: ["Closing circular loop", "Rapid succession"],
    reference: "REF-6621G",
  },
  {
    id: "TXN-38301", from: "ACC-4400", to: "ACC-1204", amount: 8900,
    currency: "USD", timestamp: "14:32:51", type: "wire", channel: "ACH",
    risk: "medium", anomalyScore: 0.63, jurisdiction: "US",
    flags: ["Near-threshold amount"],
  },
  {
    id: "TXN-38302", from: "ACC-2201", to: "ACC-4400", amount: 15000,
    currency: "USD", timestamp: "14:32:58", type: "wire", channel: "SWIFT",
    risk: "low", anomalyScore: 0.44, jurisdiction: "US",
    flags: [],
  },
];

// ─── AML Alerts ───────────────────────────────────────────────
export const MOCK_ALERTS: AMLAlert[] = [
  {
    id: "ALT-001", type: "circular_transaction", severity: "critical",
    score: 94, entities: ["ACC-4521", "ACC-7833", "ACC-9877", "ACC-5590"],
    entityCount: 4, amount: "$487K", amountRaw: 487000,
    time: "2 min ago", timestamp: Date.now() - 120000,
    description: "4-node circular transaction ring detected over 72h window. Total funds: $487,200 across 23 transfers. Isolation Forest score: 0.94.",
    status: "open", tags: ["circular", "structuring", "sar-candidate"],
    relatedTransactions: ["TXN-38291", "TXN-38294", "TXN-38296", "TXN-38300"],
    graphPath: ["ACC-4521", "ACC-7833", "ACC-9877", "ACC-5590", "ACC-4521"],
  },
  {
    id: "ALT-002", type: "structuring", severity: "high",
    score: 82, entities: ["ACC-7833"], entityCount: 1,
    amount: "$57K", amountRaw: 57000,
    time: "5 min ago", timestamp: Date.now() - 300000,
    description: "6× $9,500 deposits in 48h by ACC-7833. CTR threshold avoidance pattern. Smurfing signature detected.",
    status: "investigating", tags: ["structuring", "smurfing"],
    relatedTransactions: ["TXN-38291", "TXN-38298"],
  },
  {
    id: "ALT-003", type: "dormant_reactivation", severity: "high",
    score: 78, entities: ["ACC-4521"], entityCount: 1,
    amount: "$234K", amountRaw: 234000,
    time: "8 min ago", timestamp: Date.now() - 480000,
    description: "ACC-4521 dormant for 11 months, reactivated with $234K wire. Reactivation score 0.94. Risk propagation to 4 connected nodes.",
    status: "open", tags: ["dormant", "reactivation"],
    relatedTransactions: ["TXN-38291"],
  },
  {
    id: "ALT-004", type: "mule_network", severity: "critical",
    score: 91, entities: ["ACC-5590", "ACC-7744", "ACC-1102", "ACC-7833", "ACC-4521", "ACC-9877", "ACC-4400", "ACC-2201"],
    entityCount: 8, amount: "$1.2M", amountRaw: 1200000,
    time: "12 min ago", timestamp: Date.now() - 720000,
    description: "8-account mule network identified via community detection (Louvain). GraphSAGE probability: 0.91. Coordinated rapid layering pattern.",
    status: "escalated", tags: ["mule-network", "community-detection", "gnn"],
    relatedTransactions: ["TXN-38292", "TXN-38296", "TXN-38299"],
    graphPath: ["ACC-2201", "ACC-5590", "ACC-7744", "ACC-7833"],
  },
  {
    id: "ALT-005", type: "rapid_layering", severity: "medium",
    score: 65, entities: ["ACC-9877", "ACC-1102", "ACC-7744"],
    entityCount: 3, amount: "$89K", amountRaw: 89000,
    time: "15 min ago", timestamp: Date.now() - 900000,
    description: "Rapid layering detected across 3 entities in 6h. Velocity score 0.82. International wire pattern matches placement-layering-integration model.",
    status: "open", tags: ["layering"],
    relatedTransactions: ["TXN-38296", "TXN-38299"],
  },
  {
    id: "ALT-006", type: "gnn_flagged", severity: "high",
    score: 87, entities: ["ACC-7833", "ACC-9877"], entityCount: 2,
    amount: "$292K", amountRaw: 292000,
    time: "18 min ago", timestamp: Date.now() - 1080000,
    description: "GraphSAGE GNN flagged ACC-7833 and ACC-9877 as suspicious based on graph topology. P(fraud) = 0.91 and 0.88 respectively. Community centrality anomalous.",
    status: "open", tags: ["gnn", "graph-topology"],
    relatedTransactions: ["TXN-38292", "TXN-38296"],
  },
];

// ─── Graph Data ───────────────────────────────────────────────
export const MOCK_GRAPH_NODES: GraphNode[] = [
  { id: "ACC-4521", name: "J. Morrison", risk: 87, anomalyScore: 0.94, riskLevel: "critical", community: 0, type: "personal", flagged: true },
  { id: "ACC-7833", name: "Oceanic Ltd", risk: 92, anomalyScore: 0.91, riskLevel: "critical", community: 0, type: "shell", flagged: true },
  { id: "ACC-1204", name: "R. Chen", risk: 45, anomalyScore: 0.47, riskLevel: "normal", community: 1, type: "personal", flagged: false },
  { id: "ACC-9877", name: "Shell Corp A", risk: 89, anomalyScore: 0.88, riskLevel: "critical", community: 0, type: "shell", flagged: true },
  { id: "ACC-6612", name: "M. Santos", risk: 23, anomalyScore: 0.31, riskLevel: "normal", community: 2, type: "personal", flagged: false },
  { id: "ACC-3341", name: "TechPay Inc", risk: 34, anomalyScore: 0.39, riskLevel: "normal", community: 2, type: "business", flagged: false },
  { id: "ACC-2201", name: "K. Nakamura", risk: 56, anomalyScore: 0.61, riskLevel: "moderate", community: 1, type: "personal", flagged: false },
  { id: "ACC-5590", name: "Golden Trade", risk: 78, anomalyScore: 0.81, riskLevel: "high", community: 0, type: "business", flagged: true },
  { id: "ACC-1102", name: "D. Petrov", risk: 71, anomalyScore: 0.74, riskLevel: "high", community: 0, type: "personal", flagged: true },
  { id: "ACC-8856", name: "CleanFlow LLC", risk: 12, anomalyScore: 0.22, riskLevel: "normal", community: 2, type: "business", flagged: false },
  { id: "ACC-7744", name: "M. Al-Rashid", risk: 83, anomalyScore: 0.86, riskLevel: "critical", community: 0, type: "business", flagged: true },
  { id: "ACC-4400", name: "Nexus Fin", risk: 67, anomalyScore: 0.71, riskLevel: "high", community: 1, type: "money_service", flagged: true },
];

export const MOCK_GRAPH_EDGES: GraphEdge[] = [
  { source: "ACC-4521", target: "ACC-7833", amount: 9500, suspicious: true, type: "wire", weight: 3 },
  { source: "ACC-7833", target: "ACC-9877", amount: 47000, suspicious: true, type: "wire", weight: 3 },
  { source: "ACC-9877", target: "ACC-5590", amount: 45500, suspicious: true, type: "international_wire", weight: 3 },
  { source: "ACC-5590", target: "ACC-4521", amount: 44000, suspicious: true, type: "wire", weight: 3 },
  { source: "ACC-1204", target: "ACC-9877", amount: 245000, suspicious: false, type: "international_wire", weight: 2 },
  { source: "ACC-6612", target: "ACC-3341", amount: 1200, suspicious: false, type: "ach", weight: 1 },
  { source: "ACC-2201", target: "ACC-5590", amount: 67800, suspicious: false, type: "wire", weight: 1 },
  { source: "ACC-9877", target: "ACC-1102", amount: 189000, suspicious: true, type: "international_wire", weight: 2 },
  { source: "ACC-3341", target: "ACC-8856", amount: 450, suspicious: false, type: "ach", weight: 1 },
  { source: "ACC-5590", target: "ACC-7744", amount: 9950, suspicious: true, type: "wire", weight: 2 },
  { source: "ACC-1102", target: "ACC-4521", amount: 32000, suspicious: true, type: "wire", weight: 2 },
  { source: "ACC-7744", target: "ACC-7833", amount: 28000, suspicious: true, type: "wire", weight: 2 },
  { source: "ACC-2201", target: "ACC-4400", amount: 15000, suspicious: false, type: "wire", weight: 1 },
  { source: "ACC-4400", target: "ACC-1204", amount: 8900, suspicious: false, type: "wire", weight: 1 },
];

// ─── Isolation Forest Scores ──────────────────────────────────
export const ISOLATION_SCORES: IsolationScore[] = [
  {
    accountId: "ACC-4521",
    score: 0.94,
    riskLevel: "critical",
    treesIsolated: 287,
    avgPathLength: 4.2,
    verdict: "isolated",
    topFeatures: [
      { feature: "structuring_ratio", label: "Structuring Ratio", value: 0.91, normalizedScore: 0.94, riskLevel: "critical", description: "Repeated near-threshold transactions" },
      { feature: "fan_out_ratio", label: "Fan-out Ratio", value: 0.84, normalizedScore: 0.87, riskLevel: "critical", description: "Unusual number of unique recipients" },
      { feature: "night_ratio", label: "Night Activity Ratio", value: 0.72, normalizedScore: 0.82, riskLevel: "high", description: "Activity concentrated 22:00–06:00" },
      { feature: "txn_velocity", label: "Transaction Velocity", value: 0.89, normalizedScore: 0.89, riskLevel: "critical", description: "Burst pattern above 3σ baseline" },
      { feature: "pagerank", label: "PageRank Centrality", value: 0.88, normalizedScore: 0.88, riskLevel: "critical", description: "High hub centrality in network" },
      { feature: "reactivation_score", label: "Reactivation Score", value: 0.94, normalizedScore: 0.94, riskLevel: "critical", description: "11-month dormancy followed by burst" },
      { feature: "smurfing_flag", label: "Smurfing Indicator", value: 0.88, normalizedScore: 0.88, riskLevel: "critical", description: "6× sub-threshold deposits detected" },
      { feature: "mule_score", label: "Mule Score", value: 0.82, normalizedScore: 0.82, riskLevel: "critical", description: "Behavioral signature matches mule" },
    ],
  },
  {
    accountId: "ACC-7833",
    score: 0.91,
    riskLevel: "critical",
    treesIsolated: 274,
    avgPathLength: 4.8,
    verdict: "isolated",
    topFeatures: [
      { feature: "shell_indicator", label: "Shell Company Score", value: 0.97, normalizedScore: 0.97, riskLevel: "critical", description: "Offshore structure detected" },
      { feature: "fan_out_ratio", label: "Fan-out Ratio", value: 0.91, normalizedScore: 0.91, riskLevel: "critical", description: "High counterparty diversity" },
      { feature: "cross_bank_ratio", label: "Cross-bank Ratio", value: 0.93, normalizedScore: 0.93, riskLevel: "critical", description: "Transactions span multiple institutions" },
      { feature: "betweenness", label: "Betweenness Centrality", value: 0.88, normalizedScore: 0.88, riskLevel: "critical", description: "Key bridging node in network" },
      { feature: "community_centrality", label: "Community Centrality", value: 0.94, normalizedScore: 0.94, riskLevel: "critical", description: "Controls information flow in cluster" },
    ],
  },
  {
    accountId: "ACC-9877",
    score: 0.88,
    riskLevel: "critical",
    treesIsolated: 261,
    avgPathLength: 5.1,
    verdict: "isolated",
    topFeatures: [
      { feature: "shell_indicator", label: "Shell Company Score", value: 0.91, normalizedScore: 0.91, riskLevel: "critical", description: "Panama-based shell structure" },
      { feature: "cross_bank_ratio", label: "Cross-bank Ratio", value: 0.87, normalizedScore: 0.87, riskLevel: "critical", description: "Multi-institution pattern" },
      { feature: "geo_entropy", label: "Geographic Entropy", value: 0.92, normalizedScore: 0.92, riskLevel: "critical", description: "Transactions span 8+ jurisdictions" },
    ],
  },
  {
    accountId: "ACC-6612",
    score: 0.31,
    riskLevel: "normal",
    treesIsolated: 58,
    avgPathLength: 18.4,
    verdict: "normal",
    topFeatures: [],
  },
];

// ─── AI Investigation Messages ────────────────────────────────
export const AI_MESSAGES: AIMessage[] = [
  {
    id: "msg-1",
    role: "user",
    content: "Summarize the laundering pattern involving Account ACC-4521",
    timestamp: "14:32:00",
  },
  {
    id: "msg-2",
    role: "assistant",
    content: `**Circular Transaction Pattern Detected — ACC-4521**

Account ACC-4521 (J. Morrison) is the anchor of a 4-node circular transaction ring:

\`ACC-4521 → ACC-7833 → ACC-9877 → ACC-5590 → ACC-4521\`

**Key Findings:**
- Total flow: **$487,200** across 23 transactions in 72h
- Account dormant for **11 months** before sudden reactivation
- All 4 accounts opened within the same 3-month period
- Geographic concentration in high-risk jurisdictions (KY, PA, AE)

**Risk Attribution:**
- Rule-based triggers: 30% (structuring, round-tripping)
- Graph centrality: 25% (PageRank 0.88 — hub node)
- Behavioral ML: 25% (Isolation Forest: **0.94** — isolated in 4.2 splits)
- GNN score: 20% (GraphSAGE: **P(fraud) = 0.91**)

**Verdict: Risk Score 87/100 — CRITICAL → SAR Recommended**`,
    timestamp: "14:32:04",
    metadata: {
      graphPath: ["ACC-4521", "ACC-7833", "ACC-9877", "ACC-5590", "ACC-4521"],
      relatedEntities: ["ACC-4521", "ACC-7833", "ACC-9877", "ACC-5590"],
    },
  },
  {
    id: "msg-3",
    role: "user",
    content: "Generate Cypher query to find all connected entities within 3 hops",
    timestamp: "14:32:30",
  },
  {
    id: "msg-4",
    role: "assistant",
    content: `Here's the Cypher query for Neo4j:

\`\`\`cypher
MATCH path = (a:Account {id: 'ACC-4521'})-[:TRANSFERRED_TO*1..3]-(connected)
WHERE connected <> a
RETURN DISTINCT connected.id AS entity,
       connected.account_name AS name,
       connected.risk_score AS risk,
       connected.anomaly_score AS isolation_score,
       length(shortestPath((a)-[:TRANSFERRED_TO*]-(connected))) AS hops
ORDER BY risk DESC
LIMIT 20
\`\`\`

Found **8 connected entities** within 3 hops:
- 5 flagged as **high-risk** (score > 0.72)
- 2 flagged as **moderate** (0.58–0.72)
- 1 flagged as **monitoring** (0.50–0.58)`,
    timestamp: "14:32:35",
    metadata: {
      cypherQuery: `MATCH path = (a:Account {id: 'ACC-4521'})-[:TRANSFERRED_TO*1..3]-(connected) WHERE connected <> a RETURN DISTINCT connected.id, connected.risk_score ORDER BY connected.risk_score DESC`,
      relatedEntities: ["ACC-7833", "ACC-9877", "ACC-5590", "ACC-1102", "ACC-7744", "ACC-4400", "ACC-2201", "ACC-1204"],
    },
  },
];

// ─── SAR Draft ────────────────────────────────────────────────
export const MOCK_SAR: SARReport = {
  id: "SAR-2024-001",
  subject: "J. Morrison (ACC-4521) — Circular Transaction Ring",
  accountId: "ACC-4521",
  riskScore: 87,
  gnnScore: 0.91,
  entityCount: 4,
  totalAmount: 487200,
  dateRange: "Mar 15–17, 2024",
  pattern: "Circular round-tripping with structuring",
  status: "draft",
  createdAt: "2024-03-17T14:32:00Z",
  narrative: `Between March 15–17, 2024, Account ACC-4521 (J. Morrison) participated in a circular transaction pattern involving four accounts. Total funds moved: $487,200 across 23 wire transfers. The pattern shows characteristics consistent with round-tripping and layering:

1. ACC-4521 → ACC-7833 ($9,500 × 6 transfers — below CTR threshold)
2. ACC-7833 → ACC-9877 ($47,000 — single international wire, Cayman Islands)
3. ACC-9877 → ACC-5590 ($45,500 — international wire, Panama)
4. ACC-5590 → ACC-4521 ($44,000 — completing the cycle)

Account ACC-4521 was dormant for 11 months prior to reactivation. Community detection (Louvain algorithm) identified all four accounts in the same transaction cluster. GraphSAGE GNN classification: P(suspicious) = 0.91. Isolation Forest anomaly score: 0.94 (isolated in average 4.2 tree splits vs 15.8 for normal accounts).`,
};

// ─── Architecture Layers ──────────────────────────────────────
export const ARCHITECTURE_LAYERS: ArchitectureLayer[] = [
  {
    name: "Presentation Layer",
    tech: "Next.js 16 · TypeScript · Tailwind CSS",
    items: ["Dashboard UI", "Graph Explorer", "Case Manager", "AI Copilot"],
    color: "#00F5FF",
    description: "React-based frontend with real-time graph visualization",
  },
  {
    name: "API Gateway",
    tech: "FastAPI · WebSocket Hub · REST",
    items: ["/api/alerts", "/api/graph", "/api/risk", "/ws/stream"],
    color: "#3B82F6",
    description: "High-performance async Python API with WebSocket streaming",
  },
  {
    name: "Intelligence Engine",
    tech: "Isolation Forest · GraphSAGE · Rule Engine",
    items: ["300-Tree IF", "GNN Pipeline", "Cypher Rules", "LangChain Agent"],
    color: "#A855F7",
    description: "ML pipeline: Isolation Forest + GraphSAGE + LLM investigation",
  },
  {
    name: "Graph Database",
    tech: "Neo4j · Cypher · Graph Algorithms",
    items: ["Account Nodes", "Transaction Edges", "Community Detection", "PageRank"],
    color: "#14B8A6",
    description: "Native graph database for relationship-centric financial data",
  },
  {
    name: "Streaming Pipeline",
    tech: "AsyncIO · WebSocket · Real-time Processing",
    items: ["Transaction Simulator", "Detection Engine", "Alert Broadcast", "Graph Mutation"],
    color: "#38BDF8",
    description: "Sub-50ms real-time transaction processing and alert streaming",
  },
];

// ─── Performance Metrics ──────────────────────────────────────
export const PERFORMANCE_METRICS: PerformanceMetric[] = [
  { label: "Transactions/Second", value: 2847, suffix: "", prefix: "", trend: 12 },
  { label: "Graph Traversal", value: 12, suffix: "ms", prefix: "<", trend: -8 },
  { label: "Nodes Processed", value: 1.2, suffix: "M", prefix: "", trend: 5 },
  { label: "Risk Scoring Latency", value: 47, suffix: "ms", prefix: "", trend: -3 },
  { label: "Detection Accuracy", value: 94.7, suffix: "%", prefix: "", trend: 2 },
  { label: "False Positive Rate", value: 38, suffix: "%", prefix: "<", trend: -15 },
];

// ─── Traversal Paths ──────────────────────────────────────────
export const TRAVERSAL_PATHS: TraversalPath[] = [
  {
    nodes: ["ACC-4521", "ACC-7833", "ACC-9877", "ACC-5590", "ACC-4521"],
    totalAmount: 487200,
    hops: 4,
    isCircular: true,
    riskScore: 94,
  },
  {
    nodes: ["ACC-9877", "ACC-1102", "ACC-4521"],
    totalAmount: 221000,
    hops: 2,
    isCircular: false,
    riskScore: 82,
  },
  {
    nodes: ["ACC-5590", "ACC-7744", "ACC-7833"],
    totalAmount: 37950,
    hops: 2,
    isCircular: false,
    riskScore: 78,
  },
];

// ─── Hero Stats ───────────────────────────────────────────────
export const HERO_STATS = [
  { value: "2.7M+", label: "Transactions Analyzed", suffix: "/day" },
  { value: "<50", label: "Risk Scoring Latency", suffix: "ms" },
  { value: "94.7%", label: "Detection Accuracy", suffix: "" },
  { value: "12x", label: "Faster Than Legacy", suffix: "" },
];

// ─── AML Feature Definitions ──────────────────────────────────
export const AML_FEATURE_DEFS = [
  { key: "txn_count", label: "Transaction Count", desc: "Total transaction volume" },
  { key: "avg_amount", label: "Average Amount", desc: "Mean transaction size" },
  { key: "structuring_ratio", label: "Structuring Ratio", desc: "Near-threshold transactions" },
  { key: "fan_out_ratio", label: "Fan-out Ratio", desc: "Unique counterparty spread" },
  { key: "pagerank", label: "PageRank", desc: "Network hub centrality" },
  { key: "out_degree", label: "Out-degree", desc: "Number of unique recipients" },
  { key: "txn_velocity", label: "Transaction Velocity", desc: "Speed of fund movement" },
  { key: "night_ratio", label: "Night Ratio", desc: "Off-hours activity (22:00–06:00)" },
  { key: "cross_bank_ratio", label: "Cross-bank Ratio", desc: "Multi-institution pattern" },
  { key: "mule_score", label: "Mule Score", desc: "Money mule behavioral signature" },
  { key: "smurfing_flag", label: "Smurfing Flag", desc: "Sub-threshold split pattern" },
  { key: "shell_indicator", label: "Shell Indicator", desc: "Shell company characteristics" },
  { key: "reactivation_score", label: "Reactivation Score", desc: "Dormancy-burst pattern" },
  { key: "burst_score", label: "Burst Score", desc: "Sudden activity spike" },
  { key: "graph_anomaly_score", label: "Graph Anomaly", desc: "Network-derived anomaly" },
];
