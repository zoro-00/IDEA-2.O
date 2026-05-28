// ============================================================
// STAR — App Constants
// ============================================================

export const NAV_LINKS = [
  { label: "Intelligence", href: "#intelligence" },
  { label: "Graph", href: "#graph" },
  { label: "ML Engine", href: "#isolation-forest" },
  { label: "AI Copilot", href: "#ai-copilot" },
  { label: "Architecture", href: "#architecture" },
  { label: "Command Center", href: "#command-center" },
];

export const COLORS = {
  // Primaries
  cyan: "#00F5FF",
  cyanDim: "#00C4D4",
  blue: "#3B82F6",
  indigo: "#4F46E5",
  sky: "#38BDF8",
  // Accents
  purple: "#A855F7",
  violet: "#8B5CF6",
  teal: "#14B8A6",
  emerald: "#10B981",
  // Risk
  critical: "#F43F5E",
  high: "#F97316",
  medium: "#FACC15",
  low: "#10B981",
  normal: "#3B82F6",
  // Background
  bgPrimary: "#020617",
  bgSecondary: "#030712",
  bgTertiary: "#0F172A",
  bgCard: "#0d1424",
  // Text
  textPrimary: "#E2E8F0",
  textSecondary: "#94A3B8",
  textMuted: "#475569",
};

export const RISK_COLOR_MAP = {
  critical: COLORS.critical,
  high: COLORS.high,
  moderate: COLORS.medium,
  monitoring: COLORS.blue,
  normal: COLORS.emerald,
};

export const SEVERITY_COLOR_MAP = {
  critical: COLORS.critical,
  high: COLORS.high,
  medium: COLORS.medium,
  low: COLORS.emerald,
};

export const ALERT_TYPE_LABELS: Record<string, string> = {
  circular_transaction: "Circular Transaction Ring",
  structuring: "Structuring / Smurfing",
  rapid_layering: "Rapid Layering",
  mule_network: "Mule Network",
  dormant_reactivation: "Dormant Reactivation",
  high_velocity: "High Velocity Activity",
  cross_border_anomaly: "Cross-border Anomaly",
  smurfing: "Smurfing",
  round_tripping: "Round-tripping",
  shell_company: "Shell Company",
  gnn_flagged: "GNN-Flagged",
};

export const WEBSOCKET_INTERVAL_MS = 2200;
export const ALERT_POLL_INTERVAL_MS = 5000;
export const SCORE_ANIMATION_DURATION_MS = 2000;

export const ISOLATION_FOREST_CONFIG = {
  nEstimators: 300,
  contamination: 0.05,
  maxSamples: "auto",
  nFeatures: 29,
  avgNormalPathLength: 15.8,
  criticalThreshold: 0.72,
  highThreshold: 0.65,
  moderateThreshold: 0.58,
  monitoringThreshold: 0.50,
};
