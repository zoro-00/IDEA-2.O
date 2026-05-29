# ============================================================
# STAR — Internal Dataclasses
# Not exposed to API — used between services
# ============================================================
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class IFScore:
    raw_score: float
    risk_score: float          # 0-100
    risk_level: str
    is_anomalous: bool
    threshold: float
    top_features: List[Dict[str, Any]] = field(default_factory=list)
    inference_ms: float = 0.0


@dataclass
class TGNNScore:
    fraud_probability: float
    fraud_score: float         # 0-100
    risk_level: str
    is_suspicious: bool
    attention_layers: int = 0
    edge_scores: List[float] = field(default_factory=list)
    inference_ms: float = 0.0


@dataclass
class RuleHit:
    rule: str
    severity: str              # low | medium | high | critical
    description: str
    score_contribution: float  # how much this rule adds to the risk score
    evidence: Dict[str, Any] = field(default_factory=dict)


@dataclass
class FusedRisk:
    final_score: float
    risk_level: str
    breakdown: Dict[str, float]
    top_signals: List[str]
    explanation: str
    alert_generated: bool = False
    alert_id: Optional[str] = None
    if_score: Optional[IFScore] = None
    tgnn_score: Optional[TGNNScore] = None
    rule_hits: List[RuleHit] = field(default_factory=list)
    total_inference_ms: float = 0.0
