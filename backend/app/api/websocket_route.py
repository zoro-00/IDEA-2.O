# ============================================================
# STAR — WebSocket API Route Handlers
# /ws/stream  — transactions + alerts real-time feed
# /ws/graph   — live graph mutation feed
# ============================================================
from __future__ import annotations

import logging
import uuid

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.websocket.connection_manager import graph_manager, stream_manager

logger = logging.getLogger(__name__)
router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/stream")
async def websocket_stream(websocket: WebSocket):
    """
    Primary WebSocket endpoint for real-time AML data.

    Messages pushed to client:
    - {type: "transaction", data: {...}}  — every scored transaction
    - {type: "alert", data: {...}}        — alerts above risk threshold
    - {type: "ping", ts: ...}             — heartbeat every 30s
    - {type: "system_status", data: ...}  — service health updates

    Client can send:
    - {type: "subscribe", channels: [...]}  — filter channels
    - {type: "ping"}                        — keep-alive
    """
    client_id = str(uuid.uuid4())[:8]
    await stream_manager.connect(websocket, client_id)

    # Send welcome message
    await stream_manager.send_json(client_id, {
        "type": "connected",
        "client_id": client_id,
        "message": "Connected to STAR real-time stream",
    })

    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "")

            if msg_type == "ping":
                await stream_manager.send_json(client_id, {"type": "pong"})
            else:
                logger.debug("WS message from %s: %s", client_id, data)

    except WebSocketDisconnect:
        stream_manager.disconnect(client_id)
        logger.info("Client %s disconnected from stream", client_id)
    except Exception as e:
        logger.error("WS stream error for %s: %s", client_id, e)
        stream_manager.disconnect(client_id)


@router.websocket("/ws/graph")
async def websocket_graph(websocket: WebSocket):
    """
    WebSocket for live graph mutations only.

    Messages pushed:
    - {type: "graph_update", nodes: [...], edges: [...]}
    - {type: "node_flagged", node: {...}}
    """
    client_id = str(uuid.uuid4())[:8]
    await graph_manager.connect(websocket, client_id)

    await graph_manager.send_json(client_id, {
        "type": "connected",
        "message": "Connected to STAR graph stream",
    })

    try:
        while True:
            await websocket.receive_text()  # keep-alive
    except WebSocketDisconnect:
        graph_manager.disconnect(client_id)
    except Exception as e:
        logger.error("WS graph error for %s: %s", client_id, e)
        graph_manager.disconnect(client_id)
