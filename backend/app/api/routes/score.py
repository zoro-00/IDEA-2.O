# ============================================================
# STAR — Score API Routes
# /score/account, /score/transaction, /score/graph
# ============================================================
from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, HTTPException

from app.models.requests import (
    ScoreAccountRequest,
    ScoreGraphRequest,
    ScoreTransactionRequest,
)
from app.models.responses import (
    FeatureContribution,
    FusedRiskResponse,
    IFScoreResponse,
    RuleHitResponse,
    TGNNScoreResponse,
)
from app.services.feature_engineering import feature_engineering_service
from app.services.graph_builder import graph_builder_service
from app.services.isolation_forest_service import isolation_forest_service
from app.services.neo4j_service import neo4j_service
from app.services.risk_fusion import risk_fusion_engine
from app.services.rule_engine import rule_engine

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/score", tags=["Scoring"])


@router.post("/account", response_model=FusedRiskResponse)
async def score_account(request: ScoreAccountRequest) -> FusedRiskResponse:
    """
    Score an account using Isolation Forest + TGNN + Rule Engine fusion.
    Accepts pre-computed AML features dict (29 features).
    """
    features = request.features.model_dump()

    # ── Isolation Forest ──────────────────────────────────────
    if_score = None
    if isolation_forest_service.is_loaded:
        try:
            if_score = isolation_forest_service.score(request.account_id, features)
        except Exception as e:
            logger.error("IF scoring error: %s", e)

    # ── Rule Engine (no transactions provided, skip) ──────────
    rule_hits = []

    # ── Graph metrics from Neo4j/NetworkX ────────────────────
    graph_metrics = neo4j_service.get_graph_metrics(request.account_id)

    # ── TGNN: single-node query without transactions ──────────
    tgnn_score = None

    # ── Risk Fusion ───────────────────────────────────────────
    fused = risk_fusion_engine.fuse(
        account_id=request.account_id,
        if_score=if_score,
        tgnn_score=tgnn_score,
        rule_hits=rule_hits,
    )

    return _build_fused_response(request.account_id, fused)


@router.post("/transaction", response_model=FusedRiskResponse)
async def score_transaction(request: ScoreTransactionRequest) -> FusedRiskResponse:
    """
    Full pipeline score for a single transaction with context.
    Runs feature engineering, IF, TGNN, rules, and fusion.
    """
    tx = request.transaction
    all_txns = [tx] + request.context_transactions

    # ── Feature Engineering ───────────────────────────────────
    context_stats = feature_engineering_service.compute_context_stats(all_txns)
    if_features = feature_engineering_service.compute_if_features(
        tx.from_account, all_txns
    )
    graph_metrics = neo4j_service.get_graph_metrics(tx.from_account)
    if graph_metrics:
        if_features.update(graph_metrics)

    # ── IF Scoring ────────────────────────────────────────────
    if_score = None
    if isolation_forest_service.is_loaded:
        try:
            if_score = isolation_forest_service.score(tx.from_account, if_features)
        except Exception as e:
            logger.error("IF error: %s", e)

    # ── TGNN Scoring ──────────────────────────────────────────
    # NOTE: TGNN inference now runs through the dedicated /ws/inference
    # WebSocket pipeline (TGNN Demo page). The /score routes use
    # Isolation Forest + Rule Engine for per-transaction scoring.
    tgnn_score = None

    # ── Rule Engine ───────────────────────────────────────────
    rule_hits = rule_engine.analyze(tx.from_account, all_txns)

    # ── Update graph ──────────────────────────────────────────
    neo4j_service.upsert_transaction(
        tx_id=tx.id,
        from_account=tx.from_account,
        to_account=tx.to_account,
        amount=tx.amount,
        currency=tx.currency,
        payment_format=tx.payment_format,
        timestamp=tx.timestamp,
    )

    # ── Fusion ────────────────────────────────────────────────
    fused = risk_fusion_engine.fuse(
        account_id=tx.from_account,
        if_score=if_score,
        tgnn_score=tgnn_score,
        rule_hits=rule_hits,
    )

    return _build_fused_response(tx.from_account, fused)


@router.post("/graph", response_model=FusedRiskResponse)
async def score_graph(request: ScoreGraphRequest) -> FusedRiskResponse:
    """
    Run full GATe TGNN inference on a transaction graph.
    Returns per-edge fraud probabilities + fused risk score.
    """
    # NOTE: Full graph TGNN inference now runs through /ws/inference
    # Use the TGNN Demo page (/tgnn) for GATe graph-level scoring.
    raise HTTPException(503, "Full-graph TGNN scoring moved to /ws/inference (TGNN Demo page)")


def _build_fused_response(account_id, fused) -> FusedRiskResponse:
    """Convert internal FusedRisk → API response model."""
    if_resp = None
    if fused.if_score:
        s = fused.if_score
        if_resp = IFScoreResponse(
            account_id=account_id or "",
            raw_score=s.raw_score,
            risk_score=s.risk_score,
            risk_level=s.risk_level,
            threshold=s.threshold,
            is_anomalous=s.is_anomalous,
            top_features=[FeatureContribution(**f) for f in s.top_features],
            inference_ms=s.inference_ms,
        )

    tgnn_resp = None
    if fused.tgnn_score:
        t = fused.tgnn_score
        tgnn_resp = TGNNScoreResponse(
            fraud_probability=t.fraud_probability,
            fraud_score=t.fraud_score,
            risk_level=t.risk_level,
            is_suspicious=t.is_suspicious,
            attention_layers=t.attention_layers,
            edge_scores=t.edge_scores,
            inference_ms=t.inference_ms,
        )

    rule_resp = [
        RuleHitResponse(
            rule=h.rule,
            severity=h.severity,
            description=h.description,
            score_contribution=h.score_contribution,
            evidence=h.evidence,
        )
        for h in fused.rule_hits
    ]

    return FusedRiskResponse(
        account_id=account_id,
        final_score=fused.final_score,
        risk_level=fused.risk_level,
        breakdown=fused.breakdown,
        top_signals=fused.top_signals,
        explanation=fused.explanation,
        alert_generated=fused.alert_generated,
        alert_id=fused.alert_id,
        if_score=if_resp,
        tgnn_score=tgnn_resp,
        rule_hits=rule_resp,
        total_inference_ms=fused.total_inference_ms,
    )
