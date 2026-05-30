# ============================================================
# STAR — Core Configuration
# Pydantic Settings loaded from .env
# ============================================================
from __future__ import annotations

from pathlib import Path
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── Gemini AI ────────────────────────────────────────────
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # ── Neo4j ────────────────────────────────────────────────
    NEO4J_URI: str = "bolt://localhost:7687"
    NEO4J_USER: str = "neo4j"
    NEO4J_PASSWORD: str = "password"
    NEO4J_DATABASE: str = "neo4j"
    NEO4J_RETRY_ATTEMPTS: int = 3
    NEO4J_RETRY_BACKOFF: float = 1.0

    # ── Model Paths ──────────────────────────────────────────
    BACKEND_DIR: Path = Path(__file__).resolve().parents[2]
    IF_MODEL_DIR: Path = BACKEND_DIR / "isolation_models"
    TGNN_DIR: Path = BACKEND_DIR / "portable_tgnn_inference"

    # ── Server ───────────────────────────────────────────────
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        # LAN access (Next.js dev server binds to all interfaces)
        "http://192.168.1.34:3000",
        "http://192.168.1.34:3001",
    ]

    # ── Pipeline Thresholds ──────────────────────────────────
    RISK_ALERT_THRESHOLD: float = 65.0
    IF_WEIGHT: float = 0.35
    TGNN_WEIGHT: float = 0.40
    RULE_WEIGHT: float = 0.25

    # ── Risk Level Thresholds (standardized across all services) ──
    RISK_THRESHOLD_NORMAL: float = 30.0
    RISK_THRESHOLD_MONITORING: float = 45.0
    RISK_THRESHOLD_MODERATE: float = 60.0
    RISK_THRESHOLD_HIGH: float = 75.0

    # ── Streaming ────────────────────────────────────────────
    STREAM_INTERVAL_MS: int = 2000  # how often synthetic txns are generated
    MAX_STREAM_HISTORY: int = 500


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
