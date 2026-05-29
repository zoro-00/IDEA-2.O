# ============================================================
# STAR — System API Routes
# /health, /metrics, /models/info
# ============================================================
from __future__ import annotations

import time

from fastapi import APIRouter

from app.models.responses import (
    MetricsResponse,
    ModelInfoResponse,
    ServiceStatus,
    SystemHealthResponse,
)
from app.services.isolation_forest_service import isolation_forest_service
from app.services.neo4j_service import neo4j_service
from app.services.tgnn_service import tgnn_service
from app.services.copilot_service import copilot_service
from app.websocket.connection_manager import stream_manager
from app.websocket.stream_manager import transaction_stream_manager

router = APIRouter(prefix="/system", tags=["System"])

_start_time = time.time()


@router.get("/health", response_model=SystemHealthResponse)
async def health_check() -> SystemHealthResponse:
    """Full health check of all STAR services."""
    services = [
        ServiceStatus(
            name="Isolation Forest",
            status="online" if isolation_forest_service.is_loaded else "offline",
            latency_ms=None,
            details="Ready for behavioral anomaly scoring" if isolation_forest_service.is_loaded
            else "Model not loaded",
        ),
        ServiceStatus(
            name="TGNN (GATe)",
            status="online" if tgnn_service.is_loaded else "offline",
            latency_ms=None,
            details="Graph intelligence ready" if tgnn_service.is_loaded
            else "Checkpoint not loaded",
        ),
        ServiceStatus(
            name="Neo4j / Graph Store",
            status="online" if neo4j_service.is_connected else "degraded",
            latency_ms=None,
            details="Neo4j connected" if neo4j_service.is_connected
            else f"Using in-memory graph ({neo4j_service.node_count} nodes)",
        ),
        ServiceStatus(
            name="AI Copilot (Gemini)",
            status="online" if copilot_service.is_loaded else "degraded",
            latency_ms=None,
            details="Ready" if copilot_service.is_loaded
            else "Set GEMINI_API_KEY in .env",
        ),
        ServiceStatus(
            name="WebSocket Stream",
            status="online" if transaction_stream_manager.is_running else "offline",
            latency_ms=None,
            details=f"{stream_manager.connection_count} active connections",
        ),
    ]

    online_count = sum(1 for s in services if s.status == "online")
    total = len(services)

    if online_count == total:
        overall = "healthy"
    elif online_count >= total - 2:
        overall = "degraded"
    else:
        overall = "unhealthy"

    return SystemHealthResponse(
        overall=overall,
        services=services,
        uptime_seconds=time.time() - _start_time,
    )


@router.get("/metrics", response_model=MetricsResponse)
async def get_metrics() -> MetricsResponse:
    """Runtime metrics for the STAR pipeline."""
    stats = transaction_stream_manager.get_stats()
    return MetricsResponse(
        transactions_scored=stats.get("transactions_processed", 0),
        alerts_generated=stats.get("alerts_generated", 0),
        avg_if_latency_ms=12.0,   # approximate
        avg_tgnn_latency_ms=45.0,
        avg_fusion_latency_ms=2.0,
        active_ws_connections=stream_manager.connection_count,
        uptime_seconds=time.time() - _start_time,
    )


@router.get("/models", response_model=ModelInfoResponse)
async def model_info() -> ModelInfoResponse:
    """Return metadata for loaded AI models."""
    if_meta = {}
    if isolation_forest_service.is_loaded:
        if_meta = {
            "type": "Isolation Forest",
            "features": 29,
            "threshold": isolation_forest_service.get_threshold(),
            "metadata": isolation_forest_service.get_metadata(),
            "status": "loaded",
        }
    else:
        if_meta = {"status": "not_loaded"}

    tgnn_meta = tgnn_service.get_model_info()

    return ModelInfoResponse(
        isolation_forest=if_meta,
        tgnn=tgnn_meta,
    )
