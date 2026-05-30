# ============================================================
# STAR — Alerts API Routes
# /alerts — list, detail, update status
# ============================================================
from __future__ import annotations

import logging
import time
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.models.requests import AlertUpdateRequest
from app.models.responses import AlertResponse

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/alerts", tags=["Alerts"])

__all__ = ["router", "add_alert"]

# ── In-memory alert store ─────────────────────────────────────
# In production this would be a database; here we keep a ring buffer
_ALERTS: List[dict] = []
MAX_ALERTS = 500


def add_alert(alert_data: dict) -> None:
    """Add an alert to the in-memory store (called from stream_manager)."""
    _ALERTS.insert(0, alert_data)
    if len(_ALERTS) > MAX_ALERTS:
        _ALERTS.pop()


@router.get("", response_model=List[AlertResponse])
async def list_alerts(
    status: Optional[str] = Query(None, description="Filter by status"),
    severity: Optional[str] = Query(None, description="Filter by severity"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> List[AlertResponse]:
    """Paginated list of alerts with optional filters."""
    filtered = _ALERTS

    if status:
        filtered = [a for a in filtered if a.get("status") == status]
    if severity:
        filtered = [a for a in filtered if a.get("severity") == severity]

    page = filtered[offset: offset + limit]
    return [AlertResponse(**_ensure_alert_fields(a)) for a in page]


@router.get("/{alert_id}", response_model=AlertResponse)
async def get_alert(alert_id: str) -> AlertResponse:
    """Get a single alert by ID."""
    for alert in _ALERTS:
        if alert.get("id") == alert_id:
            return AlertResponse(**_ensure_alert_fields(alert))
    raise HTTPException(404, f"Alert {alert_id} not found")


@router.patch("/{alert_id}", response_model=AlertResponse)
async def update_alert(alert_id: str, body: AlertUpdateRequest) -> AlertResponse:
    """Update alert status (open → investigating → escalated → closed)."""
    valid_statuses = {"open", "investigating", "escalated", "closed", "sar_filed"}
    if body.status not in valid_statuses:
        raise HTTPException(400, f"Invalid status. Must be one of: {valid_statuses}")

    for alert in _ALERTS:
        if alert.get("id") == alert_id:
            alert["status"] = body.status
            if body.assignee:
                alert["assignee"] = body.assignee
            return AlertResponse(**_ensure_alert_fields(alert))
    raise HTTPException(404, f"Alert {alert_id} not found")


@router.get("/stats/summary")
async def alert_stats():
    """Return alert summary statistics."""
    total = len(_ALERTS)
    by_status = {}
    by_severity = {}
    for a in _ALERTS:
        s = a.get("status", "open")
        sv = a.get("severity", "low")
        by_status[s] = by_status.get(s, 0) + 1
        by_severity[sv] = by_severity.get(sv, 0) + 1

    return {
        "total": total,
        "by_status": by_status,
        "by_severity": by_severity,
        "open_count": by_status.get("open", 0),
        "critical_count": by_severity.get("critical", 0),
    }


def _ensure_alert_fields(a: dict) -> dict:
    """Ensure all required AlertResponse fields have defaults."""
    return {
        "id": a.get("id", f"ALT-{str(uuid.uuid4())[:8].upper()}"),
        "type": a.get("type", "gnn_flagged"),
        "severity": a.get("severity", "medium"),
        "score": a.get("score", 0.0),
        "entities": a.get("entities", []),
        "entity_count": a.get("entity_count", len(a.get("entities", []))),
        "amount": a.get("amount", "$0.00"),
        "amount_raw": a.get("amount_raw", a.get("amountRaw", 0.0)),
        "time": a.get("time", datetime.now(timezone.utc).strftime("%H:%M:%S")),
        "timestamp": a.get("timestamp", time.time()),
        "description": a.get("description", ""),
        "status": a.get("status", "open"),
        "assignee": a.get("assignee"),
        "tags": a.get("tags", []),
        "related_transactions": a.get("related_transactions", a.get("relatedTransactions", [])),
        "graph_path": a.get("graph_path", a.get("graphPath")),
        "if_score": a.get("if_score"),
        "tgnn_score": a.get("tgnn_score"),
        "rule_hits": a.get("rule_hits", []),
    }
