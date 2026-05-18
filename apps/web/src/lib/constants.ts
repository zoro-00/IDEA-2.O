// ============================================
// STAR Landing Page — Mock Data & Constants
// ============================================

export const COLORS = {
  cyan: "#00F5FF",
  blue: "#3B82F6",
  sky: "#0EA5E9",
  purple: "#A855F7",
  teal: "#06B6D4",
  bgPrimary: "#020617",
  bgSecondary: "#030712",
  bgTertiary: "#0F172A",
  textPrimary: "#E2E8F0",
  textSecondary: "#94A3B8",
  riskCritical: "#FF3B3B",
  riskHigh: "#FF8C42",
  riskMedium: "#FFD166",
  riskLow: "#06D6A0",
};

export const NAV_LINKS = [
  { label: "Intelligence", href: "#intelligence" },
  { label: "Graph", href: "#graph" },
  { label: "AI Copilot", href: "#ai-copilot" },
  { label: "Architecture", href: "#architecture" },
  { label: "Features", href: "#features" },
  { label: "Command Center", href: "#command-center" },
];

export const HERO_STATS = [
  { value: "2.7M+", label: "Transactions Analyzed", suffix: "/day" },
  { value: "<50ms", label: "Risk Scoring Latency", suffix: "" },
  { value: "94.7%", label: "Detection Accuracy", suffix: "" },
  { value: "12x", label: "Faster Than Legacy", suffix: "" },
];

export const MOCK_TRANSACTIONS = [
  {
    id: "TXN-38291",
    from: "ACC-4521",
    to: "ACC-7833",
    amount: 9500,
    risk: "high",
    type: "wire",
    timestamp: "14:32:07",
    flag: "Below CTR threshold",
  },
  {
    id: "TXN-38292",
    from: "ACC-1204",
    to: "ACC-9877",
    amount: 245000,
    risk: "critical",
    type: "international_wire",
    timestamp: "14:32:11",
    flag: "High-risk jurisdiction",
  },
  {
    id: "TXN-38293",
    from: "ACC-6612",
    to: "ACC-3341",
    amount: 1200,
    risk: "low",
    type: "ach",
    timestamp: "14:32:15",
    flag: null,
  },
  {
    id: "TXN-38294",
    from: "ACC-7833",
    to: "ACC-4521",
    amount: 9800,
    risk: "critical",
    type: "wire",
    timestamp: "14:32:18",
    flag: "Circular pattern",
  },
  {
    id: "TXN-38295",
    from: "ACC-2201",
    to: "ACC-5590",
    amount: 67800,
    risk: "medium",
    type: "wire",
    timestamp: "14:32:22",
    flag: "Velocity anomaly",
  },
  {
    id: "TXN-38296",
    from: "ACC-9877",
    to: "ACC-1102",
    amount: 189000,
    risk: "high",
    type: "international_wire",
    timestamp: "14:32:26",
    flag: "Rapid layering",
  },
  {
    id: "TXN-38297",
    from: "ACC-3341",
    to: "ACC-8856",
    amount: 450,
    risk: "low",
    type: "ach",
    timestamp: "14:32:30",
    flag: null,
  },
  {
    id: "TXN-38298",
    from: "ACC-5590",
    to: "ACC-7744",
    amount: 9950,
    risk: "high",
    type: "wire",
    timestamp: "14:32:34",
    flag: "Structuring suspected",
  },
];

export const MOCK_ALERTS = [
  {
    id: "ALT-001",
    type: "Circular Transaction Ring",
    severity: "critical",
    score: 94,
    entities: 4,
    amount: "$487K",
    time: "2 min ago",
  },
  {
    id: "ALT-002",
    type: "Structuring Detected",
    severity: "high",
    score: 82,
    entities: 1,
    amount: "$57K",
    time: "5 min ago",
  },
  {
    id: "ALT-003",
    type: "Dormant Reactivation",
    severity: "high",
    score: 78,
    entities: 1,
    amount: "$234K",
    time: "8 min ago",
  },
  {
    id: "ALT-004",
    type: "Mule Network Activity",
    severity: "critical",
    score: 91,
    entities: 8,
    amount: "$1.2M",
    time: "12 min ago",
  },
  {
    id: "ALT-005",
    type: "Rapid Layering",
    severity: "medium",
    score: 65,
    entities: 3,
    amount: "$89K",
    time: "15 min ago",
  },
];

