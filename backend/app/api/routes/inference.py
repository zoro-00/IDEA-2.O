# =============================================================================
# STAR — Inference REST API Routes
# Exact port of inference/backend/demo_server.py REST endpoints
# /api/graph          — full transaction graph for Force-Graph visualization
# /api/cases          — pending review alert cases from Neo4j
# /api/cases/{id}/subgraph — subgraph for a specific case
# /api/cases/{id}/review   — approve/reject/escalate a case
# =============================================================================
from __future__ import annotations

import json
import logging

from fastapi import APIRouter, HTTPException

from app.services.neo4j_service import neo4j_service
from app.services.tgnn_service import inference_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["Inference"])


@router.get("/graph")
async def get_inference_graph():
    """
    Return the full transaction graph JSON for the Force-Graph visualization.
    Contains nodes (entities) and links (transactions) from the demo scenario.
    """
    # For the dynamic streaming trial, the graph starts empty and builds up live
    return {"nodes": [], "links": []}


@router.get("/scenario-info")
async def get_scenario_info():
    """Return metadata about the loaded inference model and scenario."""
    if not inference_service.is_loaded:
        return {"status": "not_loaded", "reason": "torch not available"}
    return {
        "model": "Hybrid: Rule Engine + GATe TGNN",
        "dataset": "IBM AML Medium_HI",
        "rule_weight": inference_service.RULE_WEIGHT,
        "gnn_weight": inference_service.GNN_WEIGHT,
        "transactions": len(inference_service.SCENARIO["transactions"]) if inference_service.SCENARIO else 0,
        "nodes": len(inference_service.SCENARIO["entity_names"]) if inference_service.SCENARIO else 0,
    }


@router.get("/cases")
async def get_inference_cases():
    """
    Return all pending AML alert cases from Neo4j.
    Exact port of demo_server.py /api/cases endpoint.
    """
    if not neo4j_service.is_connected:
        raise HTTPException(503, "Neo4j not connected.")

    async with neo4j_service._async_driver.session() as session:
        res = await session.run("""
            MATCH (a:Alert {status: 'PENDING_REVIEW'})-[:FLAGGED_BY]->(s:Person)
            MATCH (s)-[t:TRANSACT {tx_id: a.tx_id}]->(rec:Person)
            RETURN a.id AS case_id, a.tx_id AS tx_id, s.id AS sender, rec.id AS receiver,
                   t.amount AS amount, a.risk_score AS risk_score, a.tx_type AS tx_type,
                   a.currency AS currency, a.payment_format AS payment_format,
                   a.tx_timestamp AS timestamp,
                   toString(a.timestamp) AS created_at,
                   a.cycle_path AS cycle_path_json, a.cycle_edges AS cycle_edges_json
            ORDER BY a.risk_score DESC
        """)

        cases = []
        async for record in res:
            d = dict(record)
            d["cycle_path"] = json.loads(d["cycle_path_json"] or "[]")
            d["cycle_edges"] = json.loads(d["cycle_edges_json"] or "[]")
            del d["cycle_path_json"]
            del d["cycle_edges_json"]
            cases.append(d)
        return cases


