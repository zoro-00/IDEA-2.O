# ============================================================
# STAR — Transaction Stream Manager
# Background loop: generates txns → full pipeline → broadcasts
# ============================================================
from __future__ import annotations

import asyncio
import logging
import random
import time
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from app.core.config import settings
from app.models.requests import RawTransactionRequest
from app.websocket.connection_manager import graph_manager, stream_manager

logger = logging.getLogger(__name__)

# ── Demo Account Pool ─────────────────────────────────────────
ACCOUNT_POOL = [
    "ACCT-1001", "ACCT-1002", "ACCT-1003", "ACCT-1004", "ACCT-1005",
    "ACCT-2001", "ACCT-2002", "ACCT-2003", "SHELL-A", "SHELL-B",
    "ACCT-3001", "ACCT-3002", "ACCT-3003", "OFFSHORE-1", "ACCT-4001",
]

CURRENCIES = ["USD", "EUR", "GBP", "CHF", "AED"]
FORMATS = ["SWIFT", "WIRE", "ACH", "FEDWIRE", "RTGS"]

# Known suspicious accounts for seeding fraud scenarios
SUSPICIOUS_ACCOUNTS = {"SHELL-A", "SHELL-B", "OFFSHORE-1"}


def _random_transaction(suspicious_override: bool = False) -> RawTransactionRequest:
    is_sus = suspicious_override or random.random() > 0.85
    src = random.choice(ACCOUNT_POOL)
    dst = random.choice([a for a in ACCOUNT_POOL if a != src])

    if is_sus:
        src = random.choice(list(SUSPICIOUS_ACCOUNTS))
        amount = random.uniform(8_500, 9_800)  # structuring range
    else:
        amounts = [1_200, 4_500, 15_000, 48_000, 3_400, 9_200]
        amount = random.choice(amounts) + random.uniform(0, 499)

    return RawTransactionRequest(
        id=f"TXN-{str(uuid.uuid4())[:8].upper()}",
        from_account=src,
        to_account=dst,
        amount=round(amount, 2),
        currency=random.choice(CURRENCIES),
        payment_format=random.choice(FORMATS),
        timestamp=time.time(),
    )


