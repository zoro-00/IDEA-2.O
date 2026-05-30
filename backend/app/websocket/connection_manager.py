# ============================================================
# STAR — WebSocket Connection Manager
# Manages all active WebSocket connections
# ============================================================
from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Dict, Set

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manages active WebSocket connections.
    Supports broadcast, targeted send, and ping/pong heartbeat.
    """

    def __init__(self) -> None:
        self._connections: Dict[str, WebSocket] = {}
        self._created_at = time.time()

    async def connect(self, websocket: WebSocket, client_id: str) -> None:
        await websocket.accept()
        self._connections[client_id] = websocket
        logger.info("WS client connected: %s (total: %d)", client_id, len(self._connections))

    def disconnect(self, client_id: str) -> None:
        self._connections.pop(client_id, None)
        logger.info("WS client disconnected: %s (total: %d)", client_id, len(self._connections))

    async def send_json(self, client_id: str, data: dict) -> None:
        ws = self._connections.get(client_id)
        if ws:
            try:
                # prevent slow clients from stalling the loop
                await asyncio.wait_for(ws.send_json(data), timeout=5.0)
            except Exception as e:
                logger.warning("Send to %s failed: %s", client_id, e)
                self.disconnect(client_id)

    async def broadcast(self, data: dict) -> None:
        """Broadcast JSON message to all connected clients."""
        if not self._connections:
            return
        dead: Set[str] = set()
        for client_id, ws in list(self._connections.items()):
            try:
                await asyncio.wait_for(ws.send_json(data), timeout=5.0)
            except Exception as e:
                logger.warning("Broadcast to %s failed: %s", client_id, e)
                dead.add(client_id)
        for cid in dead:
            self.disconnect(cid)

    async def broadcast_text(self, text: str) -> None:
        """Broadcast raw text to all clients (for SSE-style streaming)."""
        dead: Set[str] = set()
        for client_id, ws in list(self._connections.items()):
            try:
                await ws.send_text(text)
            except Exception:
                dead.add(client_id)
        for cid in dead:
            self.disconnect(cid)

    async def heartbeat(self, interval: float = 30.0) -> None:
        """Periodic ping to keep connections alive."""
        while True:
            await asyncio.sleep(interval)
            if self._connections:
                await self.broadcast({"type": "ping", "ts": time.time()})

    @property
    def connection_count(self) -> int:
        return len(self._connections)

    @property
    def uptime_seconds(self) -> float:
        return time.time() - self._created_at


# ── Singletons ────────────────────────────────────────────────
stream_manager = ConnectionManager()   # /ws/stream  — transactions + alerts
graph_manager = ConnectionManager()    # /ws/graph   — live graph mutations
