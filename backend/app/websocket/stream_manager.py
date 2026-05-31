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
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.models.requests import RawTransactionRequest
from app.websocket.connection_manager import graph_manager, stream_manager

logger = logging.getLogger(__name__)

# ── Replay Configuration ────────────────────────────────────────
# We now rely entirely on the real IBM AML datasets loaded by InferenceService



async def run_pipeline_on_transaction(
    idx: int,
    tx_obj: Any,
    node_state: Dict
) -> Optional[Dict]:
    """
    Execute the full STAR pipeline on a REAL transaction from the CSV:
    Feature Engineering → IF → TGNN → Rules → Fusion → Alert
    Returns the WS payload dict or None if below threshold.
    """
    from app.services.feature_engineering import feature_engineering_service
    from app.services.graph_builder import graph_builder_service
    from app.services.isolation_forest_service import isolation_forest_service
    from app.services.rule_engine import rule_engine
    from app.services.risk_fusion import risk_fusion_engine
    from app.services.neo4j_service import neo4j_service
    from app.services.tgnn_service import inference_service, CURRENCY_LABELS, PAYMENT_FORMAT_LABELS
    from app.websocket.connection_manager import inference_manager
    from app.models.responses import TGNNScoreResponse

    pipeline_start = time.perf_counter()

    # Convert the TGNN Transaction dataclass to our RawTransactionRequest
    sender_name = inference_service.SCENARIO["entity_names"][tx_obj.sender_idx]
    receiver_name = inference_service.SCENARIO["entity_names"][tx_obj.receiver_idx]
    
    currency_str = CURRENCY_LABELS[tx_obj.sent_currency] if tx_obj.sent_currency < len(CURRENCY_LABELS) else "USD"
    format_str = PAYMENT_FORMAT_LABELS[tx_obj.payment_format] if tx_obj.payment_format < len(PAYMENT_FORMAT_LABELS) else "WIRE"

    tx = RawTransactionRequest(
        id=f"TX_{idx:04d}",
        from_account=sender_name,
        to_account=receiver_name,
        amount=tx_obj.amount_sent,
        currency=currency_str,
        payment_format=format_str,
        timestamp=tx_obj.timestamp,
    )

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

    # ── Step 4: TGNN Inference (Precomputed via CSV) ─────────────
    tgnn_score = None
    tgnn_data = None
    if inference_service.is_loaded:
        try:
            # We use the exact precomputed scores for the CSV scenario, cascading with Isolation Forest
            tgnn_data = inference_service.score_transaction(idx, tx_obj, node_state)
            
            # If IF flagged this strongly, we can explicitly add an explainability reason!
            if if_score and if_score.is_anomalous:
                tgnn_data["reasons"].append(f"Behavioral Anomaly cascaded from Isolation Forest ({if_score.risk_score:.0f}/100)")
            
            tgnn_score = TGNNScoreResponse(
                fraud_probability=tgnn_data["gnn_score"],
                fraud_score=tgnn_data["risk_score"],
                risk_level="high" if tgnn_data["is_alert"] else "low",
                is_suspicious=tgnn_data["is_alert"],
                attention_layers=2,
                edge_scores=[tgnn_data["att_score"]],
                inference_ms=10.0,
            )
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

    # ── Step 7.5: TGNN Dynamic Dashboard Broadcast ─────────────
    if tgnn_data:
        tgnn_type = "alert" if tgnn_data["is_alert"] else "transaction"
        tx_type_str = "Normal"
        for r in tgnn_data["reasons"]:
            if "Dispersion" in r: tx_type_str = "Dispersion"
            elif "Gathering" in r: tx_type_str = "Gathering"
            elif "Layering" in r or "Pass-Through" in r: tx_type_str = "Layering"
            elif "Structuring" in r: tx_type_str = "Structuring"

        cycle_path = []
        cycle_edges = []
        case_id = f"CASE_{tx.id}"
        
        if tgnn_data["is_alert"]:
            tx_type_str = tx_type_str if tx_type_str != "Normal" else "Anomaly"
            # Dynamic Cycle Detection
            async with neo4j_service._async_driver.session() as session:
                result = await session.run("""
                    MATCH path = (r:Account {id: $r_id})-[:TRANSACT*1..3]->(s:Account {id: $s_id})
                    WHERE $r_id <> $s_id
                    RETURN
                        [n IN nodes(path) | n.id] AS cycle_nodes,
                        [rel IN relationships(path) | rel.tx_id] AS cycle_edges
                    LIMIT 1
                """, r_id=tx.to_account, s_id=tx.from_account)
                record = await result.single()
                if record is not None:
                    cycle_path = [tx.from_account] + record["cycle_nodes"]
                    cycle_edges = record["cycle_edges"] + [tx.id]
                    tgnn_data["reasons"].append("Circular Routing Typology Detected")
                    tx_type_str = "Circular"

        tgnn_payload = {
            "type": tgnn_type,
            "data": {
                "tx_id": tx.id,
                "case_id": case_id if tgnn_data["is_alert"] else None,
                "sender": tx.from_account,
                "receiver": tx.to_account,
                "amount": tx.amount,
                "tx_type": tx_type_str,
                "risk_score": tgnn_data["risk_score"],
                "currency": tx.currency,
                "payment_format": tx.payment_format,
                "timestamp": int(tx.timestamp),
                "reasons": tgnn_data["reasons"],
                "cycle_path": cycle_path,
                "cycle_edges": cycle_edges,
                "is_fraud_gt": tx_obj.is_fraud == 1,
            }
        }
        await inference_manager.broadcast(tgnn_payload)

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
        
        from app.services.tgnn_service import inference_service
        
        # Wait until InferenceService has loaded the CSV scenario
        while not getattr(inference_service, "is_loaded", False):
            await asyncio.sleep(1.0)
            
        scenario_txs = inference_service.SCENARIO["transactions"]
        total_txs = len(scenario_txs)
        
        node_state = {}
        
        # We loop infinitely over the CSV to keep the live dashboard going
        while self._running:
            try:
                for idx, tx_obj in enumerate(scenario_txs):
                    if not self._running:
                        break
                        
                    # Maintain rule-engine state
                    if tx_obj.sender_idx not in node_state:
                        node_state[tx_obj.sender_idx] = {"in": 0, "out": 0}
                    if tx_obj.receiver_idx not in node_state:
                        node_state[tx_obj.receiver_idx] = {"in": 0, "out": 0}
                        
                    node_state[tx_obj.sender_idx]["out"] += 1
                    node_state[tx_obj.receiver_idx]["in"] += 1

                    alert = await run_pipeline_on_transaction(idx, tx_obj, node_state)
                    
                    self._stats["transactions_processed"] += 1
                    if alert:
                        self._stats["alerts_generated"] += 1

                    await asyncio.sleep(interval)
                    
                # Reset node_state if we loop
                node_state.clear()
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
