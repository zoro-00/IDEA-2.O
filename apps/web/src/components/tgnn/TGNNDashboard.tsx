"use client";
// =============================================================================
// TGNN Dashboard — Exact port of inference/frontend/src/dashboard.tsx
// Real-Time AML Detection · GATe TGNN + Rule Engine · Neo4j Aura
// =============================================================================

import { useState, useEffect, useRef, useCallback, type FC } from "react";
import dynamic from "next/dynamic";
import {
  Play, Shield, Activity, RefreshCw, Layers, BarChart3,
  TrendingUp, CheckCircle, XCircle, AlertCircle,
  ChevronDown, ChevronUp, Search, X, Maximize2, Minimize2
} from "lucide-react";
import "./tgnn.css";

// ForceGraph2D must be dynamically imported (no SSR — uses canvas/browser APIs)
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

// ── Types (exact from dashboard.tsx) ─────────────────────────────────────────
interface GraphNode {
  id: string; status: string; risk_score: number; is_fraud: boolean;
  in_loop: boolean; degree: number; reasons?: string[]; x?: number; y?: number;
}
interface GraphLink {
  source: string | GraphNode; target: string | GraphNode;
  tx_id: string; amount: number; type: string; is_alert: boolean;
  in_loop: boolean; risk_score: number; review_status?: string;
}
interface GraphData { nodes: GraphNode[]; links: GraphLink[]; }
interface TxRow {
  tx_id: string; sender: string; receiver: string; amount: number;
  tx_type: string; risk_score: number; currency: string; payment_format: string;
  timestamp: number; status: string; case_id?: string; isNew?: boolean;
  reasons?: string[]; is_fraud_gt?: boolean;
  cycle_path?: string[]; cycle_edges?: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const WS_URL = API.replace(/^http/, "ws") + "/ws/inference";
const NODE_COLORS: Record<string, string> = {
  STABLE: "#64748B", SUSPICIOUS: "#EA580C",
  CRITICAL: "#DC2626", CONFIRMED_FRAUD: "#DC2626"
};

// ── Utilities ─────────────────────────────────────────────────────────────────
function riskClass(r: number) {
  if (r >= 70) return "critical";
  if (r >= 50) return "high";
  if (r >= 30) return "medium";
  return "low";
}
function fmtAmount(n: number) {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Sub-components (exact from dashboard.tsx) ─────────────────────────────────
const SortIcon: FC<{ col: string; sortCol: string; sortDir: "asc" | "desc" }> = ({ col, sortCol, sortDir }) => (
  <span className={`sort-icon ${sortCol === col ? "sorted" : ""}`}>
    {sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : "↕"}
  </span>
);

const TypeBadge: FC<{ type: string }> = ({ type }) => {
  const cls = type === "Circular" ? "circular"
    : type === "Layering" ? "layering"
    : type === "Structuring" ? "structuring"
    : type === "Dispersion" ? "circular"
    : type === "Gathering" ? "circular"
    : "normal";
  const icon = (type === "Circular" || type === "Dispersion" || type === "Gathering")
    ? <RefreshCw size={9} />
    : type === "Layering" ? <Layers size={9} />
    : type === "Structuring" ? <BarChart3 size={9} />
    : <TrendingUp size={9} />;
  return <span className={`badge-type ${cls}`}>{icon}{type}</span>;
};

const StatusBadge: FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    NORMAL: "badge-normal", SUSPICIOUS: "badge-flagged",
    PENDING_REVIEW: "badge-pending", APPROVED: "badge-approved",
    REJECTED: "badge-rejected", ESCALATED: "badge-escalated"
  };
  const label: Record<string, string> = {
    NORMAL: "Normal", SUSPICIOUS: "Flagged", PENDING_REVIEW: "Pending",
    APPROVED: "Cleared", REJECTED: "Rejected", ESCALATED: "Escalated"
  };
  return <span className={`badge ${map[status] || "badge-normal"}`}>{label[status] || status}</span>;
};

