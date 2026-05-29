# ============================================================
# STAR — Graph API Routes
# /graph/subgraph, /graph/path, /graph/communities, /graph/query
# ============================================================
from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query

from app.models.requests import GraphQueryRequest
from app.models.responses import GraphDataResponse, TraversalPathResponse
from app.services.neo4j_service import neo4j_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/graph", tags=["Graph"])


@router.get("/subgraph", response_model=GraphDataResponse)
async def get_subgraph(
    account_id: str = Query(..., description="Central account ID"),
    depth: int = Query(2, ge=1, le=4, description="Hop depth"),
) -> GraphDataResponse:
    """Return the transaction subgraph centered on an account."""
    return neo4j_service.get_subgraph(account_id, depth)


@router.get("/full", response_model=GraphDataResponse)
async def get_full_graph() -> GraphDataResponse:
    """Return the complete in-memory transaction graph."""
    return neo4j_service.get_full_graph()


@router.get("/path", response_model=TraversalPathResponse)
async def trace_path(
    from_id: str = Query(..., description="Source account"),
    to_id: str = Query(..., description="Target account"),
) -> TraversalPathResponse:
    """Trace the shortest transaction path between two accounts."""
    result = neo4j_service.trace_path(from_id, to_id)
    if result is None:
        raise HTTPException(404, f"No path found between {from_id} and {to_id}")
    return result


@router.get("/communities")
async def get_communities():
    """Run community detection and return node → community mapping."""
    communities = neo4j_service.community_detection()
    return {
        "communities": communities,
        "total_communities": len(set(communities.values())),
        "total_nodes": len(communities),
    }


@router.get("/stats")
async def graph_stats():
    """Return graph statistics."""
    return {
        "nodes": neo4j_service.node_count,
        "edges": neo4j_service.edge_count,
        "neo4j_connected": neo4j_service.is_connected,
        "backend": "neo4j" if neo4j_service.is_connected else "in-memory (networkx)",
    }


@router.post("/query")
async def run_cypher_query(body: GraphQueryRequest):
    """
    Execute a raw Cypher query (only available when Neo4j is connected).
    Restricted to READ operations only.
    """
    if not neo4j_service.is_connected:
        raise HTTPException(503, "Neo4j not connected. Connect a Neo4j instance to use raw queries.")

    # Safety: only allow MATCH/RETURN queries
    query_upper = body.cypher.strip().upper()
    if not query_upper.startswith("MATCH") and not query_upper.startswith("RETURN"):
        raise HTTPException(400, "Only MATCH/RETURN (read) queries are permitted.")

    try:
        with neo4j_service._driver.session() as session:
            result = session.run(body.cypher, **(body.parameters or {}))
            records = [dict(r) for r in result]
        return {"results": records, "count": len(records)}
    except Exception as e:
        raise HTTPException(500, f"Query failed: {e}")