async def run_pipeline_on_transaction(
    tx: RawTransactionRequest,
) -> Optional[Dict]:
    """
    Execute the full STAR pipeline on a single transaction:
    Feature Engineering → IF → TGNN → Rules → Fusion → Alert
    Returns the WS payload dict or None if below threshold.
    """
    from app.services.feature_engineering import feature_engineering_service
    from app.services.graph_builder import graph_builder_service
    from app.services.isolation_forest_service import isolation_forest_service
    from app.services.tgnn_service import tgnn_service
    from app.services.rule_engine import rule_engine
    from app.services.risk_fusion import risk_fusion_engine
    from app.services.neo4j_service import neo4j_service

    pipeline_start = time.perf_counter()

    # ── Step 1: Feature Engineering ───────────────────────────
    context_stats = feature_engineering_service.compute_context_stats([tx])
    if_features = feature_engineering_service.compute_if_features(
        tx.from_account, [tx]
    )

    # ── Step 2: Update Graph ───────────────────────────────────
    neo4j_service.upsert_transaction(
        tx_id=tx.id,
        from_account=tx.from_account,
        to_account=tx.to_account,
        amount=tx.amount,
        currency=tx.currency,
        payment_format=tx.payment_format,
        timestamp=tx.timestamp,
    )

    # ── Step 3: Isolation Forest Inference ────────────────────
    if_score = None
    if isolation_forest_service.is_loaded:
        try:
            if_score = isolation_forest_service.score(tx.from_account, if_features)
        except Exception as e:
            logger.warning("IF scoring failed: %s", e)

    # ── Step 4: TGNN Inference ─────────────────────────────────
    tgnn_score = None
    if tgnn_service.is_loaded:
        try:
            src_feat, dst_feat, edge_feat = graph_builder_service.build_single_transaction_inputs(
                tx, context_stats
            )
            tgnn_score = tgnn_service.score_transaction(src_feat, dst_feat, edge_feat)
        except Exception as e:
            logger.warning("TGNN scoring failed: %s", e)

    # ── Step 5: Rule Engine ───────────────────────────────────
    rule_hits = rule_engine.analyze(tx.from_account, [tx])

    # ── Step 6: Risk Fusion ───────────────────────────────────
    fused = risk_fusion_engine.fuse(
        account_id=tx.from_account,
        if_score=if_score,
        tgnn_score=tgnn_score,
        rule_hits=rule_hits,
    )

    pipeline_ms = (time.perf_counter() - pipeline_start) * 1000

    # ── Step 7: Build payload ─────────────────────────────────
    now = datetime.now(timezone.utc)
    tx_payload = {
        "type": "transaction",
        "data": {
            "id": tx.id,
            "from": tx.from_account,
            "to": tx.to_account,
            "amount": tx.amount,
            "currency": tx.currency,
            "timestamp": now.isoformat(),
            "risk": fused.risk_level,
            "anomalyScore": (fused.breakdown.get("tgnn_raw_score", 0) / 100),
            "flags": [h.rule for h in rule_hits],
            "jurisdiction": "US",
            "final_score": fused.final_score,
            "pipeline_ms": round(pipeline_ms, 1),
        },
    }
    await stream_manager.broadcast(tx_payload)

    # ── Step 8: Broadcast alert if threshold crossed ──────────
    if fused.alert_generated:
        from app.api.routes.alerts import add_alert
        
        alert_type = rule_hits[0].rule if rule_hits else "gnn_flagged"
        alert_payload = {
            "type": "alert",
            "data": {
                "id": fused.alert_id,
                "type": alert_type,
                "severity": fused.risk_level,
                "score": fused.final_score,
                "entities": [tx.from_account, tx.to_account],
                "entity_count": 2,
                "amount": f"${tx.amount:,.2f}",
                "amount_raw": tx.amount,
                "time": now.strftime("%H:%M:%S"),
                "timestamp": time.time(),
                "description": fused.explanation,
                "status": "open",
                "tags": [h.rule for h in rule_hits],
                "related_transactions": [tx.id],
                "if_score": if_score.risk_score if if_score else None,
                "tgnn_score": tgnn_score.fraud_score if tgnn_score else None,
                "rule_hits": [h.rule for h in rule_hits],
                "breakdown": fused.breakdown,
                "top_signals": fused.top_signals,
            },
        }
        add_alert(alert_payload["data"])
        await stream_manager.broadcast(alert_payload)

        # ── Step 9: Graph update broadcast ────────────────────
        graph_update = {
            "type": "graph_update",
            "nodes": [
                {
                    "id": tx.from_account,
                    "flagged": True,
                    "risk": fused.final_score,
                    "risk_level": fused.risk_level,
                    "anomaly_score": tgnn_score.fraud_probability if tgnn_score else 0,
                }
            ],
            "edges": [
                {
                    "source": tx.from_account,
                    "target": tx.to_account,
                    "suspicious": True,
                    "fraud_probability": tgnn_score.fraud_probability if tgnn_score else 0,
                    "amount": tx.amount,
                }
            ],
        }
        await graph_manager.broadcast(graph_update)

        return alert_payload

    return None


class TransactionStreamManager:
    """
    Background async task that generates synthetic transactions
    and runs the full STAR pipeline on each.
    """

    def __init__(self) -> None:
        self._running = False
        self._task: Optional[asyncio.Task] = None
        self._stats = {
            "transactions_processed": 0,
            "alerts_generated": 0,
            "start_time": 0.0,
        }

    async def start(self) -> None:
        """Start the background streaming loop."""
        if self._running:
            return
        self._running = True
        self._stats["start_time"] = time.time()
        self._task = asyncio.create_task(self._loop())
        logger.info("✅ Transaction stream loop started")

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Transaction stream loop stopped")

    async def _loop(self) -> None:
        interval = settings.STREAM_INTERVAL_MS / 1000.0
        fraud_cycle = 0
        while self._running:
            try:
                # Every 10th transaction, seed a suspicious one
                fraud_cycle += 1
                is_fraud = fraud_cycle % 10 == 0
                tx = _random_transaction(suspicious_override=is_fraud)

                alert = await run_pipeline_on_transaction(tx)
                self._stats["transactions_processed"] += 1
                if alert:
                    self._stats["alerts_generated"] += 1

                await asyncio.sleep(interval)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Stream loop error: %s", e)
                await asyncio.sleep(5)

    def get_stats(self) -> Dict:
        return {
            **self._stats,
            "uptime_seconds": time.time() - self._stats["start_time"],
        }

    @property
    def is_running(self) -> bool:
        return self._running


# ── Singleton ─────────────────────────────────────────────────
transaction_stream_manager = TransactionStreamManager()