const RiskCell: FC<{ score: number }> = ({ score }) => {
  const cls = riskClass(score);
  return (
    <div className="risk-cell">
      <div className="risk-bar-track">
        <div className={`risk-bar-fill ${cls}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`risk-text ${cls}`}>{score > 0 ? `${score.toFixed(1)}%` : "—"}</span>
    </div>
  );
};

// ── Main Dashboard Component ──────────────────────────────────────────────────
export default function TGNNDashboard() {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [cases, setCases] = useState<TxRow[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "cases">("dashboard");
  const [tableFilter, setTableFilter] = useState<"all" | "flagged">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTx, setSelectedTx] = useState<TxRow | null>(null);
  const [graphCollapsed, setGraphCollapsed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const [alertCount, setAlertCount] = useState(0);
  const [patternCount, setPatternCount] = useState(0);
  const [metrics, setMetrics] = useState({ caught: 0, missed: 0, fp: 0 });
  const [threshold, setThreshold] = useState(0.35);
  const [focusedCase, setFocusedCase] = useState<{
    sender: string; receiver: string; tx_id: string; tx_type?: string;
    cycle_path?: string[]; cycle_edges?: string[];
    relatedNodes?: string[]; relatedEdges?: string[];
  } | null>(null);

  // Build pattern-aware focus highlight from a transaction row
  const buildFocusFromTx = useCallback((tx: TxRow, gd: GraphData) => {
    const base = {
      sender: tx.sender, receiver: tx.receiver, tx_id: tx.tx_id, tx_type: tx.tx_type,
      cycle_path: [] as string[], cycle_edges: [] as string[],
      relatedNodes: [] as string[], relatedEdges: [] as string[]
    };
    const resolveId = (n: string | GraphNode) => typeof n === "string" ? n : n.id;
    if (tx.tx_type === "Gathering") {
      const hubLinks = gd.links.filter(l => resolveId(l.target) === tx.receiver);
      base.relatedNodes = [...new Set(hubLinks.map(l => resolveId(l.source)))];
      base.relatedEdges = hubLinks.map(l => l.tx_id);
    } else if (tx.tx_type === "Dispersion") {
      const fanLinks = gd.links.filter(l => resolveId(l.source) === tx.sender);
      base.relatedNodes = [...new Set(fanLinks.map(l => resolveId(l.target)))];
      base.relatedEdges = fanLinks.map(l => l.tx_id);
    } else if (tx.tx_type === "Layering") {
      const inLinks = gd.links.filter(l => resolveId(l.target) === tx.sender);
      const outLinks = gd.links.filter(l => resolveId(l.source) === tx.sender);
      base.relatedNodes = [...new Set([...inLinks.map(l => resolveId(l.source)), ...outLinks.map(l => resolveId(l.target))])];
      base.relatedEdges = [...inLinks.map(l => l.tx_id), ...outLinks.map(l => l.tx_id)];
    }
    return base;
  }, []);

  const [sortCol, setSortCol] = useState<string>("");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const fullGraphRef = useRef<GraphData>({ nodes: [], links: [] });
  const graphRef = useRef<any>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 400 });
  const seenPatterns = useRef<Set<string>>(new Set());

  // Zoom graph to focused case nodes
  useEffect(() => {
    if (!focusedCase || !graphRef.current) return;
    const sn = graphData.nodes.find(n => n.id === focusedCase.sender);
    const rn = graphData.nodes.find(n => n.id === focusedCase.receiver);
    if (sn?.x != null && rn?.x != null) {
      const cx = (sn.x + rn.x) / 2, cy = ((sn.y || 0) + (rn.y || 0)) / 2;
      graphRef.current.centerAt(cx, cy, 600);
      graphRef.current.zoom(4, 600);
    } else if (sn?.x != null) {
      graphRef.current.centerAt(sn.x, sn.y, 600);
      graphRef.current.zoom(4, 600);
    }
  }, [focusedCase, graphData.nodes]);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(e => setDimensions({ width: e[0].contentRect.width, height: e[0].contentRect.height }));
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const fetchGraph = () =>
    fetch(`${API}/api/graph`)
      .then(r => r.json())
      .then(data => {
        fullGraphRef.current = data;
        setGraphData({ nodes: data.nodes, links: [] });
        setIsLoaded(true);
      })
      .catch(e => console.warn("fetchGraph error:", e));

  const fetchCases = () =>
    fetch(`${API}/api/cases`)
      .then(r => r.json())
      .then(data => setCases(data))
      .catch(e => console.warn("fetchCases error:", e));

  useEffect(() => {
    fetchGraph();
    setTimeout(() => graphRef.current?.zoomToFit(400, 60), 500);
  }, []);

  useEffect(() => {
    if (graphRef.current && isLoaded) {
      graphRef.current.d3Force("charge").strength(-80);
      graphRef.current.d3Force("link").distance(40);
      graphRef.current.d3Force("center").strength(0.2);
    }
  }, [isLoaded, graphData.nodes.length]);

  useEffect(() => {
    if (isRunning) {
      const iv = setInterval(fetchCases, 2000);
      return () => clearInterval(iv);
    }
  }, [isRunning]);

  const runDemo = () => {
    if (isRunning) return;
    setIsRunning(true);
    setTransactions([]); setCases([]); setSelectedTx(null);
    setAlertCount(0); setPatternCount(0); seenPatterns.current.clear();
    setMetrics({ caught: 0, missed: 0, fp: 0 });
    setProgress({ processed: 0, total: 0 });
    setGraphData(prev => ({ nodes: prev.nodes.map(n => ({ ...n, status: "STABLE", is_fraud: false })), links: [] }));
    setTimeout(() => graphRef.current?.zoomToFit(400, 60), 100);

    const ws = new WebSocket(`${WS_URL}?threshold=${threshold}`);
    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.type === "inference_start") {
        setProgress({ processed: 0, total: msg.data.total });
      } else if (msg.type === "alert" || msg.type === "transaction") {
        const d = msg.data;
        const isAlert = msg.type === "alert";
        const row: TxRow = {
          tx_id: d.tx_id, sender: d.sender, receiver: d.receiver,
          amount: d.amount || 0, tx_type: d.tx_type || "Normal",
          risk_score: d.risk_score || 0, currency: d.currency || "USD",
          payment_format: d.payment_format || "Wire", timestamp: d.timestamp || 0,
          status: isAlert ? "SUSPICIOUS" : "NORMAL", case_id: d.case_id, isNew: true,
          reasons: d.reasons || [], is_fraud_gt: d.is_fraud_gt
        };

        if (isAlert && d.is_fraud_gt) { setMetrics(m => ({ ...m, caught: m.caught + 1 })); }
        if (!isAlert && d.is_fraud_gt) { setMetrics(m => ({ ...m, missed: m.missed + 1 })); }
        if (isAlert && !d.is_fraud_gt) { setMetrics(m => ({ ...m, fp: m.fp + 1 })); }

        if (isAlert) {
          setAlertCount(p => p + 1);
          if (!seenPatterns.current.has(d.tx_type) && d.tx_type !== "Normal") {
            seenPatterns.current.add(d.tx_type);
            setPatternCount(p => p + 1);
          }
        }
        setProgress(p => ({ ...p, processed: p.processed + 1 }));
        setTransactions(prev => {
          const next = [...prev, row];
          setTimeout(() => setTransactions(tx => tx.map(t => t.tx_id === row.tx_id ? { ...t, isNew: false } : t)), 500);
          return next;
        });
        setGraphData(prev => {
          const nodes = [...prev.nodes]; 
          const links = [...prev.links];
          
          let senderNode = nodes.find(n => n.id === d.sender);
          if (!senderNode) {
            senderNode = { id: d.sender, status: "STABLE", risk_score: 0, is_fraud: false, in_loop: false, degree: 0 };
            nodes.push(senderNode);
          }
          let receiverNode = nodes.find(n => n.id === d.receiver);
          if (!receiverNode) {
            receiverNode = { id: d.receiver, status: "STABLE", risk_score: 0, is_fraud: false, in_loop: false, degree: 0 };
            nodes.push(receiverNode);
          }
          
          senderNode.degree += 1;
          receiverNode.degree += 1;

          if (isAlert) {
            senderNode.status = "SUSPICIOUS"; 
            senderNode.is_fraud = true;
          }
          
          if (!links.find(l => (l as any).tx_id === d.tx_id)) {
            links.push({
              source: d.sender,
              target: d.receiver,
              tx_id: d.tx_id,
              amount: d.amount || 0,
              type: d.tx_type || "Normal",
              is_alert: isAlert,
              risk_score: d.risk_score || 0,
              in_loop: false,
            });
          }
          return { nodes, links };
        });
      } else if (msg.type === "progress") {
        setProgress(msg.data);
        if (graphRef.current && msg.data.processed > 0) {
          graphRef.current.zoomToFit(600, 60);
        }
      } else if (msg.type === "inference_complete") {
        setIsRunning(false);
        fetchCases();
        setTimeout(() => graphRef.current?.zoomToFit(1000, 60), 1000);
      } else if (msg.type === "error") {
        console.error("Inference error:", msg.message);
        setIsRunning(false);
      }
    };
    ws.onclose = () => setIsRunning(false);
    ws.onerror = () => setIsRunning(false);
  };

  const handleReview = async (caseId: string, decision: string) => {
    await fetch(`${API}/api/cases/${caseId}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision })
    });
    setSelectedTx(null);
    fetchCases();
    fetchGraph();
    setTransactions(prev => prev.map(t =>
      t.case_id === caseId
        ? { ...t, status: decision === "APPROVED" ? "APPROVED" : decision === "REJECTED" ? "REJECTED" : "ESCALATED" }
        : t
    ));
  };

  const focusedCaseRef = useRef(focusedCase);
  useEffect(() => { focusedCaseRef.current = focusedCase; }, [focusedCase, graphData.nodes]);

  // Node canvas renderer (exact from dashboard.tsx)
  const nodeCanvasObject = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    if (typeof node.x !== "number" || typeof node.y !== "number") return;
    const fc = focusedCaseRef.current;
    const size = Math.max(8, Math.min(24, Math.sqrt(node.degree || 1) * 4 + 6));
    const color = NODE_COLORS[node.status] || NODE_COLORS.STABLE;

    const isFocusDirect = fc && (node.id === fc.sender || node.id === fc.receiver);
    const isCycleNode = fc?.cycle_path && fc.cycle_path.includes(node.id);
    const isRelated = fc?.relatedNodes && fc.relatedNodes.includes(node.id);
    const isDimmed = fc && !isFocusDirect && !isCycleNode && !isRelated;

    if (isCycleNode) {
      const t = Date.now() / 800;
      const pulse = size + 4 + Math.sin(t + (node.x || 0)) * 2;
      const g = ctx.createRadialGradient(node.x, node.y, size, node.x, node.y, pulse);
      g.addColorStop(0, "rgba(220,38,38,0.4)"); g.addColorStop(1, "rgba(220,38,38,0)");
      ctx.beginPath(); ctx.arc(node.x, node.y, pulse, 0, 2 * Math.PI); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.arc(node.x, node.y, size + 1, 0, 2 * Math.PI);
      ctx.fillStyle = "#991b1b"; ctx.fill();
      ctx.strokeStyle = `rgba(220,38,38,${0.7 + Math.sin(t) * 0.3})`; ctx.lineWidth = 2; ctx.stroke();
    } else if (isFocusDirect) {
      const g = ctx.createRadialGradient(node.x, node.y, size, node.x, node.y, size * 3);
      g.addColorStop(0, "rgba(30,64,175,0.35)"); g.addColorStop(1, "rgba(30,64,175,0)");
      ctx.beginPath(); ctx.arc(node.x, node.y, size * 3, 0, 2 * Math.PI); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.arc(node.x, node.y, size + 1, 0, 2 * Math.PI);
      ctx.fillStyle = "#1e3a8a"; ctx.fill();
      ctx.strokeStyle = "#1e40af"; ctx.lineWidth = 2; ctx.stroke();
    } else if (isRelated) {
      const g = ctx.createRadialGradient(node.x, node.y, size, node.x, node.y, size * 2.5);
      g.addColorStop(0, "rgba(251,191,36,0.3)"); g.addColorStop(1, "rgba(251,191,36,0)");
      ctx.beginPath(); ctx.arc(node.x, node.y, size * 2.5, 0, 2 * Math.PI); ctx.fillStyle = g; ctx.fill();
      ctx.beginPath(); ctx.arc(node.x, node.y, size + 0.5, 0, 2 * Math.PI);
      ctx.fillStyle = "#92600a"; ctx.fill();
      ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 1.5; ctx.stroke();
    } else {
      if (!isDimmed && node.is_fraud) {
        const g = ctx.createRadialGradient(node.x, node.y, size, node.x, node.y, size * 3);
        g.addColorStop(0, color + "50"); g.addColorStop(1, color + "00");
        ctx.beginPath(); ctx.arc(node.x, node.y, size * 3, 0, 2 * Math.PI); ctx.fillStyle = g; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
      ctx.fillStyle = isDimmed ? "rgba(203,213,225,0.5)" : color; ctx.fill();
      ctx.strokeStyle = isDimmed ? "rgba(15,23,42,0.1)" : "rgba(15,23,42,0.2)"; ctx.lineWidth = 0.5; ctx.stroke();
    }

    const showLabel = isFocusDirect || isCycleNode || isRelated || globalScale > 2 || (node.is_fraud && globalScale > 1.2);
    if (showLabel) {
      ctx.font = `${(isFocusDirect || isCycleNode) ? "600" : "400"} ${Math.max(10 / globalScale, 3)}px "Inter"`;
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillStyle = isCycleNode ? "#dc2626" : isFocusDirect ? "#2563eb" : isRelated ? "#fbbf24" : isDimmed ? "rgba(100,116,139,0.5)" : "#475569";
      ctx.fillText(node.id, node.x, node.y + size + 2);
    }
  }, []);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const filteredTx = transactions.filter(t => {
    if (tableFilter === "flagged" && t.status === "NORMAL") return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.tx_id.toLowerCase().includes(q) || t.sender.toLowerCase().includes(q) ||
        t.receiver.toLowerCase().includes(q) || t.tx_type.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    if (!sortCol) return 0;
    const v = (x: TxRow) => sortCol === "amount" ? x.amount : sortCol === "risk" ? x.risk_score : 0;
    return sortDir === "asc" ? v(a) - v(b) : v(b) - v(a);
  });

  const progPct = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0;
  const isDone = !isRunning && progress.processed > 0 && progress.processed === progress.total;

  return (
    <div className="tgnn-root">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <div>
            <div className="header-title">STAR <span>TGNN</span></div>
            <div className="header-subtitle">Real-Time AML Detection · Neo4j Aura · GATe Model</div>
            <div style={{ fontSize: 10, color: "var(--color-risk-medium)", marginTop: 4 }}>
              Note: The global Streaming Center keeps updating data in the background even if this demo is idle.
            </div>
          </div>
        </div>
        <nav className="header-nav">
          <button className={`nav-tab ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>Dashboard</button>
          <button className={`nav-tab ${activeTab === "cases" ? "active" : ""}`} onClick={() => setActiveTab("cases")}>
            Case Queue {cases.length > 0 && <span className="badge-count">{cases.length}</span>}
          </button>
        </nav>
        <div className="header-right">
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginRight: "8px" }}>
            <div style={{ fontSize: 11, color: "var(--color-text-muted)", fontWeight: 600 }}>GNN THRESHOLD:</div>
            <div style={{ fontSize: 11, color: "var(--color-text-primary)" }}>{threshold.toFixed(2)}</div>
            <input
              type="range" min="0.10" max="0.90" step="0.01" value={threshold}
              onChange={e => setThreshold(parseFloat(e.target.value))}
              style={{ width: 80, cursor: "pointer" }}
            />
          </div>
          <div className={`status-chip ${isRunning ? "running" : ""}`}>
            {isRunning ? <><span className="status-dot-live" />LIVE</> : isDone ? "✓ Complete" : "● Idle"}
          </div>
          <button
            className={`btn-start ${!isLoaded || isRunning ? "" : "ready"}`}
            onClick={runDemo}
            disabled={!isLoaded || isRunning}
          >
            {isRunning ? <><Activity size={13} />Running…</> : <><Play size={13} fill="currentColor" />Start Demo</>}
          </button>
        </div>
      </header>

      {/* Progress */}
      <div className="progress-strip">
        <div className={`progress-fill ${isDone ? "complete" : ""}`} style={{ width: `${progPct}%` }} />
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <Activity size={14} className="stat-icon" />
          <div className="stat-body">
            <div className="stat-label">Processed</div>
            <div className="stat-value">{progress.processed || 0}</div>
          </div>
        </div>
        <div className="stat-card">
          <AlertCircle size={14} className="stat-icon" style={{ color: alertCount > 0 ? "var(--color-risk-critical)" : undefined }} />
          <div className="stat-body">
            <div className="stat-label">Alerts</div>
            <div className={`stat-value ${alertCount > 0 ? "v-red" : ""}`}>{alertCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <Layers size={14} className="stat-icon" style={{ color: patternCount > 0 ? "var(--color-accent-indigo)" : undefined }} />
          <div className="stat-body">
            <div className="stat-label">Patterns</div>
            <div className={`stat-value ${patternCount > 0 ? "v-purple" : ""}`}>{patternCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <Shield size={14} className="stat-icon" style={{ color: cases.length > 0 ? "var(--color-risk-high)" : undefined }} />
          <div className="stat-body">
            <div className="stat-label">Pending Review</div>
            <div className={`stat-value ${cases.length > 0 ? "v-amber" : ""}`}>{cases.length}</div>
          </div>
        </div>
        <div className="stat-card" style={{ border: "1px dashed var(--color-primary)", background: "rgba(30,64,175,0.05)", minWidth: 200 }}>
          <div className="stat-body" style={{ flex: 1 }}>
            <div className="stat-label" style={{ color: "var(--color-primary)" }}>Dev Tracker (Ground Truth)</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 11, fontWeight: 500 }}>
              <div><span style={{ color: "var(--color-text-muted)" }}>Caught:</span> <span style={{ color: "var(--color-risk-low)" }}>{metrics.caught}</span></div>
              <div><span style={{ color: "var(--color-text-muted)" }}>Missed:</span> <span style={{ color: "var(--color-risk-critical)" }}>{metrics.missed}</span></div>
              <div><span style={{ color: "var(--color-text-muted)" }}>FP:</span> <span style={{ color: "var(--color-risk-high)" }}>{metrics.fp}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Body — 60/40 layout */}
      <div className="main-content">
        {/* Left Panel */}
        <div className="table-panel">
          {activeTab === "dashboard" ? (
            <>
              <div className="table-toolbar">
                <div className="filter-tabs">
                  <button className={`filter-tab ${tableFilter === "all" ? "active" : ""}`} onClick={() => setTableFilter("all")}>
                    All <span className="count">{transactions.length}</span>
                  </button>
                  <button className={`filter-tab ${tableFilter === "flagged" ? "active" : ""}`} onClick={() => setTableFilter("flagged")}>
                    Flagged <span className="count">{alertCount}</span>
                  </button>
                </div>
                <div className="search-box">
                  <Search size={12} />
                  <input
                    placeholder="Search ID, entity, type…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", display: "flex" }} onClick={() => setSearchQuery("")}>
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>
              <div className="table-container">
                {filteredTx.length === 0 ? (
                  <div className="empty-state">
                    <Shield size={32} color="var(--color-text-muted)" />
                    <p>{isLoaded ? "Click \"Start Demo\" to begin inference" : "Loading Data…"}</p>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: 36 }} className="align-center">#</th>
                        <th style={{ width: 80 }}>TX ID</th>
                        <th>Sender</th>
                        <th>Receiver</th>
                        <th className={`align-right ${sortCol === "amount" ? "sorted" : ""}`} onClick={() => handleSort("amount")}>
                          Amount <SortIcon col="amount" sortCol={sortCol} sortDir={sortDir} />
                        </th>
                        <th style={{ width: 70 }}>Currency</th>
                        <th style={{ width: 80 }}>Format</th>
                        <th style={{ width: 100 }}>Type</th>
                        <th className={`align-right ${sortCol === "risk" ? "sorted" : ""}`} onClick={() => handleSort("risk")} style={{ width: 110 }}>
                          Risk Score <SortIcon col="risk" sortCol={sortCol} sortDir={sortDir} />
                        </th>
                        <th className="align-center" style={{ width: 90 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTx.map((t, i) => {
                        const isSelected = selectedTx?.tx_id === t.tx_id;
                        return (
                          <tr
                            key={t.tx_id}
                            className={`${t.status !== "NORMAL" ? "row-alert" : ""} ${t.isNew ? "row-new" : ""} ${isSelected ? "selected" : ""}`}
                            onClick={() => {
                              if (isSelected) { setSelectedTx(null); setFocusedCase(null); }
                              else {
                                setSelectedTx(t.status !== "NORMAL" ? t : { ...t, case_id: undefined });
                                setFocusedCase(buildFocusFromTx(t, graphData));
                              }
                            }}
                          >
                            <td className="align-center text-muted" style={{ fontSize: 11 }}>{i + 1}</td>
                            <td className="mono" style={{ color: "var(--color-primary)" }}>{t.tx_id}</td>
                            <td style={{ maxWidth: 130 }}>{t.sender}</td>
                            <td style={{ maxWidth: 130 }}>{t.receiver}</td>
                            <td className="align-right mono">{fmtAmount(t.amount)}</td>
                            <td className="mono text-muted" style={{ fontSize: 11 }}>{t.currency}</td>
                            <td className="text-muted" style={{ fontSize: 11 }}>{t.payment_format}</td>
                            <td><TypeBadge type={t.tx_type} /></td>
                            <td className="align-right"><RiskCell score={t.risk_score} /></td>
                            <td className="align-center"><StatusBadge status={t.status} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            /* Cases Tab */
            <div className="table-container">
              {cases.length === 0 ? (
                <div className="empty-cases">
                  <Shield size={28} color="var(--color-text-muted)" />
                  <p>No pending cases. Run the demo to generate alerts.</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36, textAlign: "center" }}>#</th>
                      <th style={{ width: 90 }}>TX ID</th>
                      <th>Sender</th>
                      <th>Receiver</th>
                      <th className="align-right">Amount</th>
                      <th style={{ width: 110 }}>Type</th>
                      <th className="align-right" style={{ width: 100 }}>Risk Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cases.map((c: TxRow, idx: number) => {
                      const isSelected = selectedTx?.case_id === c.case_id;
                      return (
                        <tr
                          key={c.case_id}
                          className={isSelected ? "selected" : ""}
                          onClick={() => {
                            if (isSelected) { setFocusedCase(null); setSelectedTx(null); }
                            else {
                              const base = buildFocusFromTx(c, graphData);
                              setFocusedCase({ ...base, cycle_path: c.cycle_path || [], cycle_edges: c.cycle_edges || [] });
                              setSelectedTx({ ...c, status: "SUSPICIOUS" });
                            }
                          }}
                        >
                          <td style={{ textAlign: "center", color: "var(--color-text-muted)", fontSize: 11, fontFamily: "var(--font-mono)" }}>{idx + 1}</td>
                          <td className="mono" style={{ color: "var(--color-primary)" }}>{c.tx_id}</td>
                          <td>{c.sender}</td>
                          <td className="dim">{c.receiver}</td>
                          <td className="align-right mono">{fmtAmount(c.amount)}</td>
                          <td><TypeBadge type={c.tx_type} /></td>
                          <td className="align-right"><RiskCell score={c.risk_score} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {/* Right: Graph + Case Review */}
        <div className="graph-panel">
          <div className="panel-header">
            <span className="panel-title">
              Transaction Graph
              {focusedCase && <span style={{ color: "var(--color-primary)", marginLeft: 8, fontSize: 10, fontWeight: 400 }}>Focused: {focusedCase.tx_id}</span>}
            </span>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              {focusedCase && (
                <button className="panel-toggle" onClick={() => { setFocusedCase(null); setSelectedTx(null); graphRef.current?.zoomToFit(600, 60); }} style={{ fontSize: 10, padding: "2px 8px" }}>
                  Clear Focus
                </button>
              )}
              <button className="panel-toggle" onClick={() => { setIsFullscreen(f => !f); setTimeout(() => graphRef.current?.zoomToFit(600, 60), 100); }}>
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
              </button>
              <button className="panel-toggle" onClick={() => setGraphCollapsed(c => !c)}>
                {graphCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </button>
            </div>
          </div>
          <div
            ref={containerRef}
            className={`graph-container ${graphCollapsed ? "collapsed" : ""}`}
            style={isFullscreen ? { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, background: "var(--color-bg-primary)", display: "flex" } : {}}
          >
            {isLoaded && !graphCollapsed && (
              <ForceGraph2D
                ref={graphRef as any}
                graphData={graphData}
                width={dimensions.width}
                height={dimensions.height}
                backgroundColor="transparent"
                nodeId="id"
                nodeCanvasObject={nodeCanvasObject as any}
                linkColor={(l: any) => {
                  const fc = focusedCase;
                  if (fc) {
                    const ceSet = new Set(fc.cycle_edges || []);
                    const reSet = new Set(fc.relatedEdges || []);
                    if (ceSet.has(l.tx_id)) return "rgba(239,68,68,0.9)";
                    if (reSet.has(l.tx_id)) return "rgba(251,191,36,0.85)";
                    if (l.tx_id === fc.tx_id) return "rgba(96,165,250,0.9)";
                    return "rgba(0,0,0,0.06)";
                  }
                  return l.is_alert ? "rgba(239,68,68,0.75)" : "rgba(100,116,139,0.35)";
                }}
                linkWidth={(l: any) => {
                  const fc = focusedCase;
                  if (fc) {
                    const ceSet = new Set(fc.cycle_edges || []);
                    const reSet = new Set(fc.relatedEdges || []);
                    if (ceSet.has(l.tx_id)) return 2.5;
                    if (reSet.has(l.tx_id)) return 2;
                    if (l.tx_id === fc.tx_id) return 2;
                    return 0.3;
                  }
                  return l.is_alert ? 1.5 : 1.2;
                }}
                linkDirectionalParticles={(l: any) => {
                  const fc = focusedCase;
                  if (fc) {
                    const ceSet = new Set(fc.cycle_edges || []);
                    const reSet = new Set(fc.relatedEdges || []);
                    if (ceSet.has(l.tx_id)) return 3;
                    if (reSet.has(l.tx_id)) return 2;
                    if (l.tx_id === fc.tx_id) return 2;
                    return 0;
                  }
                  return l.is_alert ? 2 : 0;
                }}
                linkDirectionalParticleWidth={3}
                linkDirectionalParticleSpeed={0.006}
                linkDirectionalParticleColor={(l: any) => {
                  const fc = focusedCase;
                  if (fc) {
                    const reSet = new Set(fc.relatedEdges || []);
                    if (reSet.has(l.tx_id)) return "#fbbf24";
                  }
                  return "#ef4444";
                }}
                d3VelocityDecay={0.8}
                d3AlphaDecay={0.05}
              />
            )}
          </div>

          {/* Case Review Panel */}
          {selectedTx && (
            <div className="case-review">
              <div className="case-review-header">
                <div><div className="case-review-title">{selectedTx.tx_id}</div></div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="case-review-badge"><TypeBadge type={selectedTx.tx_type} /></span>
                  <button className="close-btn" onClick={() => { setSelectedTx(null); setFocusedCase(null); graphRef.current?.zoomToFit(600, 60); }}>
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="case-details">
                <div className="detail-item"><div className="detail-label">Sender</div><div className="detail-value">{selectedTx.sender}</div></div>
                <div className="detail-item"><div className="detail-label">Receiver</div><div className="detail-value">{selectedTx.receiver}</div></div>
                <div className="detail-item"><div className="detail-label">Amount</div><div className="detail-value mono">{fmtAmount(selectedTx.amount)}</div></div>
                <div className="detail-item"><div className="detail-label">Currency</div><div className="detail-value mono">{selectedTx.currency || "N/A"}</div></div>
                <div className="detail-item"><div className="detail-label">Format</div><div className="detail-value">{selectedTx.payment_format || "N/A"}</div></div>
                <div className="detail-item">
                  <div className="detail-label">Timestamp</div>
                  <div className="detail-value mono">{selectedTx.timestamp ? new Date(selectedTx.timestamp * 1000).toLocaleString() : "N/A"}</div>
                </div>
                <div className="detail-item"><div className="detail-label">TGNN Risk</div><div className="detail-value risk-highlight">{selectedTx.risk_score.toFixed(1)}%</div></div>
                {selectedTx.reasons && selectedTx.reasons.length > 0 && (
                  <div className="detail-item" style={{ flexDirection: "column", alignItems: "flex-start", marginTop: 12 }}>
                    <div className="detail-label" style={{ marginBottom: 4 }}>Detection Reasons</div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "var(--color-text-muted)" }}>
                      {selectedTx.reasons.map((r, i) => <li key={i} style={{ marginBottom: 2 }}>{r}</li>)}
                    </ul>
                  </div>
                )}
              </div>
              {selectedTx.case_id && (
                <div className="case-actions">
                  <button className="action-btn action-reject" onClick={() => handleReview(selectedTx.case_id!, "REJECTED")}>
                    <XCircle size={12} />Confirm Fraud
                  </button>
                  <button className="action-btn action-approve" onClick={() => handleReview(selectedTx.case_id!, "APPROVED")}>
                    <CheckCircle size={12} />False Positive
                  </button>
                  <button className="action-btn action-escalate" onClick={() => handleReview(selectedTx.case_id!, "ESCALATED")}>
                    <AlertCircle size={12} />Escalate
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
