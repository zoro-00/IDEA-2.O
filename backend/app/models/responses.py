# ============================================================
# STAR — Pydantic Response Models
# ============================================================
from __future__ import annotations

from typing import Any, Dict, List, Optional
from pydantic import BaseModel


# ─── Risk Enums (mirrored from frontend types) ────────────────
RISK_LEVELS = ("normal", "monitoring", "moderate", "high", "critical")


class FeatureContribution(BaseModel):
    feature: str
    label: str
    value: float
    normalized_score: float
    risk_level: str
    description: str


class IFScoreResponse(BaseModel):
    account_id: str
    raw_score: float          # isolation forest raw output (-1 to 1, more negative = more anomalous)
    risk_score: float         # 0-100 normalised
    risk_level: str
    threshold: float
    is_anomalous: bool
    top_features: List[FeatureContribution]
    inference_ms: float


class TGNNScoreResponse(BaseModel):
    fraud_probability: float  # 0.0 – 1.0
    fraud_score: float        # 0-100
    risk_level: str
    is_suspicious: bool
    attention_layers: int
    edge_scores: List[float]  # per-edge fraud probabilities
    inference_ms: float


class RuleHitResponse(BaseModel):
    rule: str
    severity: str             # low | medium | high | critical
    description: str
    score_contribution: float
    evidence: Dict[str, Any]


class FusedRiskResponse(BaseModel):
    account_id: Optional[str]
    final_score: float        # 0-100
    risk_level: str
    breakdown: Dict[str, float]  # {"isolation_forest": x, "tgnn": y, "rules": z}
    top_signals: List[str]
    explanation: str
    alert_generated: bool
    alert_id: Optional[str]
    if_score: Optional[IFScoreResponse]
    tgnn_score: Optional[TGNNScoreResponse]
    rule_hits: List[RuleHitResponse]
    total_inference_ms: float


class AlertResponse(BaseModel):
    id: str
    type: str
    severity: str
    score: float
    entities: List[str]
    entity_count: int
    amount: str
    amount_raw: float
    time: str
    timestamp: float
    description: str
    status: str
    assignee: Optional[str]
    tags: List[str]
    related_transactions: List[str]
    graph_path: Optional[List[str]]
    if_score: Optional[float]
    tgnn_score: Optional[float]
    rule_hits: List[str]


class NodeResponse(BaseModel):
    id: str
    name: str
    risk: float
    anomaly_score: float
    risk_level: str
    community: int
    type: str
    flagged: bool
    x: Optional[float]
    y: Optional[float]
    size: Optional[float]


class EdgeResponse(BaseModel):
    source: str
    target: str
    amount: float
    suspicious: bool
    type: str
    weight: float
    fraud_probability: Optional[float]


class GraphDataResponse(BaseModel):
    nodes: List[NodeResponse]
    links: List[EdgeResponse]
    total_nodes: int
    total_edges: int
    suspicious_edges: int


class TraversalPathResponse(BaseModel):
    nodes: List[str]
    edges: List[Dict]
    total_amount: float
    hops: int
    is_circular: bool
    risk_score: float
    path_explanation: str


class AIMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    timestamp: str
    metadata: Optional[Dict] = None


class SARResponse(BaseModel):
    id: str
    subject: str
    account_id: str
    narrative: str
    risk_score: float
    gnn_score: float
    entity_count: int
    total_amount: float
    date_range: str
    pattern: str
    status: str
    created_at: str


class ServiceStatus(BaseModel):
    name: str
    status: str           # online | degraded | offline
    latency_ms: Optional[float]
    details: Optional[str]


class SystemHealthResponse(BaseModel):
    overall: str          # healthy | degraded | unhealthy
    services: List[ServiceStatus]
    uptime_seconds: float
    version: str = "1.0.0"


class ModelInfoResponse(BaseModel):
    isolation_forest: Dict[str, Any]
    tgnn: Dict[str, Any]


class MetricsResponse(BaseModel):
    transactions_scored: int
    alerts_generated: int
    avg_if_latency_ms: float
    avg_tgnn_latency_ms: float
    avg_fusion_latency_ms: float
    active_ws_connections: int
    uptime_seconds: float


# ─── WebSocket Payload Types ──────────────────────────────────
class WSTransactionPayload(BaseModel):
    type: str = "transaction"
    data: Dict[str, Any]


class WSAlertPayload(BaseModel):
    type: str = "alert"
    data: AlertResponse


class WSGraphUpdatePayload(BaseModel):
    type: str = "graph_update"
    nodes: List[NodeResponse]
    edges: List[EdgeResponse]


class WSSystemStatusPayload(BaseModel):
    type: str = "system_status"
    data: SystemHealthResponse
