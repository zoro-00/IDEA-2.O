# ============================================================
# STAR — Pydantic Request Models
# ============================================================
from __future__ import annotations

from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class AMLFeaturesRequest(BaseModel):
    """The 29 behavioral features fed to Isolation Forest."""
    txn_count: float = 0.0
    avg_amount: float = 0.0
    structuring_ratio: float = 0.0
    fan_out_ratio: float = 0.0
    pagerank: float = 0.0
    out_degree: float = 0.0
    txn_velocity: float = 0.0
    night_ratio: float = 0.0
    cross_bank_ratio: float = 0.0
    dormancy_days: float = 0.0
    burst_score: float = 0.0
    layering_depth: float = 0.0
    circular_flag: float = 0.0
    geo_entropy: float = 0.0
    counterparty_diversity: float = 0.0
    amount_variance: float = 0.0
    hour_entropy: float = 0.0
    weekend_ratio: float = 0.0
    rapid_succession: float = 0.0
    mule_score: float = 0.0
    shell_indicator: float = 0.0
    smurfing_flag: float = 0.0
    reactivation_score: float = 0.0
    community_centrality: float = 0.0
    betweenness: float = 0.0
    closeness: float = 0.0
    clustering_coeff: float = 0.0
    graph_anomaly_score: float = 0.0
    unique_receivers: float = 0.0


class ScoreAccountRequest(BaseModel):
    account_id: str
    features: AMLFeaturesRequest
    include_explanation: bool = True


class RawTransactionRequest(BaseModel):
    """A single raw transaction for scoring."""
    id: str
    from_account: str
    to_account: str
    amount: float
    currency: str = "USD"
    payment_format: str = "SWIFT"
    timestamp: Optional[float] = None  # Unix epoch; defaults to now


class ScoreTransactionRequest(BaseModel):
    transaction: RawTransactionRequest
    context_transactions: List[RawTransactionRequest] = Field(
        default_factory=list,
        description="Recent transactions for this account used to build graph",
    )


class ScoreGraphRequest(BaseModel):
    transactions: List[RawTransactionRequest]
    account_id: Optional[str] = None


class AlertUpdateRequest(BaseModel):
    status: str  # open | investigating | escalated | closed | sar_filed
    assignee: Optional[str] = None
    note: Optional[str] = None


class CopilotQueryRequest(BaseModel):
    message: str
    session_id: str = "default"
    context: Optional[Dict] = None


class SARRequest(BaseModel):
    account_id: str
    alert_ids: List[str]
    investigation_notes: Optional[str] = None


class GraphQueryRequest(BaseModel):
    cypher: str
    parameters: Optional[Dict] = None
