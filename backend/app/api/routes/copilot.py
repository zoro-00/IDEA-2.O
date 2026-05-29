# ============================================================
# STAR — Copilot API Routes
# /copilot/query (streaming), /copilot/sar, /copilot/sessions
# ============================================================
from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.requests import CopilotQueryRequest, SARRequest
from app.models.responses import AIMessageResponse, SARResponse
from app.services.copilot_service import copilot_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/copilot", tags=["Copilot"])


@router.post("/query")
async def copilot_query(request: CopilotQueryRequest):
    """
    Query the STAR AI copilot. Streams response as Server-Sent Events.
    
    Frontend should use EventSource or fetch with stream reading.
    """
    async def generate():
        yield "data: "
        async for chunk in copilot_service.stream_query(
            message=request.message,
            session_id=request.session_id,
            context=request.context,
        ):
            # Escape newlines for SSE
            safe_chunk = chunk.replace("\n", "\\n")
            yield f"data: {safe_chunk}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/query/sync")
async def copilot_query_sync(request: CopilotQueryRequest) -> AIMessageResponse:
    """
    Non-streaming copilot query — returns complete response.
    Useful for simple integrations.
    """
    import uuid
    from datetime import datetime, timezone

    content = await copilot_service.query(
        message=request.message,
        session_id=request.session_id,
        context=request.context,
    )
    return AIMessageResponse(
        id=str(uuid.uuid4()),
        role="assistant",
        content=content,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.post("/sar", response_model=SARResponse)
async def generate_sar(request: SARRequest):
    """Generate a SAR (Suspicious Activity Report) draft using Gemini AI."""
    from app.services.neo4j_service import neo4j_service

    risk_summary = {
        "account_id": request.account_id,
        "alert_count": len(request.alert_ids),
    }

    try:
        sar_data = await copilot_service.generate_sar(
            account_id=request.account_id,
            alert_ids=request.alert_ids,
            investigation_notes=request.investigation_notes,
            risk_summary=risk_summary,
        )
        return SARResponse(**sar_data)
    except Exception as e:
        raise HTTPException(500, f"SAR generation failed: {e}")


@router.get("/status")
async def copilot_status():
    """Check copilot service status."""
    return {
        "available": copilot_service.is_loaded,
        "model": "gemini-2.0-flash" if copilot_service.is_loaded else None,
        "message": (
            "Copilot online" if copilot_service.is_loaded
            else "Set GEMINI_API_KEY in backend/.env to enable AI copilot"
        ),
    }