@router.get("/cases/{case_id}/subgraph")
async def get_case_subgraph(case_id: str):
    """
    Return the subgraph for a specific alert case.
    Pattern-aware: Circular → cycle path, Dispersion/Gathering → hub+neighbors,
    else → ego-network of sender+receiver.
    """
    if not neo4j_service.is_connected:
        raise HTTPException(503, "Neo4j not connected.")

    async with neo4j_service._async_driver.session() as session:
        # Get alert metadata
        res = await session.run("""
            MATCH (a:Alert {id: $case_id})-[:FLAGGED_BY]->(s:Person)
            MATCH (s)-[t:TRANSACT {tx_id: a.tx_id}]->(r:Person)
            RETURN s.id AS sender, r.id AS receiver,
                   a.tx_type AS pattern_type, a.tx_id AS tx_id,
                   a.cycle_path AS cycle_path_json,
                   a.cycle_edges AS cycle_edges_json
        """, case_id=case_id)
        alert = await res.single()

        if not alert:
            return {"nodes": [], "links": [], "cycle_path": [], "pattern_type": "Normal"}

        sender = alert["sender"]
        receiver = alert["receiver"]
        pattern_type = alert["pattern_type"]
        cycle_path = json.loads(alert["cycle_path_json"] or "[]")
        cycle_edges = json.loads(alert["cycle_edges_json"] or "[]")

        links = []
        node_ids: set = set()
        node_statuses: dict = {}

        async def collect_rows(result):
            async for row in result:
                links.append({
                    "source": row["source"], "target": row["target"],
                    "tx_id": row["tx_id"], "amount": row["amount"],
                    "review_status": row["review_status"],
                })
                node_ids.add(row["source"])
                node_ids.add(row["target"])
                node_statuses[row["source"]] = row["src_status"]
                node_statuses[row["target"]] = row["dst_status"]

        if pattern_type == "Circular" and cycle_path:
            result = await session.run("""
                UNWIND $cycle_nodes AS nid
                MATCH (n:Person {id: nid})
                WITH collect(DISTINCT n) AS nodes
                UNWIND nodes AS a
                UNWIND nodes AS b
                WITH a, b WHERE a <> b
                MATCH (a)-[rel:TRANSACT]->(b)
                RETURN
                    a.id AS source, b.id AS target, a.status AS src_status,
                    b.status AS dst_status,
                    rel.tx_id AS tx_id, rel.amount AS amount,
                    rel.review_status AS review_status
            """, cycle_nodes=cycle_path)
            await collect_rows(result)

        elif pattern_type in ("Dispersion", "Gathering"):
            hub = sender if pattern_type == "Dispersion" else receiver
            result = await session.run("""
                MATCH (hub:Person {id: $hub})-[rel:TRANSACT]-(neighbor:Person)
                RETURN
                    startNode(rel).id AS source, endNode(rel).id AS target,
                    startNode(rel).status AS src_status, endNode(rel).status AS dst_status,
                    rel.tx_id AS tx_id, rel.amount AS amount,
                    rel.review_status AS review_status
            """, hub=hub)
            await collect_rows(result)

        else:
            result = await session.run("""
                MATCH (center:Person) WHERE center.id IN [$sender, $receiver]
                MATCH (center)-[rel:TRANSACT]-(neighbor:Person)
                RETURN
                    startNode(rel).id AS source, endNode(rel).id AS target,
                    startNode(rel).status AS src_status, endNode(rel).status AS dst_status,
                    rel.tx_id AS tx_id, rel.amount AS amount,
                    rel.review_status AS review_status
            """, sender=sender, receiver=receiver)
            await collect_rows(result)

        nodes = [{"id": nid, "status": node_statuses.get(nid, "STABLE")} for nid in node_ids]

        return {
            "nodes": nodes, "links": links,
            "cycle_path": cycle_path, "cycle_edges": cycle_edges,
            "pattern_type": pattern_type,
            "focus_tx": alert["tx_id"],
            "sender": sender, "receiver": receiver,
        }


@router.post("/cases/{case_id}/review")
async def review_inference_case(case_id: str, payload: dict):
    """
    Review a case: APPROVED (false positive), REJECTED (confirmed fraud),
    or ESCALATED. Updates Neo4j node and relationship status.
    Exact port of demo_server.py /api/cases/{case_id}/review endpoint.
    """
    if not neo4j_service.is_connected:
        raise HTTPException(503, "Neo4j not connected.")

    decision = payload.get("decision", "APPROVED")

    async with neo4j_service._async_driver.session() as session:
        await session.run("""
            MATCH (a:Alert {id: $case_id})-[:FLAGGED_BY]->(s:Person)
            MATCH (s)-[t:TRANSACT {tx_id: a.tx_id}]->(rec:Person)
            SET a.status = $decision, t.review_status = $decision
            FOREACH (ignore IN CASE WHEN $decision = 'REJECTED' THEN [1] ELSE [] END |
                SET s.status = 'CONFIRMED_FRAUD'
            )
            FOREACH (ignore IN CASE WHEN $decision = 'APPROVED' THEN [1] ELSE [] END |
                SET s.status = 'STABLE'
            )
        """, case_id=case_id, decision=decision)

    return {"status": "success", "decision": decision}
