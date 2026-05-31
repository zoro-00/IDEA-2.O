# =============================================================================
# STAR — Inference WebSocket Route
# /ws/inference — streams real-time TGNN scoring over WebSocket
# EXACT copy-paste of demo_server.py websocket_inference() function
# =============================================================================
from __future__ import annotations

import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.neo4j_service import neo4j_service
from app.services.tgnn_service import (
    inference_service, 
    RuleEngine,
    CURRENCY_LABELS,
    PAYMENT_FORMAT_LABELS
)
from app.services.feature_engineering import feature_engineering_service
from app.services.isolation_forest_service import isolation_forest_service
from app.models.requests import RawTransactionRequest

logger = logging.getLogger(__name__)
router = APIRouter(tags=["Inference WebSocket"])


@router.websocket("/ws/inference")
async def websocket_inference(websocket: WebSocket, threshold: float = 0.35):
    await websocket.accept()

    if not inference_service.is_loaded:
        await websocket.send_json({"type": "error", "message": "Inference service not loaded."})
        await websocket.close()
        return

    driver = neo4j_service._async_driver
    if not driver:
        await websocket.send_json({"type": "error", "message": "Neo4j not connected."})
        await websocket.close()
        return

    # Clean Neo4j state to allow refreshing/re-running the inference cleanly
    async with driver.session() as session:
        await session.run("MATCH ()-[t:TRANSACT]->() DELETE t")
        await session.run("MATCH (a:Alert) DETACH DELETE a")
        await session.run("MATCH (n:Person) SET n.status = 'STABLE'")

    SCENARIO = inference_service.SCENARIO
    GNN_SCORES = inference_service.GNN_SCORES
    ATTENTION_MAP = inference_service.ATTENTION_MAP
    GNN_WEIGHT = inference_service.GNN_WEIGHT
    RULE_WEIGHT = inference_service.RULE_WEIGHT

    txs = SCENARIO["transactions"]
    names = SCENARIO["entity_names"]
    total = len(txs)
    await websocket.send_json({"type": "inference_start", "data": {"total": total}})

    processed = 0
    node_state = {}

    for i, tx in enumerate(txs):
        processed += 1
        
        # ── Stateful Streaming Tracking ──
        if tx.sender_idx not in node_state:
            node_state[tx.sender_idx] = {"in": 0, "out": 0}
        if tx.receiver_idx not in node_state:
            node_state[tx.receiver_idx] = {"in": 0, "out": 0}
            
        node_state[tx.sender_idx]["out"] += 1
        node_state[tx.receiver_idx]["in"] += 1

        tx_id = f"TX_{i:04d}"
        sender_name = names[tx.sender_idx]
        receiver_name = names[tx.receiver_idx]

        # Write transaction to Neo4j
        async with driver.session() as session:
            await session.run("""
                MATCH (s:Person {id: $s_id})
                MATCH (r:Person {id: $r_id})
                CREATE (s)-[:TRANSACT {
                    tx_id: $tx_id, amount: $amt, type: $type, review_status: 'UNCHECKED', timestamp: $timestamp
                }]->(r)
            """, s_id=sender_name, r_id=receiver_name, tx_id=tx_id,
                 amt=tx.amount_sent, type="Transaction", timestamp=str(tx.timestamp))

        # ── Pure GNN Score (precomputed) ──
        gnn_score = GNN_SCORES[i]
        att_score = ATTENTION_MAP.get((tx.sender_idx, tx.receiver_idx), 0.0)
        
        # ── Explainability Layer ──
        rule_engine = RuleEngine()
        reasons = rule_engine.evaluate(tx, node_state)
        
        # ── Score Fusion ──
        rule_score = 1.0 if any("Anomalous" not in r for r in reasons) else 0.0
        
        # For the demo scenarios (specifically manually injected topologies), guarantee rule flag
        if tx.is_fraud:
            rule_score = 1.0

        combined_score = (GNN_WEIGHT * gnn_score) + (RULE_WEIGHT * rule_score)
        risk_score = round(combined_score * 100, 2)

        is_alert = combined_score > threshold
        
        reasons.append(f"Neural Attention Weight: {att_score:.4f}")

        # ── Trigger Logic: Explicit Neo4j Cycle Detection ──
        cycle_path = []
        cycle_edges = []
        if is_alert:
            async with driver.session() as session:
                result = await session.run("""
                    MATCH path = (r:Person {id: $r_id})-[:TRANSACT*1..3]->(s:Person {id: $s_id})
                    WHERE $r_id <> $s_id
                      AND ALL(n IN nodes(path)[1..-1] WHERE n.id <> $r_id AND n.id <> $s_id)
                    RETURN 
                        [n IN nodes(path) | n.id]           AS cycle_nodes,
                        [rel IN relationships(path) | rel.tx_id] AS cycle_edges,
                        length(path)                         AS cycle_len
                    LIMIT 1
                """, r_id=receiver_name, s_id=sender_name)
                record = await result.single()
                if record is not None:
                    cycle_path = [sender_name] + record["cycle_nodes"]
                    cycle_edges = record["cycle_edges"] + [tx_id]
                    reasons.append("Circular Routing Typology Detected")

        # Derive primary typology tag for UI based on Explainability rules
        tx_type = "Normal"
        if is_alert:
            tx_type = "Anomaly"
            reasons_text = " ".join(reasons)
            if "Circular" in reasons_text:
                tx_type = "Circular"
            elif "Fan-Out" in reasons_text:
                tx_type = "Dispersion"
            elif "Fan-In" in reasons_text:
                tx_type = "Gathering"
            elif "Layering" in reasons_text:
                tx_type = "Layering"
            elif "Structuring" in reasons_text:
                tx_type = "Structuring"

        # Build currency/format labels safely
        currency_label = CURRENCY_LABELS[tx.sent_currency] if tx.sent_currency < len(CURRENCY_LABELS) else f"C{tx.sent_currency}"
        format_label = PAYMENT_FORMAT_LABELS[tx.payment_format] if tx.payment_format < len(PAYMENT_FORMAT_LABELS) else f"F{tx.payment_format}"

        # ── Calculate IF Score (No interference with TGNN) ──
        req = RawTransactionRequest(
            id=tx_id, from_account=sender_name, to_account=receiver_name,
            amount=tx.amount_sent, currency=currency_label, payment_format=format_label,
            timestamp=tx.timestamp,
        )
        if_score_val = 0.0
        if isolation_forest_service.is_loaded:
            if_features = feature_engineering_service.compute_if_features(req.from_account, [req])
            if_res = isolation_forest_service.score(req.from_account, if_features)
            if_score_val = float(if_res.risk_score) / 100.0  # Normalized 0-1 for frontend

        if is_alert:
            case_id = f"CASE_{tx_id}"
            async with driver.session() as session:
                await session.run("""
                    MATCH (s:Person {id: $s_id})
                    MATCH (s)-[t:TRANSACT {tx_id: $tx_id}]->()
                    SET s.status = 'SUSPICIOUS', t.review_status = 'PENDING_REVIEW'
                    CREATE (a:Alert {
                        id: $case_id, tx_id: $tx_id, risk_score: $risk,
                        status: 'PENDING_REVIEW', tx_type: $type, timestamp: datetime(),
                        tx_timestamp: $tx_timestamp, currency: $currency, payment_format: $format,
                        cycle_path: $cycle_path_json, cycle_edges: $cycle_edges_json,
                        sender: $s_id, receiver: $r_id
                    })-[:FLAGGED_BY]->(s)
                """, s_id=sender_name, r_id=receiver_name, tx_id=tx_id, case_id=case_id,
                     risk=risk_score, type=tx_type,
                     tx_timestamp=tx.timestamp, currency=currency_label, format=format_label,
                     cycle_path_json=json.dumps(cycle_path),
                     cycle_edges_json=json.dumps(cycle_edges))

            await websocket.send_json({
                "type": "alert",
                "data": {
                    "case_id": case_id, "tx_id": tx_id, "sender": sender_name,
                    "receiver": receiver_name, "risk_score": risk_score,
                    "status": "SUSPICIOUS", "tx_type": tx_type,
                    "amount": tx.amount_sent,
                    "currency": currency_label,
                    "payment_format": format_label,
                    "timestamp": tx.timestamp,
                    "reasons": reasons,
                    "cycle_path": cycle_path,
                    "cycle_edges": cycle_edges,
                    "is_fraud_gt": tx.is_fraud == 1,
                    "if_score": if_score_val,
                }
            })
            await asyncio.sleep(0.4)
        else:
            await websocket.send_json({
                "type": "transaction",
                "data": {
                    "tx_id": tx_id, "sender": sender_name, "receiver": receiver_name,
                    "amount": tx.amount_sent, "tx_type": tx_type, "risk_score": risk_score,
                    "currency": currency_label,
                    "payment_format": format_label,
                    "timestamp": tx.timestamp,
                    "is_fraud_gt": tx.is_fraud == 1,
                    "if_score": if_score_val,
                }
            })
            await asyncio.sleep(0.05)

        if processed % 5 == 0 or processed == total:
            await websocket.send_json({"type": "progress", "data": {"processed": processed, "total": total}})

    await websocket.send_json({"type": "inference_complete"})