export const GRAPH_NODES = [
  { id: "ACC-4521", name: "J. Morrison", risk: 87, community: 0, x: 0, y: 0 },
  { id: "ACC-7833", name: "Oceanic Ltd", risk: 92, community: 0, x: 150, y: -80 },
  { id: "ACC-1204", name: "R. Chen", risk: 45, community: 1, x: -120, y: 100 },
  { id: "ACC-9877", name: "Shell Corp A", risk: 89, community: 0, x: 200, y: 120 },
  { id: "ACC-6612", name: "M. Santos", risk: 23, community: 2, x: -200, y: -50 },
  { id: "ACC-3341", name: "TechPay Inc", risk: 34, community: 2, x: -150, y: -150 },
  { id: "ACC-2201", name: "K. Nakamura", risk: 56, community: 1, x: 80, y: 200 },
  { id: "ACC-5590", name: "Golden Trade", risk: 78, community: 0, x: 280, y: 0 },
  { id: "ACC-1102", name: "D. Petrov", risk: 71, community: 0, x: 100, y: -180 },
  { id: "ACC-8856", name: "CleanFlow LLC", risk: 12, community: 2, x: -280, y: 80 },
  { id: "ACC-7744", name: "M. Al-Rashid", risk: 83, community: 0, x: 320, y: -100 },
  { id: "ACC-4400", name: "Nexus Fin", risk: 67, community: 1, x: -50, y: 250 },
];

export const GRAPH_LINKS = [
  { source: "ACC-4521", target: "ACC-7833", amount: 9500, suspicious: true },
  { source: "ACC-7833", target: "ACC-9877", amount: 47000, suspicious: true },
  { source: "ACC-9877", target: "ACC-5590", amount: 45500, suspicious: true },
  { source: "ACC-5590", target: "ACC-4521", amount: 44000, suspicious: true },
  { source: "ACC-1204", target: "ACC-9877", amount: 245000, suspicious: false },
  { source: "ACC-6612", target: "ACC-3341", amount: 1200, suspicious: false },
  { source: "ACC-2201", target: "ACC-5590", amount: 67800, suspicious: false },
  { source: "ACC-9877", target: "ACC-1102", amount: 189000, suspicious: true },
  { source: "ACC-3341", target: "ACC-8856", amount: 450, suspicious: false },
  { source: "ACC-5590", target: "ACC-7744", amount: 9950, suspicious: true },
  { source: "ACC-1102", target: "ACC-4521", amount: 32000, suspicious: true },
  { source: "ACC-7744", target: "ACC-7833", amount: 28000, suspicious: true },
  { source: "ACC-2201", target: "ACC-4400", amount: 15000, suspicious: false },
  { source: "ACC-4400", target: "ACC-1204", amount: 8900, suspicious: false },
];

export const FEATURES = [
  {
    title: "Real-time AML",
    description: "Sub-second transaction monitoring with streaming detection. Every transaction analyzed as it occurs.",
    icon: "Zap",
    color: "#00F5FF",
  },
  {
    title: "Graph Analytics",
    description: "Native graph intelligence reveals hidden connections, mule networks, and shell company rings.",
    icon: "GitBranch",
    color: "#3B82F6",
  },
  {
    title: "GNN Detection",
    description: "GraphSAGE neural networks learn suspicious patterns from graph topology automatically.",
    icon: "Brain",
    color: "#A855F7",
  },
  {
    title: "AI Copilot",
    description: "Natural language investigation assistant. Ask questions, get graph-powered answers instantly.",
    icon: "MessageSquare",
    color: "#06B6D4",
  },
  {
    title: "Auto SAR Generation",
    description: "One-click regulatory narrative generation from graph context. Hours of work in seconds.",
    icon: "FileText",
    color: "#0EA5E9",
  },
  {
    title: "Community Detection",
    description: "Louvain algorithm identifies tightly-knit transaction clusters — potential mule rings.",
    icon: "Users",
    color: "#FF8C42",
  },
  {
    title: "Risk Propagation",
    description: "PageRank-based risk spreading through the network. One bad actor exposes the ring.",
    icon: "Radio",
    color: "#FF3B3B",
  },
  {
    title: "Temporal Intelligence",
    description: "EWMA baselines detect behavioral shifts, dormant reactivation, and burst patterns.",
    icon: "Clock",
    color: "#FFD166",
  },
  {
    title: "Streaming Detection",
    description: "WebSocket-powered real-time streaming with live graph mutation and alert broadcasting.",
    icon: "Activity",
    color: "#06D6A0",
  },
];

