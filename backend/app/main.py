# ============================================================
# STAR — FastAPI Application Entry Point
# Real-Time AML Intelligence Orchestration Backend
# ============================================================
from __future__ import annotations

import asyncio
import logging
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("star.main")


def create_app() -> FastAPI:
    app = FastAPI(
        title="STAR — Suspicious Transaction Analysis & Response",
        description=(
            "Real-time AML intelligence platform combining Isolation Forest, "
            "Graph Attention Networks (GATe/TGNN), deterministic rule engine, "
            "and LangChain + Gemini AI copilot."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # ── CORS ──────────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Register Routers ──────────────────────────────────────
    from app.api.routes.score import router as score_router
    from app.api.routes.alerts import router as alerts_router
    from app.api.routes.graph import router as graph_router
    from app.api.routes.copilot import router as copilot_router
    from app.api.routes.system import router as system_router
    from app.api.websocket_route import router as ws_router

    app.include_router(score_router)
    app.include_router(alerts_router)
    app.include_router(graph_router)
    app.include_router(copilot_router)
    app.include_router(system_router)
    app.include_router(ws_router)

    # ── Root endpoint ─────────────────────────────────────────
    @app.get("/")
    async def root():
        return {
            "name": "STAR AML Intelligence Backend",
            "version": "1.0.0",
            "status": "online",
            "docs": "/docs",
            "health": "/system/health",
            "ws_stream": "/ws/stream",
            "ws_graph": "/ws/graph",
        }

    @app.get("/health")
    async def quick_health():
        """Quick liveness probe."""
        return {"status": "ok", "ts": time.time()}

    # ── Lifecycle ─────────────────────────────────────────────
    @app.on_event("startup")
    async def startup():
        logger.info("=" * 60)
        logger.info("🚀 STAR AML Intelligence Backend starting up...")
        logger.info("=" * 60)

        # 1. Load Isolation Forest
        logger.info("[1/5] Loading Isolation Forest Anomaly Engine...")
        from app.services.isolation_forest_service import isolation_forest_service
        try:
            isolation_forest_service.load()
            if isolation_forest_service.is_loaded:
                logger.info("  └── ✅ Isolation Forest loaded (Threshold: %s)", isolation_forest_service.get_threshold())
            else:
                logger.warning("  └── ⚠️ Isolation Forest not loaded; operating in degraded mode")
        except Exception as e:
            logger.error("  └── ❌ FAILURE: Isolation Forest load raised exception: %s", e)

        # 2. Load TGNN
        logger.info("[2/5] Loading TGNN (GATe) Graph Intelligence Engine...")
        from app.services.tgnn_service import tgnn_service
        try:
            tgnn_service.load()
            if tgnn_service.is_loaded:
                logger.info("  └── ✅ TGNN Engine loaded")
            else:
                logger.warning("  └── ⚠️ TGNN Engine not loaded; operating without graph NN inference")
        except Exception as e:
            logger.error("  └── ❌ FAILURE: TGNN load raised exception: %s", e)

        # 3. Connect Neo4j
        logger.info("[3/5] Connecting to Graph Store (Neo4j/NetworkX)...")
        from app.services.neo4j_service import neo4j_service
        try:
            neo4j_service.connect()
            if neo4j_service.is_connected:
                logger.info("  └── ✅ SUCCESS: Neo4j connected")
            else:
                logger.info("  └── ⚠️ FALLBACK: Neo4j unreachable, using In-Memory NetworkX graph")
        except Exception as e:
            logger.error("  └── ❌ FAILURE: Graph store connection error: %s", e)

        # 4. Load Copilot
        logger.info("[4/5] Initializing LangChain + Gemini Copilot...")
        from app.services.copilot_service import copilot_service
        try:
            copilot_service.load()
            if copilot_service.is_loaded:
                logger.info("  └── ✅ SUCCESS: Copilot initialized")
            else:
                logger.info("  └── ⚠️ SKIPPED: GEMINI_API_KEY not found in .env")
        except Exception as e:
            logger.error("  └── ❌ FAILURE: Copilot load issue: %s", e)

        # 5. Start Background Stream Loop
        logger.info("[5/5] Starting Real-Time Transaction Stream Loop...")
        from app.websocket.stream_manager import transaction_stream_manager
        try:
            await transaction_stream_manager.start()
            logger.info("  └── ✅ SUCCESS: Stream loop running (every %dms)", settings.STREAM_INTERVAL_MS)
        except Exception as e:
            logger.error("  └── ❌ FAILURE: Failed to start stream loop: %s", e)

        # Start WebSocket heartbeat
        from app.websocket.connection_manager import stream_manager
        asyncio.create_task(stream_manager.heartbeat(30.0))

        logger.info("=" * 60)
        logger.info("✅ STAR backend fully initialized and ready to serve requests.")
        logger.info("   Docs:     http://localhost:%d/docs", settings.PORT)
        logger.info("   Health:   http://localhost:%d/system/health", settings.PORT)
        logger.info("   WS:       ws://localhost:%d/ws/stream", settings.PORT)
        logger.info("=" * 60)

    @app.on_event("shutdown")
    async def shutdown():
        from app.websocket.stream_manager import transaction_stream_manager
        await transaction_stream_manager.stop()
        logger.info("STAR backend shut down")

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
        log_level="info",
    )
