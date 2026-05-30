# ============================================================
# STAR — Risk Fusion Engine
# Combines Isolation Forest + TGNN + Rules → final risk score
# ============================================================
from __future__ import annotations

import logging
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.core.config import settings
from app.models.internal import FusedRisk, IFScore, RuleHit, TGNNScore

logger = logging.getLogger(__name__)


class RiskFusionEngine:
    """
    The most important service in STAR.

    Weighted fusion formula:
        final_score = IF_WEIGHT * if_score
                    + TGNN_WEIGHT * tgnn_score
                    + RULE_WEIGHT * rule_score

    Default weights (from config):
        IF:   0.35
        TGNN: 0.40
        RULE: 0.25

    Output:
        FusedRisk with final_score (0-100), risk_level,
        breakdown dict, top_signals, human-readable explanation,
        and alert metadata if threshold crossed.
    """

    def __init__(self) -> None:
        self._alert_threshold = settings.RISK_ALERT_THRESHOLD
        self._if_weight = settings.IF_WEIGHT
        self._tgnn_weight = settings.TGNN_WEIGHT
        self._rule_weight = settings.RULE_WEIGHT

    def fuse(
        self,
        account_id: Optional[str] = None,
        if_score: Optional[IFScore] = None,
        tgnn_score: Optional[TGNNScore] = None,
        rule_hits: Optional[List[RuleHit]] = None,
    ) -> FusedRisk:
        """
        Combine all available signals into a final risk assessment.
        Any missing signal defaults to 0 (its weight still applies).
        """
        t0 = time.perf_counter()
        rule_hits = rule_hits or []

        # ── Extract individual scores ──────────────────────────
        if_val = if_score.risk_score if if_score else 0.0
        tgnn_val = tgnn_score.fraud_score if tgnn_score else 0.0

        from app.services.rule_engine import rule_engine
        rule_val = rule_engine.compute_rule_score(rule_hits)

        # ── Weighted fusion ────────────────────────────────────
        if_contrib = self._if_weight * if_val
        tgnn_contrib = self._tgnn_weight * tgnn_val
        rule_contrib = self._rule_weight * rule_val

        final_score = round(if_contrib + tgnn_contrib + rule_contrib, 2)
        final_score = max(0.0, min(100.0, final_score))

        # ── Risk level ────────────────────────────────────────
        risk_level = self._score_to_level(final_score)

        # ── Breakdown dict ─────────────────────────────────────
        breakdown: Dict[str, float] = {
            "isolation_forest": round(if_contrib, 2),
            "tgnn": round(tgnn_contrib, 2),
            "rules": round(rule_contrib, 2),
            "if_raw_score": round(if_val, 2),
            "tgnn_raw_score": round(tgnn_val, 2),
            "rule_raw_score": round(rule_val, 2),
        }

        # ── Top signals ────────────────────────────────────────
        top_signals = self._build_top_signals(if_score, tgnn_score, rule_hits, final_score)

        # ── Human explanation ──────────────────────────────────
        explanation = self._build_explanation(
            account_id, final_score, risk_level,
            if_score, tgnn_score, rule_hits, breakdown
        )

        # ── Alert generation ───────────────────────────────────
        alert_generated = final_score >= self._alert_threshold
        alert_id = str(uuid.uuid4())[:8].upper() if alert_generated else None

        elapsed_ms = (time.perf_counter() - t0) * 1000

        return FusedRisk(
            final_score=final_score,
            risk_level=risk_level,
            breakdown=breakdown,
            top_signals=top_signals,
            explanation=explanation,
            alert_generated=alert_generated,
            alert_id=f"ALT-{alert_id}" if alert_id else None,
            if_score=if_score,
            tgnn_score=tgnn_score,
            rule_hits=rule_hits,
            total_inference_ms=round(elapsed_ms, 2),
        )

    # ── Private helpers ────────────────────────────────────────

    def _build_top_signals(
        self,
        if_score: Optional[IFScore],
        tgnn_score: Optional[TGNNScore],
        rule_hits: List[RuleHit],
        final_score: float,
    ) -> List[str]:
        signals = []

        if tgnn_score and tgnn_score.fraud_score >= 50:
            signals.append(
                f"GNN fraud probability {tgnn_score.fraud_probability:.1%}"
            )

        if if_score and if_score.is_anomalous:
            top = if_score.top_features[:2] if if_score.top_features else []
            for f in top:
                signals.append(f"Anomalous {f['label']}")

        for hit in sorted(rule_hits, key=lambda h: h.score_contribution, reverse=True)[:3]:
            signals.append(hit.description[:80])

        if not signals:
            signals.append(f"Composite risk score {final_score:.0f}/100")

        return signals[:5]

    def _build_explanation(
        self,
        account_id: Optional[str],
        score: float,
        level: str,
        if_score: Optional[IFScore],
        tgnn_score: Optional[TGNNScore],
        rule_hits: List[RuleHit],
        breakdown: Dict[str, float],
    ) -> str:
        parts = []

        entity = account_id or "this account"
        parts.append(
            f"STAR assessed {entity} with a final risk score of {score:.0f}/100 ({level.upper()})."
        )

        if if_score:
            parts.append(
                f"Isolation Forest scored {if_score.risk_score:.0f}/100 "
                f"({'anomalous' if if_score.is_anomalous else 'normal'} behaviour)."
            )
        if tgnn_score:
            parts.append(
                f"GATe GNN graph intelligence returned {tgnn_score.fraud_probability:.1%} "
                f"fraud probability across transaction edges."
            )
        if rule_hits:
            rule_names = ", ".join(h.rule.replace("_", " ").title() for h in rule_hits[:3])
            parts.append(f"Rule engine flagged: {rule_names}.")

        if score >= 65:
            parts.append("⚠️ Alert threshold crossed. Case opened for analyst review.")

        return " ".join(parts)

    @staticmethod
    def _score_to_level(score: float) -> str:
        # Use centralized risk thresholds from config
        if score < settings.RISK_THRESHOLD_NORMAL:
            return "normal"
        if score < settings.RISK_THRESHOLD_MONITORING:
            return "monitoring"
        if score < settings.RISK_THRESHOLD_MODERATE:
            return "moderate"
        if score < settings.RISK_THRESHOLD_HIGH:
            return "high"
        return "critical"


# ── Singleton ─────────────────────────────────────────────────
risk_fusion_engine = RiskFusionEngine()