export const ARCHITECTURE_LAYERS = [
  {
    name: "Presentation Layer",
    tech: "Next.js 15 · TypeScript · Tailwind",
    items: ["Dashboard", "Graph Explorer", "Case Manager", "AI Assistant"],
    color: "#00F5FF",
  },
  {
    name: "API Gateway",
    tech: "FastAPI · WebSocket Hub",
    items: ["/api/alerts", "/api/graph", "/api/risk", "/ws/stream"],
    color: "#3B82F6",
  },
  {
    name: "Intelligence Engine",
    tech: "Detection · Graph Analytics · ML",
    items: ["Rule Engine", "GraphSAGE", "Isolation Forest", "LangChain Agent"],
    color: "#A855F7",
  },
  {
    name: "Data Layer",
    tech: "Neo4j · Graph Database",
    items: ["Accounts", "Transactions", "Alerts", "Risk Scores"],
    color: "#06B6D4",
  },
  {
    name: "Streaming Pipeline",
    tech: "AsyncIO · WebSocket · Real-time",
    items: ["Transaction Sim", "Detection Engine", "Alert Broadcast", "Graph Mutation"],
    color: "#0EA5E9",
  },
];

export const PERFORMANCE_METRICS = [
  { label: "Alerts/Second", value: 2847, suffix: "", prefix: "" },
  { label: "Graph Traversal", value: 12, suffix: "ms", prefix: "<" },
  { label: "Nodes Processed", value: 1.2, suffix: "M", prefix: "" },
  { label: "Risk Scoring", value: 47, suffix: "ms", prefix: "" },
  { label: "Detection Accuracy", value: 94.7, suffix: "%", prefix: "" },
  { label: "False Positive Rate", value: 38, suffix: "%", prefix: "<" },
];

export const AI_INVESTIGATION_MESSAGES = [
  {
    role: "user" as const,
    content: "Summarize the laundering pattern involving Account ACC-4521",
  },
  {
    role: "assistant" as const,
    content: `**Circular Transaction Pattern Detected**

Account ACC-4521 (J. Morrison) participated in a 4-node circular transaction pattern:

\`ACC-4521 → ACC-7833 → ACC-9877 → ACC-5590 → ACC-4521\`

**Key Findings:**
- Total flow: **$487,200** across 23 transactions
- Time window: 72 hours (Mar 15-17)
- Account was dormant for 11 months before sudden activation
- Connected accounts share similar opening dates
- Geographic concentration in high-risk jurisdictions

**Risk Score: 87/100 (CRITICAL)**
- Rule triggers: 30% (structuring detected)
- Graph centrality: 25% (high PageRank — hub node)
- Behavioral anomaly: 25% (Isolation Forest flagged)
- GNN score: 20% (GraphSAGE: 0.91 probability)

*Recommended action: Escalate to SAR filing*`,
  },
  {
    role: "user" as const,
    content: "Generate Cypher query to find all connected entities within 3 hops",
  },
  {
    role: "assistant" as const,
    content: `Here's the Cypher query:

\`\`\`cypher
MATCH path = (a:Account {id: 'ACC-4521'})-[:TRANSFERRED_TO*1..3]-(connected)
WHERE connected <> a
RETURN DISTINCT connected.id AS entity,
       connected.account_name AS name,
       connected.risk_score AS risk,
       length(shortestPath((a)-[:TRANSFERRED_TO*]-(connected))) AS hops
ORDER BY risk DESC
\`\`\`

Found **8 connected entities** within 3 hops. 5 flagged as high-risk.`,
  },
];

export const TECH_STACK = [
  { name: "Neo4j", category: "Database" },
  { name: "FastAPI", category: "Backend" },
  { name: "GraphSAGE", category: "ML Model" },
  { name: "Isolation Forest", category: "Anomaly Detection" },
  { name: "WebSockets", category: "Real-time" },
  { name: "LangChain", category: "AI Agent" },
  { name: "Next.js 15", category: "Frontend" },
  { name: "PyTorch Geometric", category: "GNN Framework" },
];
